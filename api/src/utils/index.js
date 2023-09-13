import otpGenerator from "otp-generator";
import { getCricketScoreFromCrawl } from "./crawler";
import { logger } from "./logger";

export const generateOtp = () => {
  try {
    return otpGenerator.generate(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
  } catch (error) {
    throw new Error(`generateOtp failed with ${error.message}`);
  }
};

export const timeDiffinMins = (time) => {
  try {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - time;
    const mins = Math.floor(timeDiff / 60 / 1000);
    return mins;
  } catch (error) {
    throw new Error(`timeDiffinMins failed with ${error.message}`);
  }
};

export const timeDiffinSecs = (time) => {
  try {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - time;
    const secs = Math.floor(timeDiff / 1000);
    return secs;
  } catch (error) {
    throw new Error(`timeDiffinSecs failed with ${error.message}`);
  }
};

export const generateFancyOdds = async (event) => {
  try {
    let fancyOdds = [];
    let format;
    const t20Tournaments = [
      "cricket_big_bash",
      "cricket_caribbean_premier_league",
      "cricket_international_t20",
      "cricket_ipl",
      "cricket_psl",
    ];
    const odiTournaments = ["cricket_odi", "cricket_icc_world_cup"];
    const testTournaments = ["cricket_test_match"];
    format = t20Tournaments.includes(event.sport_key)
      ? "t20"
      : odiTournaments.includes(event.sport_key)
        ? "odi"
        : testTournaments.includes(event.sport_key)
          ? "test"
          : null;
    if (!format) {
      return fancyOdds;
    }
    const avgRuns = {
      test: {
        firstOverFav: 3,
        firstOverUnder: 2,
        avgRunRate: 3,
      },
      odi: {
        firstOverFav: 5,
        firstOverUnder: 4,
        avgRunRate: 6,
      },
      t20: {
        firstOverFav: 8,
        firstOverUnder: 7,
        avgRunRate: 8,
      },
    };
    const allOutcome = event.bookmakers[0]?.markets[0]?.outcomes;
    if (!allOutcome) throw new Error("cannot extract outcomes");
    // filtering to remove draw outcome
    const teamOutcome = allOutcome.filter(
      (a) => a.name == event.home_team || a.name == event.away_team
    );
    // sorting outcomes in ascending order
    // (all outcomes itself is sorted, this is for assurance)
    const sortedOutcome = teamOutcome.sort((a, b) => a.price - b.price);

    // sorting team scores
    const teamScores = {
      favorite: {
        name: sortedOutcome[0].name,
        firstOver: avgRuns[format].firstOverFav,
        fiveOver: avgRuns[format].avgRunRate * 5 + 1,
        tenOver: avgRuns[format].avgRunRate * 10 + 3,
      },
      underDog: {
        name: sortedOutcome[1].name,
        firstOver: avgRuns[format].firstOverUnder,
        fiveOver: avgRuns[format].avgRunRate * 5 - 1,
        tenOver: avgRuns[format].avgRunRate * 10 - 1,
      },
    };

    let active = timeDiffinMins(new Date(event?.commence_time)) < -5 ? true : false; // 5 mins before match start, fancy odds will be suspended. was 15 mins before
    if (active) {
      /* this is an added protection against test cricket matches.
      the commince_time from the event info will change with every
      matchday of a test cricket. */
      // console.log([event.home_team, event.away_team], event.commence_time);
      const gameInfo = await getCricketScoreFromCrawl(
        [event.home_team, event.away_team],
        event.commence_time
      );
      // console.log(gameInfo);
      if (!gameInfo.format) {
        logger.error("game score not available; suspending fancy odds");
        active = false;
      }
    }
    const common = {
      sport_key: event.sport_key,
      sport_title: event.sport_title,
      eventId: event.id,
      commence_time: event.commence_time,
      teams: [event.home_team, event.away_team],
      active,
    };
    fancyOdds = [
      {
        id: 0,
        title: "toss_odd",
        description: event.home_team,
        backOdd: 98,
        layOdd: 0,
        backScore: 0,
        layScore: 0,
        primaryKey: event.home_team,
        secondaryKey: "toss",
        ...common,
      },
      {
        id: 1,
        title: "toss_odd",
        description: event.away_team,
        backOdd: 98,
        layOdd: 0,
        backScore: 0,
        layScore: 0,
        primaryKey: event.away_team,
        secondaryKey: "toss",
        ...common,
      },
      {
        id: 2,
        title: "fancy_odd",
        description: `${teamScores.favorite.name} first over run`,
        backOdd: 100,
        layOdd: 100,
        backScore: teamScores.favorite.firstOver,
        layScore: teamScores.favorite.firstOver - 1,
        primaryKey: teamScores.favorite.name,
        secondaryKey: "firstOverRun",
        ...common,
      },
      {
        id: 2,
        title: "fancy_odd",
        description: `${teamScores.underDog.name} first over run`,
        backOdd: 100,
        layOdd: 100,
        backScore: teamScores.underDog.firstOver,
        layScore: teamScores.underDog.firstOver - 1,
        primaryKey: teamScores.underDog.name,
        secondaryKey: "firstOverRun",
        ...common,
      },
      {
        id: 4,
        title: "fancy_odd",
        description: `${teamScores.favorite.name} first 5 over run`,
        backOdd: 90,
        layOdd: 110,
        backScore: teamScores.favorite.fiveOver,
        layScore: teamScores.favorite.fiveOver - 2,
        primaryKey: teamScores.favorite.name,
        secondaryKey: "fiveOverRun",
        ...common,
      },
      {
        id: 5,
        title: "fancy_odd",
        description: `${teamScores.underDog.name} first 5 over run`,
        backOdd: 120,
        layOdd: 80,
        backScore: teamScores.underDog.fiveOver,
        layScore: teamScores.underDog.fiveOver - 2,
        primaryKey: teamScores.underDog.name,
        secondaryKey: "fiveOverRun",
        ...common,
      },
      {
        id: 6,
        title: "fancy_odd",
        description: `${teamScores.favorite.name} first 10 over run`,
        backOdd: 90,
        layOdd: 110,
        backScore: teamScores.favorite.tenOver,
        layScore: teamScores.favorite.tenOver - 3,
        primaryKey: teamScores.favorite.name,
        secondaryKey: "tenOverRun",
        ...common,
      },
      {
        id: 7,
        title: "fancy_odd",
        description: `${teamScores.underDog.name} first 10 over run`,
        backOdd: 80,
        layOdd: 120,
        backScore: teamScores.underDog.tenOver,
        layScore: teamScores.underDog.tenOver - 4,
        primaryKey: teamScores.underDog.name,
        secondaryKey: "tenOverRun",
        ...common,
      },
      {
        id: 8,
        title: "fancy_odd",
        description: `player of the match: ${teamScores.favorite.name}`,
        backOdd: 80,
        layOdd: 0,
        backScore: 0,
        layScore: 0,
        primaryKey: teamScores.favorite.name,
        secondaryKey: "playerOfTheMatch",
        ...common,
      },
      {
        id: 9,
        title: "fancy_odd",
        description: `player of the match: ${teamScores.underDog.name}`,
        backOdd: 120,
        layOdd: 0,
        backScore: 0,
        layScore: 0,
        primaryKey: teamScores.underDog.name,
        secondaryKey: "playerOfTheMatch",
        ...common,
      },
    ];
    return fancyOdds;
  } catch (error) {
    console.log(error);
    throw new Error(`generate fancy odds failed: ${error.message}`);
  }
};
