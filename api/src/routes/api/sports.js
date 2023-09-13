// ODDS API
// Docs: https://the-odds-api.com/liveapi/guides/v4/#schema-5
//  GET requests
// /api/odds/sports
// /api/odds/sportsOdds
// /api/odds/score
// /api/odds/historicalOdds
// /api/odds/eventOdds/:eventId

import express from "express";
import { logger } from "../../utils/logger.js";
import config from "../../config/index";
import axios from "axios";
import authorizer from "../../middleware/authorizer.js";
import NodeCache from "node-cache";
import db from "../../db/models/index.js";
import { txEvent } from "../../utils/transaction.js";
import { query, body, validationResult, param } from "express-validator";
// import { sendTelegramMessageAdmin } from "../../utils/telegram.js";
import { getCricketScoreFromCrawl } from "../../utils/crawler.js";
import { generateFancyOdds } from "../../utils/index.js";

const cachedData = new NodeCache({
  stdTTL: 5, // 5 seconds
  checkperiod: 1, // 1 second
  maxKeys: -1, // max number of keys in cache, -1 means unlimited
});
const fetchTime = config.bookmakerFetchTime;
const router = express.Router();

router
  // get all sports, get limit query param to limit number of sports
  .get("/", query("limit").optional().isNumeric(), async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).send(errors.array());
      }

      let result;
      const { limit = 5 } = req.query; // limit number of sports from each group to be returned
      const key = `sports_${limit}`;
      const value = cachedData.get(key); // check if data is cached
      if (value) return res.status(200).send(value);
      const resData = await axios.get(`${config.oddsAPI}/sports/?apiKey=${config.oddsAPIKey}`);
      result = resData.data;
      // for every result, limit by each unique group sorted by commence_time asc. if limit = 20, then max 20 games from each group will be returned
      const uniqueGroups = [...new Set(result.map((item) => item.group))]; // get unique groups
      const limitedResult = [];
      uniqueGroups.forEach((group) => {
        const groupData = result.filter((item) => item.group === group); // get all data for each group
        const sortedGroupData = groupData.sort(
          (a, b) => new Date(a.commence_time) - new Date(b.commence_time)
        ); // sort by commence_time asc
        limitedResult.push(...sortedGroupData.slice(0, parseInt(limit))); // push first limit items to limitedResult
      });
      result = limitedResult;
      cachedData.set(key, result);
      return res.status(200).send(result);
    } catch (error) {
      // logger.error(`Sports:get:/: ${error}`); // Disabled due to too many logs spam when odds are not available
      res.status(400).send("Request Failed");
    }
  })
  .get(
    "/odds",
    query("limit").optional().isNumeric(),
    query("sport").isString().trim().escape(),
    query("regions").optional().isString().trim().escape(),
    query("markets").optional().isString().trim().escape(),
    query("dateFormat").optional().isString().trim().escape(),
    query("oddsFormat").optional().isString().trim().escape(),
    query("eventId").optional().isString().trim().escape(),
    query("bookmakers").optional().isString().trim().escape(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }

        let result;
        const {
          limit = 5, // limit number of games to be returned
          sport,
          regions = "eu", // us, uk, au, eu. Default is eu (Europe) as per client request
          markets = "h2h",
          dateFormat = "iso",
          oddsFormat = "decimal",
          eventId,
          bookmakers = "", // default betfair as per client request. Leave empty for all bookmakers. Bookmakers can be betfair,unibet_eu,pinnacle,onexbet,marathonbet,betonlineag,mybookieag
        } = req.query;

        let queryParams = {};
        if (eventId) queryParams.eventId = eventId;
        if (bookmakers) queryParams.bookmakers = bookmakers;
        const key = `${"sportOdds" +
          sport +
          limit +
          regions +
          markets +
          dateFormat +
          oddsFormat +
          eventId +
          bookmakers
          }`;

        const value = cachedData.get(key); // cached value
        if (value) return res.status(200).send(value);
        const resData = await axios.get(
          `${config.oddsAPI}/sports/${sport}/odds/?apiKey=${config.oddsAPIKey}&regions=${regions}&markets=${markets}&dateFormat=${dateFormat}&oddsFormat=${oddsFormat}`,
          { params: queryParams }
        );
        result = resData.data;
        // const remainingRequest = resData.headers["x-requests-remaining"];
        // if (remainingRequest < 1000) {
        //   sendTelegramMessageAdmin("requestQuotaWarning");
        // }
        result = result.filter((item) => item.bookmakers.length > 0); // remove games with no bookmakers
        // limit sorted by commence_time asc. if limit = 20, then max 20 will be returned
        const sortedResult = result.sort(
          (a, b) => new Date(a.commence_time) - new Date(b.commence_time)
        ); // sort by commence_time asc
        result = sortedResult.slice(0, parseInt(limit)); // push first 20 items to limitedResult

        cachedData.set(key, result);
        return res.status(200).send(result);
      } catch (error) {
        const err = error.response ? error.response?.data?.message : error.message;
        // logger.error(`Sports:get:/odds: ${err}`); // Disabled due to too many logs spam when odds are not available
        if (err == "Request quota has been reached. See usage plans at https://the-odds-api.com") {
          // sendTelegramMessageAdmin(err); // DISABLED FOR NOW DUE TO TOO MANY SPAM
        }
        res.status(400).send("Request Failed");
      }
    }
  )
  .get(
    "/score",
    query("sport").isString().trim().escape(),
    query("group").optional().isString().trim().escape(),
    query("teams").optional().isString().trim().escape(),
    query("commence_time").optional().isString().trim().escape(),
    query("daysFrom").optional().trim().escape(),
    query("dateFormat").optional().isString().trim().escape(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }

        let result;
        const {
          sport,
          group,
          teams,
          commence_time,
          daysFrom,
          dateFormat = "iso",
        } = req.query; // sport = sport_key, group = game category (i.e Cricket, Tennis, Soccer, etc), teams = team names separated by comma. required for cricket only (i.e India,England)
        const key = `${"score" + sport + group + daysFrom + dateFormat}`;

        // if cricket and teams, get score from crawler
        if (group === "Cricket" && teams && commence_time) {
          const teamsArr = teams.split(",");
          const score = await getCricketScoreFromCrawl(teamsArr, commence_time);
          if (score) return res.status(200).send(score);
        }

        const value = cachedData.get(key); // cached value
        if (value) return res.status(200).send(value);

        let queryParams = {};
        if (daysFrom) queryParams.daysFrom = parseInt(daysFrom);
        const resData = await axios.get(
          `${config.oddsAPI}/sports/${sport}/scores/?apiKey=${config.oddsAPIKey}&dateFormat=${dateFormat}`,
          { params: queryParams }
        );
        result = resData.data;
        cachedData.set(key, result);

        return res.status(200).send(result);
      } catch (error) {
        // logger.error(`Sports:get:/score: ${error}`); // Disabled due to too many logs spam when odds are not available
        res.status(400).send("Request Failed");
      }
    }
  )
  .get(
    "/historicalOdds",
    query("sport").isString().trim().escape(),
    query("regions").optional().isString().trim().escape(),
    query("markets").optional().isString().trim().escape(),
    query("dateFormat").optional().isString().trim().escape(),
    query("oddsFormat").optional().isString().trim().escape(),
    query("eventId").optional().isString().trim().escape(),
    query("bookmakers").optional().isString().trim().escape(),
    query("date").trim().escape(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }
        let result;
        const {
          sport,
          regions = "eu",
          markets = "h2h",
          dateFormat = "iso",
          oddsFormat = "decimal",
          eventId,
          bookmakers,
          date,
        } = req.query;

        let queryParams = {};
        if (eventId) queryParams.eventId = eventId;
        if (bookmakers) queryParams.bookmakers = bookmakers;

        const key = `${"historicalOdds" +
          sport +
          regions +
          markets +
          dateFormat +
          oddsFormat +
          eventId +
          bookmakers +
          date
          }`;
        const value = cachedData.get(key); // cached value

        if (value) return res.status(200).send(value);

        const resData = await axios.get(`${config.oddsAPI}/sports/${sport}/odds-history/?apiKey=${config.oddsAPIKey}&regions=${regions}&markets=${markets}&date=${date}`,
          { params: queryParams }
        );
        result = resData.data;
        cachedData.set(key, result);

        return res.status(200).send(result);
      } catch (error) {
        // logger.error(`Sports:get:/historicalOdds: ${error}`); // Disabled due to too many logs spam when odds are not available
        res.status(400).send("Request Failed");
      }
    }
  )
  // *** FOR TESTING ***
  // ====================
  // .get("/gameScore", async (req, res) => {
  //   try {
  //     const { team1, team2, time } = req.query;
  //     const result = await getCricketScoreFromCrawl([team1, team2], time);
  //     res.send(result);
  //   } catch (error) {
  //     logger.error(`Sports:get:/gamescore: ${error}`);
  //     res.status(400).send("Request Failed");
  //   }
  // })
  .get(
    "/eventOdds/:eventId",
    query("sport").isString().trim().escape(),
    query("regions").optional().isString().trim().escape(),
    query("markets").optional().isString().trim().escape(),
    query("dateFormat").optional().isString().trim().escape(),
    query("oddsFormat").optional().isString().trim().escape(),
    query("bookmakers").optional().isString().trim().escape(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }
        let result;
        const { eventId } = req.params;
        const {
          sport,
          regions = "eu",
          markets = "h2h",
          dateFormat = "iso",
          oddsFormat = "decimal",
          bookmakers,
        } = req.query;

        let queryParams = {};
        if (bookmakers) queryParams.bookmakers = bookmakers;
        const key = `${"eventOdds" +
          sport +
          regions +
          markets +
          dateFormat +
          oddsFormat +
          eventId +
          bookmakers
          }`;

        const value = cachedData.get(key); // cached value
        if (value) return res.status(200).send(value);

        const resData = await axios.get(
          `${config.oddsAPI}/sports/${sport}/events/${eventId}/odds?apiKey=${config.oddsAPIKey}&regions=${regions}&markets=${markets}&dateFormat=${dateFormat}&oddsFormat=${oddsFormat}`,
          { params: queryParams }
        );
        result = resData.data;
        cachedData.set(key, result);

        return res.status(200).send(result);
      } catch (error) {
        const err = error.response ? error.response?.data?.message : error;
        // logger.error(`Sports:get:/eventOdds: ${err}`); // Disabled due to too many logs spam when odds are not available
        res.status(400).send("Request Failed");
      }
    }
  )
  .get(
    "/fancyOdds/:eventId",
    query("sport").isString().trim().escape(),
    query("regions").optional().isString().trim().escape(),
    query("markets").optional().isString().trim().escape(),
    query("dateFormat").optional().isString().trim().escape(),
    query("oddsFormat").optional().isString().trim().escape(),
    query("bookmakers").optional().isString().trim().escape(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }
        const { eventId } = req.params;
        const {
          sport,
          regions = "eu",
          markets = "h2h",
          dateFormat = "iso",
          oddsFormat = "decimal",
          bookmakers = "betfair",
        } = req.query;
        const key = `${"fancyOdds" +
          sport +
          regions +
          markets +
          dateFormat +
          oddsFormat +
          eventId
          }`;
        const value = cachedData.get(key); // cached value
        if (value) return res.status(200).send(value);

        const resData = await axios.get(
          `${config.oddsAPI}/sports/${sport}/events/${eventId}/odds?apiKey=${config.oddsAPIKey}&regions=${regions}&dateFormat=${dateFormat}&oddsFormat=${oddsFormat}&bookmakers=${bookmakers}`
        );
        const result = resData.data;
        const fancyOdds = await generateFancyOdds(result);
        cachedData.set(key, fancyOdds); // cache the data

        return res.status(200).send(fancyOdds);
      } catch (error) {
        const err = error.response ? error.response?.data?.message : error;
        logger.error(`Sports:get:/fancyOdds: ${err}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  .post(
    "/fancyBet",
    authorizer,
    body("oddsInfo").isObject(),
    body("betType").isIn(["back", "lay"]).isString().trim().escape(),
    body("markets").optional().isString().trim().escape(),
    body("dateFormat").optional().isString().trim().escape(),
    body("oddsFormat").optional().isString().trim().escape(),
    body("regions").optional().isString().trim().escape(),
    body("stake").isInt({ min: 100, max: 500000 }), // min bet 100, max bet 5,00,000
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }

        const MAXPROFIT = 2000000; // max profit (20 Lakhs), if profit is more than this, profit will be set to this value
        const {
          oddsInfo,
          betType,
          stake,
          regions = "eu", // us, uk, au, eu. Default is eu (Europe) as per client request
          markets = "h2h",
          dateFormat = "iso",
          oddsFormat = "decimal",
        } = req.body;
        const user = req.user;
        const actualOdd = betType == "lay" ? oddsInfo.layOdd / 100 : oddsInfo.backOdd / 100;


        // Calculations
        // EXAMPLE IF:
        // Stake: 10,000
        // Odds: 1.43
        // Back Bet
        // 1. Liability: 10,000 (=Stake)
        // 2. PL: 4300
        // Lay Bet
        // 1. Liability: 4300 (=PL)
        // 2. PL: 10,000 (=Stake)
        // Back Bet is won when selected team wins Lay Bet is won when selected team loses

        let pnl = parseInt(betType == "lay" ? stake : Math.abs((stake * actualOdd) - stake)); // math.abs in case odds are less than 1, like 0.98
        if (pnl > MAXPROFIT) pnl = MAXPROFIT; // max profit (20 Lakhs), if profit is more than this, profit will be set to this value
        const liability = betType == "lay" ? pnl : stake; // liability = pnl for lay bet, else stake for back bet

        // check if user already has a bet on this event to avoid multiple bets on same event
        const existingBet = await db.Bet.findOne({
          where: {
            user_id: user.id,
            event_id: oddsInfo.eventId,
            sport_id: oddsInfo.sport_key,
            bookmaker: "fancyOdd",
            bet_type: betType,
            category: "sports_fancy",
            status: "OPEN",
          },
        });

        if (existingBet) {
          logger.error(`user ${user.id} already has a bet on this event`);
          return res.status(400).send("You already have a bet on this event");
        }

        // check if user has sufficient balance to cover liability
        if (user.credit < liability) {
          logger.error(`user ${user.id} has insufficient balance for placing sports fancy bet`);
          // return http status 402 (payment required) with message. 402 so we can redirect to deposit page on frontend
          return res.status(402).send(`Insufficient balance. Please deposit ₹ ${(liability - user.credit).toLocaleString()} to place bet`);
        }

        // Verifying user sent data on server side as well
        const resData = await axios.get(`${config.oddsAPI}/sports/${oddsInfo.sport_key}/events/${oddsInfo.eventId}/odds?apiKey=${config.oddsAPIKey}&regions=${regions}&markets=${markets}&dateFormat=${dateFormat}&oddsFormat=${oddsFormat}`);
        const result = resData.data;
        const fancyBets = await generateFancyOdds(result);
        const selectedOutcome = fancyBets.find((obj) => obj.id == oddsInfo.id);
        if (!selectedOutcome) return res.status(400).send("requested bet not found");
        if (!selectedOutcome.active) return res.status(400).send("event suspended");
        const currentOdd = betType == "back" ? selectedOutcome.backOdd : selectedOutcome.layOdd;
        const selectedOdd = betType == "back" ? oddsInfo.backOdd : oddsInfo.layOdd;
        if (currentOdd != selectedOdd) {
          logger.error(`odds changed for bet when tried placing sports bet by user ${user.id}`);
          return res.status(400).send("Odds changed. Please try placing betslip again");
        }

        // Check if game is completed. since fancy bets are for cricket only not checking group, else we can check group as well
        if (result.home_team && result.away_team && oddsInfo.commence_time) {
          const score = await getCricketScoreFromCrawl([result.home_team, result.away_team], oddsInfo.commence_time);
          if (score && score?.completed) return res.status(200).send(`Match already completed. Can't place bet`);
        }

        // calculate profit/pnl
        const bet_details = {
          user_id: user.id,
          category: "sports_fancy",
          event_id: oddsInfo.eventId,
          sport_id: oddsInfo.sport_key,
          bookmaker: "fancyOdd",
          region: regions,
          market: oddsInfo,
          bet_type: betType,
          stake: parseInt(stake),
          commence_time: oddsInfo.commence_time,
          // selectedTeam: bet.name,
          selectedTeam: oddsInfo.description, // bet description here
          selectedOdd: actualOdd,
          homeTeam: result.home_team,
          awayTeam: result.away_team,
          liability: liability,
          pnl: parseInt(pnl),
          status: "OPEN", // OPEN, VOID, WON, LOST
        };
        const betData = await db.Bet.create(bet_details);
        if (betData) {
          const credit = user.credit - parseInt(liability);
          await user.update({ credit });
          let tx = {
            user_id: user.id,
            type: "debit",
            amount: parseInt(liability),
            game_data: {
              game: "oddsBet",
              eventId: betData.event_id,
              sportId: betData.sport_id,
              type: betData.bet_type,
            },
            status: "success",
            remark: `Bet of type ${betType} placed on ${betData.selectedTeam} at odds of ${actualOdd} with stake of ₹ ${betData.stake} and liability of ₹ ${liability}`,
            reference: betData.id,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
        return res.status(200).send(true);
      } catch (error) {
        logger.error(`Sports:post:/fancyBet: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  .post(
    "/bet",
    authorizer,
    body("oddsInfo").isObject(),
    body("bet").isObject(),
    body("betType").isIn(["back", "lay"]).isString().trim().escape(),
    body("markets").optional().isString().trim().escape(),
    body("dateFormat").optional().isString().trim().escape(),
    body("oddsFormat").optional().isString().trim().escape(),
    body("regions").optional().isString().trim().escape(),
    body("stake").isInt({ min: 100, max: 500000 }), // min bet 100, max bet 5,00,000
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).send(errors.array());
        }
        const MAXPROFIT = 2000000; // max profit (20 Lakhs), if profit is more than this, profit will be set to this value
        let {
          oddsInfo,
          betType,
          bet,
          stake,
          regions = "eu", // us, uk, au, eu. Default is eu (Europe) as per client request
          markets = "h2h",
          dateFormat = "iso",
          oddsFormat = "decimal",
          bookmaker = "betfair", // default bookmaker is betfair
        } = req.body;
        const user = req.user;

        // Calculations
        // EXAMPLE IF:
        // Stake: 10,000
        // Odds: 1.43
        // Back Bet
        // 1. Liability: 10,000 (=Stake)
        // 2. PL: 4300
        // Lay Bet
        // 1. Liability: 4300 (=PL)
        // 2. PL: 10,000 (=Stake)
        // Back Bet is won when selected team wins Lay Bet is won when selected team loses 
        let pnl = parseInt(betType == "lay" ? stake : Math.abs((stake * bet.price) - stake)); // math.abs in case odds are less than 1, like 0.98
        if (pnl > MAXPROFIT) pnl = MAXPROFIT; // max profit (20 Lakhs), if profit is more than this, profit will be set to this value
        const liability = betType == "lay" ? pnl : stake; // liability = pnl for lay bet, else stake for back bet

        // check if user already has a bet on this event to avoid multiple bets on same event
        const existingBet = await db.Bet.findOne({
          where: {
            user_id: user.id,
            event_id: oddsInfo.id,
            sport_id: oddsInfo.sport_key,
            category: "sports",
            bookmaker,
            bet_type: betType,
            status: "OPEN",
          },
        });

        if (existingBet) {
          logger.error(`user ${user.id} already has a bet on this event`);
          return res.status(400).send("You already have an open bet on this event");
        }

        // check if user has sufficient balance to cover liability
        if (user.credit < liability) {
          logger.error(`user ${user.id} has insufficient balance for placing bet`);
          // return http status 402 (payment required) with message. 402 so we can redirect to deposit page on frontend
          return res.status(402).send(`Insufficient balance. Please deposit ₹ ${(liability - user.credit).toLocaleString()} to place bet`);
        }
        // console.log(`${config.oddsAPI}/sports/${oddsInfo.sport_key}/events/${oddsInfo.id}/odds?apiKey=${config.oddsAPIKey}&regions=${regions}&markets=${markets}&dateFormat=${dateFormat}&oddsFormat=${oddsFormat}`);
        const resData = await axios.get(
          `${config.oddsAPI}/sports/${oddsInfo.sport_key}/events/${oddsInfo.id}/odds?apiKey=${config.oddsAPIKey}&regions=${regions}&markets=${markets}&dateFormat=${dateFormat}&oddsFormat=${oddsFormat}`
        );
        const result = resData.data;
        const selectedMaker = await result?.bookmakers.find(
          (obj) => obj.key === bookmaker
        );
        if (!selectedMaker) {
          logger.error("selected bookmaker not found");
          return res.status(400).send("Selected bookmaker not found");
        }
        const typeKey = betType == "lay" ? `${markets}_lay` : markets;
        const selectedMarket = await selectedMaker?.markets.find(
          (obj) => obj.key == typeKey
        );
        if (!selectedMarket) {
          logger.error("selected market not found");
          return res.status(400).send("Selected market not found");
        }
        const selectedOutcome = await selectedMarket.outcomes.find(
          (obj) => obj.name == bet.name
        );

        // max bet.price is 4
        if (selectedOutcome.price > 4) {
          bet.price = 4;
        } else if (selectedOutcome.price != bet.price) {
          logger.error(`odds changed for bet when tried placing sports bet by user ${user.id}`);
          return res.status(400).send("Odds changed. Please try placing betslip again");
        }

        // Check if game is completed. since fancy bets are for cricket only not checking group, else we can check group as well
        if (result.home_team && result.away_team && oddsInfo.commence_time) {
          const score = await getCricketScoreFromCrawl([result.home_team, result.away_team], oddsInfo.commence_time);
          if (score && score?.completed) return res.status(200).send(`Match already completed. Can't place bet`);
        }

        const bet_details = {
          user_id: user.id,
          category: "sports",
          event_id: oddsInfo.id,
          sport_id: oddsInfo.sport_key,
          homeTeam: result.home_team,
          awayTeam: result.away_team,
          bookmaker,
          region: regions,
          market: markets,
          bet_type: betType,
          stake: parseInt(stake),
          commence_time: oddsInfo.commence_time,
          selectedTeam: bet.name,
          selectedOdd: bet.price,
          liability: parseInt(liability),
          pnl: parseInt(pnl),
          status: "OPEN", // OPEN, VOID, WON, LOST
        };
        const betData = await db.Bet.create(bet_details);
        if (betData) {
          // deducting stake
          const credit = user.credit - parseInt(liability);
          await user.update({ credit });
          let tx = {
            user_id: user.id,
            type: "debit",
            amount: parseInt(liability),
            game_data: {
              game: "oddsBet",
              eventId: betData.event_id,
              sportId: betData.sport_id,
              type: betData.bet_type,
            },
            status: "success",
            remark: `Bet of type ${betType} placed on ${betData.selectedTeam} at odd of ${betData.selectedOdd} with stake of ₹ ${betData.stake} and liability of ₹ ${liability}`,
            reference: betData.id,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
        return res.status(200).send(true);
      } catch (error) {
        logger.error(`Sports:post:/bet: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  );

export default router;
