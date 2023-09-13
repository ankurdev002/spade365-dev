import { useEffect, useRef, useState, useContext, Fragment, useCallback } from "react";
import AnimateOnChange from 'react-animate-on-change';
import {
  AiFillInfoCircle,
  AiOutlineFieldTime,
  AiOutlineLoading3Quarters,
} from "react-icons/ai";
import {
  MdOutlineBookOnline,
  MdSportsCricket,
  MdSportsFootball,
  MdSportsSoccer,
  MdSportsTennis,
} from "react-icons/md";
import { toast } from "react-toastify";
import useUser from "../hooks/useUser";
import LoginModal, { Action } from "./LoginModal";
import { Switch } from "@headlessui/react";
import { useRouter } from "next/router";
import { FaRegHandPointRight } from "react-icons/fa";
import { FancyOdd, GROUP, Odd, SportContext, } from "../store/Sport";
import Link from "next/link";
import { FiX } from "react-icons/fi";
// import { AnimationOnScroll } from 'react-animation-on-scroll';

interface SportsBookProps {
  group?: GROUP[]; // group of sports to show, eg. ["Cricket", "Football", "Soccer", "Tennis"]
  live?: boolean; // show live odds
  upcoming?: boolean; // show upcoming odds
  limit?: number; // limit number of sports from each group
  minimal?: boolean;
}

type Score = {
  away_team: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  id: string;
  last_update: string;
  scores: {
    name: string;
    score: string;
  }[];
  sport_key: string;
  sport_title: string;
};

type ScoreCrawler = { // cricket score returned from our own crawler that crawls cricbuzz
  category: string;
  format: string;
  desc: string;
  type: string;
  status: string;
  started_at: string;
  completed_at: string;
  completed: boolean;
  toss: {
    winner: string;
    decision: string;
  };
  venue: string;
  scoreboard_url: string;
  target: number;
  scores: [
    {
      name: string;
      score: number;
      short_name: string;
      wickets: number;
      overs: number;
      innings_id: number;
    }
  ],
  result: { type: string, winner: string };
  players_of_match: [{ name: string, team: string }];
  day?: number;
  recent_stats: string;
  runrate: number;
  req_runrate: number;
}

type ScoreBoardProps = {
  close: () => void;
  sportKey: string;
  group?: string; //GROUP;
  matchId: string;
};

export default function SportsBook({
  group = Object.values(GROUP),
  minimal = true,
  limit = 8,
}: SportsBookProps) {
  const {
    sports,
    odds,
    getOdds,
    getSports,
    getOddsByGroup,
    getOddsByMatchId,
    getFancyOdd,
    sportsLoading,
    oddsLoading,
  } = useContext(SportContext);
  const [loginVisibile, setLoginVisible] = useState(false);
  const [sportKey, setSportKey] = useState("");
  const [matchId, setMatchId] = useState("");
  const [oddsByGroup, setOddsByGroup] = useState<{ [key: string]: Odd[] }>({}); // odds by group with key as group name
  const [oddsByMatchId, setOddsByMatchId] = useState<Odd[]>([]); // odds by match id

  const resetSportKey = () => {
    setSportKey("");
    setMatchId("");
  };

  useEffect(() => {
    if (!matchId) return; // only used when matchId is set, ie. when user clicks on a match
    const obmi = getOddsByMatchId(matchId).filter((odd) => odd.id === matchId);
    setOddsByMatchId(obmi);
  }, [matchId, odds]); // update match odds when odds or matchId changes

  const updateSportKey = (key: string, id: string) => {
    // if page does not include /sportsbook, redirect to /sportsbook with query params
    if (!router.pathname.includes("/sportsbook")) {
      return router.push({
        pathname: "/sportsbook",
        query: { sport: key, id: id },
      });
    } else if (router.query.sport !== key || router.query.id !== id) {
      router.push({
        pathname: router.pathname,
        query: { sport: key, id: id },
      });
    }
    setSportKey(key);
    setMatchId(id);
  };

  const router = useRouter();

  useEffect(() => {
    getSports();
  }, []);

  useEffect(() => {
    if (router.query.sport && router.query.id) {
      updateSportKey(router.query.sport as string, router.query.id as string);
    } else {
      resetSportKey();
    }

    if (router.query.group) {
      const elem = document.getElementById(router.query.group as string);
      if (elem) window.scrollTo(0, elem.offsetTop);
    }
  }, [router.query.group, router.query.sport, router.query.id]);

  const fetchOdds = () => {
    for (let j = 0; j < group.length; j++) {
      let tab = group[j];
      const s = sports.filter((sport) => sport.group === tab);
      for (let i = 0; i < s.length; i++) {
        const sport = s[i];
        if (!sport) break;
        if (i >= limit) break; // limit number of sports from each group
        if (sport.has_outrights) continue; // skip outrights market
        getOdds(sport);
      }
    }
  };

  const fetchOddsByGroup = useCallback(() => {
    if (!group || group.length === 0) return;
    if (matchId) return; // odds by group are only needed in minimal mode
    let oddsByGroup: { [key: string]: Odd[] } = {};
    for (let i = 0; i < group.length; i++) {
      const og = getOddsByGroup(group[i], { sortBy: "DESC", limit });
      if (!og) continue;
      oddsByGroup[group[i]] = og;
      oddsByGroup[group[i]] = og.filter((odd, index, self) => self.findIndex((t) => t.id === odd.id) === index);
    }
    setOddsByGroup(oddsByGroup);
  }, [odds, group, matchId]);

  useEffect(() => {
    if (oddsLoading) return; // skip if odds are loading
    fetchOddsByGroup();
  }, [oddsLoading, group, matchId]);

  useEffect(() => {
    if (sportsLoading) return; // skip if sports are loading
    fetchOdds(); // call fetchOdds once on mount
  }, [sports, sportsLoading]);

  useEffect(() => {
    // call fetchOdds every 8 seconds.
    const interval = setInterval(() => {
      fetchOdds();
    }, 4000);
    return () => clearInterval(interval);
  }, [sportsLoading]);

  return (
    <div className={`w-full mb-8 relative ${!minimal ? 'lg:grid lg:grid-cols-[max-content,_1fr]' : ''}`}>
      {!minimal && (
        <>
          {/* Mobile Game Menu */}
          <div className="animate__animated animate__fadeInDown placeholder:text-white text-center bg-gradient-to-b animate-gradient-xy from-accent/20 via-accent to-accent break-words shadow w-full overflow-x-scroll scrollbar-hide lg:hidden z-10 rounded-lg mb-4">
            <div className="flex flex-row p-2 container break-words leading-6 content-center shadow-lg">
              {Object.values(GROUP).map((group) => {
                const length = oddsByGroup[group]?.length;
                return length > 0 ? (
                  <Link
                    key={group + '_p1'}
                    href={`/sportsbook?group=${group}`}
                    className="text-white relative cursor-pointer text-sm flex flex-row justify-center items-center uppercase w-full text-center"
                  >
                    {/* <BsFillPlayFill className="text-xl" /> */}
                    <p>{group}</p>
                    <p className="bg-black ml-2 px-2 rounded-full">{length}</p>
                  </Link>
                ) : null;
              })}
            </div>
          </div>

          {/* Desktop Game Menu */}
          <div className="w-[300px] h-full p-4 relative hidden lg:block animate__animated animate__fadeInDown">
            <div className="sticky top-32 left-0 bg-white text-black p-4 rounded-lg">
              {Object.values(GROUP).map((group) => {
                const length = oddsByGroup[group]?.length;
                return length > 0 ? (
                  <Link
                    key={group + '_p2'}
                    href={`/sportsbook?group=${group}`}
                    className="flex justify-between py-2"
                  >
                    <p>{group}</p>
                    <p className="bg-black text-white px-2 rounded-full">{length}</p>
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        </>
      )}

      <div className="relative">
        {/* Loading Skeleton */}
        {/* {(sportsLoading || oddsLoading) && ( */}
        {(sportsLoading) && (
          <div className="animate__animated animate__fadeInUp w-full mb-8 bg-white text-white bg-gradient-to-r animate-gradient-xy from-accent/70 via-accent/90 to-secondary/80 rounded-xl p-4">
            <div className="p-4 w-full mx-auto">
              <div className="flex space-x-4">
                <div className="flex-1 space-y-6 py-1">
                  <div className="rounded flex flex-col justify-center items-center text-center py-4">
                    <h1 className="text-2xl uppercase tracking-wider">Sportsbook</h1>
                    <AiOutlineLoading3Quarters className="animate-spin text-4xl text-white mr-2 mt-4" />
                    <p className="text-xs opacity-60 mt-2">Loading Sportsbook...</p>
                  </div>
                  <div className="space-y-3 animate-pulse">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="h-8 bg-accent/20 rounded col-span-2"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="h-8 bg-accent/20 rounded col-span-2"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="h-8 bg-accent/20 rounded col-span-2"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="h-8 bg-accent/20 rounded col-span-2"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                      <div className="h-8 bg-accent/20 rounded col-span-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Score Modal */}
        {(!sportsLoading && sports?.length > 0 && sportKey) && (
          <ScoreBoard
            sportKey={sportKey}
            matchId={matchId}
            group={sports?.filter((sport) => sport.key === sportKey)[0]?.group}// get group by sportKey
            close={resetSportKey}
          />
        )}

        {/* When matchId is set, show only that sport */}
        {matchId && (() => {
          if (oddsByMatchId.length > 0) {
            return (
              <div className="w-full mb-8 bg-white bg-gradient-to-r animate-gradient-xy from-accent/70 via-accent/90 to-secondary/80 rounded-xl p-4">
                <div className="text-black">
                  {oddsByMatchId.map((odd, index) => {
                    return (
                      <div
                        key={index + odd.commence_time + odd.away_team + '_y5'}
                        className="w-full my-4"
                      >
                        <OddsGroup
                          odd={odd}
                          updateSportKey={updateSportKey}
                          getFancyOdd={getFancyOdd as any}
                          showLogin={() => setLoginVisible(true)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* When no sportskey/matchId show all odds */}
        {/* for each group, if atleast 1 odds has that group key */}
        {!matchId && group.map((group, index) => {
          if (oddsByGroup && oddsByGroup[group] && oddsByGroup[group].length > 0) {
            return (
              <div key={index + group + '_e4'} className="animate__animated animate__fadeInUp w-full mb-4 bg-white bg-gradient-to-r animate-gradient-xy from-accent/70 via-accent/90 to-secondary/80 rounded-xl p-4" id={group}>
                {/* header */}
                <div
                  key={index}
                  className="animate__animated animate__fadeInDown col-span-6 relative text-white rounded-xl flex flex-row items-center justify-center mb-4 text-2xl lg:text-3xl font-semibold tracking-widest uppercase"
                >
                  {/* icon */}
                  {group === "Cricket" && (
                    <MdSportsCricket className="mr-4" />
                  )}
                  {group === "Football" && (
                    <MdSportsFootball className="mr-4" />
                  )}
                  {(group === "Soccer" || group === "American Football") && (
                    <MdSportsSoccer className="mr-4" />
                  )}
                  {group === "Tennis" && (
                    <MdSportsTennis className="mr-4" />
                  )}
                  {/* title */}
                  <h2 className="">
                    {group}
                  </h2>
                </div>

                {/* odds */}
                <div className="text-black">
                  {/* for each group, show odds if bookmakers are greater than 0, if minimal, show only 3 games per group */}
                  {oddsByGroup[group].map((odd, index) => {
                    { if (odd.bookmakers.length <= 0) return }
                    {
                      if (minimal && index === 3 && oddsByGroup[group].length > 3) {
                        return (
                          <div className="flex justify-center">
                            <button
                              className="text-white/100 font-normal"
                              onClick={() => router.push(`/sportsbook?group=${group}`)}
                            >
                              Show More
                            </button>
                          </div>
                        )
                      } else if (minimal && index > 3 && oddsByGroup[group].length > 3) return null
                    }
                    return (
                      <div
                        key={index + odd.commence_time + odd.away_team + '_u6'}
                        className="w-full my-4"
                      >
                        <OddsGroup
                          group={group}
                          minimal={minimal}
                          odd={odd}
                          updateSportKey={updateSportKey}
                          showLogin={() => setLoginVisible(true)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })}

        {/* Login Modal */}
        {loginVisibile && (
          <LoginModal
            isOpen={loginVisibile}
            closeModal={() => setLoginVisible(false)}
            active={"login" as Action}
          />
        )}
      </div>
    </div>
  );
}

function OddsGroup({
  odd,
  updateSportKey,
  showLogin,
  minimal,
  group,
  getFancyOdd,
}: Omit<SportsBookProps, "group"> & {
  minimal?: boolean;
  odd: Odd;
  updateSportKey: (key: string, id: string) => void;
  showLogin: () => void;
  group?: GROUP;
  getFancyOdd?: (sportKey: string, eventId: string) => FancyOdd[];
}) {
  const panel = useRef<HTMLDivElement>(null);
  const betFormRef = useRef<HTMLDivElement>(null);
  const [betBoxOpen, setBetBoxOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(""); // team selected to bet on
  const [betType, setBetType] = useState("back"); // back or lay
  const [betBookmaker, setBetBookmaker] = useState(""); // bookmaker selected to bet on
  const [activeBet, setActiveBet] = useState<any | null>(null); // Odd.bookmakers.markets.outcome || FancyOdd
  const [fancyOdd, setFancyOdd] = useState<FancyOdd[] | []>([]);
  const [isBetFancy, setIsBetFancy] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // call fetchFancyOdds once, then call every 20 seconds
    fetchFancyOdds();
    const timer = setInterval(() => {
      fetchFancyOdds();
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // when new odd is received, keep old odd

  const fetchFancyOdds = async () => {
    if (!minimal && getFancyOdd) {
      let fancyOdds = await getFancyOdd(odd.sport_key, odd.id);
      setFancyOdd(fancyOdds);
    }
  };

  const handleBetSelection = async (
    type: string,
    sport_key: string,
    team: string,
    bet: any, // Odd.bookmakers.markets.outcome || FancyOdd
    bookmaker: string
  ) => {
    if (minimal) return router.push(`/sportsbook?group=${group}&sport=${sport_key}&id=${odd.id}`);
    updateSportKey(sport_key, odd.id);
    setIsBetFancy(false);
    setBetType(type);
    setBetBoxOpen(true);
    setSelectedTeam(team);
    setActiveBet(bet);
    setBetBookmaker(bookmaker);
    setTimeout(() => {
      betFormRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }, 400);
  };

  const handleFancyBetSelection = async (
    betType: string, // back or lay
    team: string, // team selected to bet on
    bet: any, // Odd.bookmakers.markets.outcome || FancyOdd
  ) => {
    if (minimal) return router.push(`/sportsbook?group=${group}&sport=${odd.sport_key}&id=${odd.id}`);
    updateSportKey(odd.sport_key, odd.id);
    setIsBetFancy(true);
    setBetType(betType);
    setBetBoxOpen(true);
    setSelectedTeam(team);
    setActiveBet(bet);
    setTimeout(() => { betFormRef.current?.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" }) }, 400);
  };

  return (
    <div className="w-full isolate animate__animated animate__fadeInUp" ref={container}>
      {/* header */}
      <div className="select-none cursor-pointer grid grid-cols-12 w-full" onClick={() => router.push(`/sportsbook?group=${group}&sport=${odd.sport_key}&id=${odd.id}`)}>
        <div className="grid grid-cols-12 col-span-12 relative">
          <div className="col-span-5 md:col-span-6 relative bg-black text-white px-4 py-3 rounded-tl-xl text-left tracking-tight">
            <h3
              className={`text-xs absolute -top-2 ${new Date(odd.commence_time) > new Date()
                ? "bg-orange-600"
                : "bg-green-600"
                } text-white rounded-lg px-2 py-[0.8px] uppercase`}
            >
              {/* if commence time in future, set upcoming else live */}
              {new Date(odd.commence_time) > new Date() && "Upcoming"}
              {new Date(odd.commence_time) < new Date() && "Live"}
            </h3>
            <h2 className="text-sm md:text-lg font-semibold capitalize flex items-center">
              <span className="">
                {odd.home_team + " Vs. " + odd.away_team}
              </span>
            </h2>
            {!minimal && (
              <p className="text-xs opacity-75 tracking-tightest mt-1">
                {odd.sport_title}
                <span className="px-1">-</span>
                <span>
                  {new Date(odd.commence_time).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
          <div className="col-span-7 md:col-span-6 flex flex-row justify-center items-center relative bg-gray-800 text-white px-4 py-3 rounded-tr-xl text-center">
            <div className="w-[50%]">
              <p className="text-sm">Back</p>
            </div>
            <div className="w-[50%]">
              <p className="text-sm">Lay</p>
            </div>
          </div>
        </div>
      </div>

      {/* panel */}
      <div className={`duration-150 mb-4 -z-20`}>
        {/* Default odds */}
        <div className="grid grid-cols-12 col-span-12 bg-white rounded-bl-xl rounded-br-xl text-black">
          <div className="col-span-5 md:col-span-6 relative px-4 py-3 rounded-tl-xl text-left">
            <div className="flex flex-col items-start justify-start">
              {odd.bookmakers[0]?.markets[0].outcomes.map((outcome, index) => (
                <button
                  onClick={() => {
                    updateSportKey(odd.sport_key, odd.id);
                  }}
                  key={outcome.name + "_w2"}
                  className={`rounded text-left py-1 text-sm md:text-base font-semibold whitespace-nowrap overflow-hidden max-md:max-w-[140px] text-ellipsis ${index !== odd.bookmakers[0]?.markets[0].outcomes.length - 1 ? "mb-2.5" : ""}`}
                >
                  {outcome.name}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-7 md:col-span-6  relative rounded-tr-xl text-center text-lg overflow-x-scroll overflow-hidden scrollbar-hide">
            <div className="grid grid-cols-12">
              <div className="col-span-6">
                <div className="grid grid-cols-3">
                  {odd.bookmakers.slice(0, 3).map((bookmaker, index) => (
                    <div key={bookmaker.key + '_i1'} className="col-span-1">
                      <div className="text-center">
                        {bookmaker.markets.find((obj) => obj.key == "h2h")?.outcomes ? bookmaker.markets.find((obj) => obj.key == "h2h")?.outcomes.map((outcome) => (
                          <button
                            key={outcome.name + "_defaulth2h" + '_i2'}
                            className={`px-1 py-2 w-full bg-blue-200 border border-white text-base font-semibold`}
                            onClick={() => {
                              handleBetSelection(
                                "back",
                                odd.sport_key,
                                outcome.name,
                                outcome,
                                bookmaker.key
                              );
                            }}
                          >
                            <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={
                              // if last update is newer than 20 seconds, animate
                              new Date(bookmaker.markets.find((obj) => obj.key == "h2h")?.last_update!).getTime() > new Date().getTime() - 20000
                            }>
                              {parseFloat(outcome.price) > 4 ? 4 : outcome.price}
                            </AnimateOnChange>
                          </button>
                        )) : <p className="px-1 py-2 w-full bg-blue-100 border border-white text-base font-semibold transition-all opacity-75">-</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-6">
                <div className="grid grid-cols-3">
                  {odd.bookmakers.slice(0, 3).map((bookmaker, index) => (
                    <div key={bookmaker.key + '_r2'} className="col-span-1">
                      <div className="text-center">
                        {bookmaker.markets.find((obj) => obj.key == "h2h_lay")?.outcomes ? bookmaker.markets.find((obj) => obj.key == "h2h_lay")?.outcomes.map((outcome) => (
                          <button
                            key={outcome.name + "_defaultlay" + '_i13'}
                            className={`px-1 py-2 w-full bg-red-200 border border-white text-base font-semibold`}
                            onClick={() => {
                              handleBetSelection(
                                "lay",
                                odd.sport_key,
                                outcome.name,
                                outcome,
                                bookmaker.key
                              );
                            }}
                          >
                            <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={
                              // if last update is newer than 20 seconds, animate
                              new Date(bookmaker.markets.find((obj) => obj.key == "h2h_lay")?.last_update!).getTime() > new Date().getTime() - 20000
                            }>
                              {parseFloat(outcome.price) > 4 ? 4 : outcome.price}
                            </AnimateOnChange>
                          </button>
                        )) : <p className="px-1 py-2 w-full bg-red-100 border border-white text-base font-semibold transition-all opacity-75">-</p>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bookmaker (0% Commission & Instant Bet) */}
          {(!minimal && odd.id && odd.bookmakers[1]?.markets[0]) && (
            <>
              <div className="col-span-12 relative py-2 text-left bg-gray-200/40 text-black grid grid-cols-12">
                <div className="col-span-5 md:col-span-6">
                  <h3
                    className="text-base font-normal capitalize flex items-center justify-start pl-3 tracking-wider"
                    title="Bookmaker Odds. 0% Commission & Instant Bet"
                  >
                    <AiOutlineFieldTime className="text-2xl mr-2" />
                    <span className="tracking-tight">
                      Bookmaker{" "}
                    </span>
                  </h3>
                  <span className="pl-4 text-xs opacity-80">
                    0% Commission & Instant Bet
                  </span>
                </div>
                <div className="col-span-7 md:col-span-6 flex flex-row justify-center items-center relative text-gray-800 px-4 rounded-tr-xl text-center">
                  <div className="w-[50%]">
                    <p className="text-sm">Back</p>
                  </div>
                  <div className="w-[50%]">
                    <p className="text-sm">Lay</p>
                  </div>
                </div>
              </div>

              <div className="col-span-5 md:col-span-6 relative px-4 py-3 rounded-tl-xl text-left">
                <div className="flex flex-col items-start justify-start">
                  {/* {odd.bookmakers
                        .find((obj) => obj.key == "betfair")
                        ?.markets[0].outcomes.map((outcome) => ( */}
                  {odd.bookmakers[1]?.markets[0].outcomes.map((outcome, index) => (
                    <button
                      onClick={() => {
                        updateSportKey(odd.sport_key, odd.id);
                      }}
                      key={outcome.name + "_bm" + '_i14'}
                      className={`rounded text-left py-1 text-sm md:text-base font-semibold whitespace-nowrap overflow-hidden max-md:max-w-[140px] text-ellipsis ${index !== odd.bookmakers[1]?.markets[0].outcomes.length - 1 ? "mb-2.5" : ""}`}
                    >
                      {outcome.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-7 md:col-span-6 relative rounded-tr-xl text-center text-lg overflow-x-scroll overflow-hidden scrollbar-hide">
                <div className="grid grid-cols-12">
                  <div className="col-span-6">
                    <div className="grid grid-cols-3">
                      {odd.bookmakers.slice(4, 7).map((bookmaker, index) => (
                        <div key={bookmaker.key + "_h2h" + '_c3'} className="col-span-1">
                          <div className="text-center">
                            {bookmaker.markets.find((obj) => obj.key == "h2h")?.outcomes ? bookmaker.markets.find((obj) => obj.key == "h2h")?.outcomes.map((outcome) => (
                              <button
                                key={outcome.name + "_bmh2h" + '_i15'}
                                className={`px-1 py-2 w-full bg-blue-200 border border-white text-base font-semibold`}
                                onClick={() => {
                                  handleBetSelection(
                                    "back",
                                    odd.sport_key,
                                    outcome.name,
                                    outcome,
                                    bookmaker.key
                                  );
                                }}
                              >
                                <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={
                                  // if last update is newer than 20 seconds, animate
                                  new Date(bookmaker.markets.find((obj) => obj.key == "h2h")?.last_update!).getTime() > new Date().getTime() - 20000
                                }>
                                  {/* {(parseFloat(outcome.price) * 100).toFixed(0)} */}
                                  {parseFloat(outcome.price) > 4 ? 4 : outcome.price}
                                </AnimateOnChange>
                              </button>
                            )) : <p className="px-1 py-2 w-full bg-blue-100 border border-white text-base font-semibold transition-all opacity-75">-</p>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-6">
                    <div className="grid grid-cols-3">
                      {odd.bookmakers.slice(4, 7).map((bookmaker, index) => (
                        <div key={bookmaker.key + "_h2h_lay" + '_l2'} className="col-span-1">
                          <div className="text-center">
                            {bookmaker.markets.find((obj) => obj.key == "h2h_lay")?.outcomes ? bookmaker.markets.find((obj) => obj.key == "h2h_lay")?.outcomes.map((outcome) => (
                              <button
                                key={outcome.name + "_bmlay" + '_o8'}
                                className={`px-1 py-2 w-full bg-red-200 border border-white text-base font-semibold transition-all`}
                                onClick={() => {
                                  handleBetSelection(
                                    "lay",
                                    odd.sport_key,
                                    outcome.name,
                                    outcome,
                                    bookmaker.key
                                  );
                                }}
                              >
                                <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={
                                  // if last update is newer than 20 seconds, animate
                                  new Date(bookmaker.markets.find((obj) => obj.key == "h2h_lay")?.last_update!).getTime() > new Date().getTime() - 20000
                                }>
                                  {/* {(parseFloat(outcome.price) * 100).toFixed(0)} */}
                                  {parseFloat(outcome.price) > 4 ? 4 : outcome.price}
                                </AnimateOnChange>
                              </button>
                            )) : <p className="px-1 py-2 w-full bg-red-100 border border-white text-base font-semibold transition-all opacity-75">-</p>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}


          {/* Who will win the match. With team names and 1 odds each */}
          {(!minimal && odd.id && odd.bookmakers[0]?.markets[0].outcomes.length >= 2) && (
            <div className="col-span-12 relative py-8 text-left bg-gray-200/40 text-black grid grid-cols-12">
              <div className="col-span-12">
                <h3
                  className="text-base font-normal capitalize flex items-center justify-center pl-3 tracking-wider"
                  title="Who will win the match"
                >
                  <span className="tracking-tight font-semibold">
                    Who will win the match?
                  </span>
                </h3>
              </div>
              <div className="col-span-12 flex mt-4 flex-row justify-center items-center relative text-gray-800 px-4 rounded-tr-xl text-center">
                {/* Home Team */}
                <div className="w-[50%] flex flex-col justify-center items-center">
                  <p className="text-base font-semibold">{odd.bookmakers[0]?.markets[0].outcomes[0].name}</p>
                  <button
                    className={`px-1 py-2 w-full bg-blue-200 border border-white text-base font-semibold max-w-xs rounded-lg`}
                    onClick={() => {
                      handleBetSelection(
                        "back",
                        odd.sport_key,
                        odd.bookmakers[0]?.markets[0].outcomes[0].name,
                        odd.bookmakers[0]?.markets[0].outcomes[0],
                        odd.bookmakers[0]?.key
                      );
                    }}
                  >
                    <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={
                      // if last update is newer than 20 seconds, animate
                      new Date(odd.bookmakers[0]?.markets[0].last_update!).getTime() > new Date().getTime() - 20000
                    }>
                      {parseFloat(odd.bookmakers[0]?.markets[0].outcomes[0].price) > 4 ? 4 : odd.bookmakers[0]?.markets[0].outcomes[0].price}
                    </AnimateOnChange>
                  </button>
                </div>
                {/* Away Team */}
                <div className="w-[50%] flex flex-col justify-center items-center">
                  <p className="text-base font-semibold">{odd.bookmakers[0]?.markets[0].outcomes[1].name}</p>
                  <button
                    className={`px-1 py-2 w-full bg-blue-200 border border-white text-base font-semibold rounded-lg max-w-xs ${parseFloat(odd.bookmakers[0]?.markets[0].outcomes[1].price) > 8 ? "hidden" : ""}`}
                    onClick={() => {
                      handleBetSelection(
                        "back",
                        odd.sport_key,
                        odd.bookmakers[0]?.markets[0].outcomes[1].name,
                        odd.bookmakers[0]?.markets[0].outcomes[1],
                        odd.bookmakers[0]?.key
                      );
                    }}
                  >
                    <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={
                      // if last update is newer than 20 seconds, animate
                      new Date(odd.bookmakers[0]?.markets[0].last_update!).getTime() > new Date().getTime() - 20000
                    }>
                      {parseFloat(odd.bookmakers[0]?.markets[0].outcomes[1].price) > 4 ? 4 : odd.bookmakers[0]?.markets[0].outcomes[1].price}
                    </AnimateOnChange>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fancy odds (Cricket only for now) */}
          {(!minimal && fancyOdd && fancyOdd.length > 0) && (
            <div className="col-span-12 relative py-2 text-left text-black grid grid-cols-12">
              <div className="col-span-12 grid grid-cols-12 bg-gray-200/40 py-2">
                <div className="col-span-7 md:col-span-6">
                  <h3
                    className="text-base font-normal capitalize flex items-center justify-start pl-3 tracking-wider"
                    title="Fancy Odds. 0% Commission & Instant Bet"
                  >
                    <MdOutlineBookOnline className="text-2xl mr-2" />
                    <span>
                      Fancy
                    </span>
                  </h3>
                </div>
                {/* <div className="col-span-5 md:col-span-6 flex flex-row justify-center items-center relative text-gray-800 px-4 rounded-tr-xl text-center">
                          <div className="w-[50%]">
                            <p className="text-sm">Back</p>
                          </div>
                          <div className="w-[50%]">
                            <p className="text-sm">Lay</p>
                          </div>
                        </div> */}
              </div>
              <div className="col-span-12 relative px-4 py-3 text-left">
                {fancyOdd.map(
                  (fancy) => (
                    <div
                      key={fancy.id + "_fancy" + '_c4'}
                      className="grid grid-cols-12 mb-2">
                      <div className="col-span-7 md:col-span-6">
                        <button
                          disabled={!fancy.active}
                          className="rounded text-left py-1 my-1 max-w-xs font-semibold capitalize"
                        >
                          {fancy.title === "toss_odd" && "Toss: "}
                          {fancy.description}
                        </button>
                      </div>
                      <div className="col-span-5 md:col-span-6 grid grid-cols-12 text-center gap-1 text-lg">
                        <div className="col-span-6">
                          {fancy.backOdd > 0 && (
                            <button
                              className="bg-blue-200 max-w-[80px] w-[90%] px-2 py-1 font-semibold relative transition-all animate__animated animate__fadeIn"
                              disabled={!fancy.active}
                              onClick={() => {
                                handleFancyBetSelection("back", fancy.description, fancy);
                              }}
                            >
                              <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={fancy.backOdd}>
                                <span className="flex flex-col">
                                  {fancy.backScore > 0 && fancy.backScore}
                                  <span className="text-base font-normal">{fancy.backOdd}</span>
                                  {!fancy.active && (
                                    <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200/80">
                                      <span className="text-xs font-semibold text-red-500 uppercase">Suspended</span>
                                    </span>
                                  )}
                                </span>
                              </AnimateOnChange>
                            </button>
                          )}
                        </div>
                        <div className="col-span-6">
                          {fancy.layOdd > 0 && (
                            <button
                              disabled={!fancy.active}
                              onClick={() => {
                                handleFancyBetSelection("lay", fancy.description, fancy);
                              }}
                              className="bg-red-200 px-2 py-1 max-w-[80px] w-[90%] font-semibold relative transition-all animate__animated animate__fadeIn"
                            >
                              <AnimateOnChange baseClassName="animate__animated" animationClassName="animate__fadeIn" animate={fancy.layOdd}>
                                <span className="flex flex-col">
                                  {fancy.layScore > 0 && fancy.layScore}
                                  <span className="text-base font-normal">{fancy.layOdd}</span>
                                  {!fancy.active && (
                                    <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200/80">
                                      <span className="text-xs font-semibold text-red-500 uppercase">Suspended</span>
                                    </span>
                                  )}
                                </span>
                              </AnimateOnChange>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div
            ref={betFormRef}
            className="col-span-12">
            {/* bet box */}
            {betBoxOpen && (
              <BetForm
                bookmaker={betBookmaker}
                odd={odd}
                selectedTeam={selectedTeam}
                bet={activeBet}
                betType={betType}
                isBetFancy={isBetFancy}
                setOpen={setBetBoxOpen}
                showLogin={showLogin}
              />
            )}
          </div>
        </div>
      </div>
    </div >
  );
}

function BetForm({
  bookmaker,
  odd,
  selectedTeam,
  bet,
  betType,
  isBetFancy,
  setOpen,
  showLogin,
}: Omit<SportsBookProps, "group"> & {
  bookmaker: string;
  odd: Odd;
  bet: any; // Odd.bookmakers.markets.outcome || FancyOdd
  selectedTeam: string;
  betType: string; // "back" or "lay"
  isBetFancy: boolean;
  setOpen: (open: boolean) => void;
  showLogin: () => void;
}) {
  const router = useRouter();
  const [stake, setStake] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { isLoggedIn } = useUser();
  const [confirm, setConfirm] = useState(true); // if should alert user before placing bet
  const [pl, setPl] = useState({
    pnl: 0,
    liability: 0,
    odd: 0,
  }); // potential profit/loss

  // calculate potential profit/loss, liability and stake based on type(back/lay), stake and odds
  const calculatePL = () => {
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
    const odd = isBetFancy ? betType == "back" ? bet.backOdd : bet.layOdd : parseFloat(bet.price) > 4 ? 4 : parseFloat(bet.price) || 0;
    const actualOdd = isBetFancy ? parseFloat(odd) / 100 : parseFloat(odd); // if fancy, divide by 100 (fancy odds are in american format)
    let pnl = parseInt((stake * actualOdd - stake).toFixed(0));

    if (pnl > 2000000) pnl = 2000000; // max profit/loss 20L

    if (betType == "back") {
      setPl({
        odd,
        liability: stake || 0,
        pnl,
      });
    } else if (betType == "lay") {
      setPl({
        odd,
        liability: pnl,
        pnl: stake || 0,
      });
    }
  };

  // if bet is changed, recalculate potential profit/loss
  useEffect(() => {
    calculatePL();
  }, [bet, stake, betType, isBetFancy]);

  // async function to place bet via api
  const placeBet = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!isLoggedIn) return showLogin();
      if (stake <= 0) return toast.error("Please enter a valid stake");
      if (stake < 100) return toast.error("Min stake is 100");
      if (stake > 500000) return toast.error("Max stake is 5,00,000");

      if (confirm) {
        if (!window.confirm(`Are you sure you want to place a ${betType[0].toUpperCase() + betType.slice(1)} bet of ₹ ${stake.toLocaleString()} on ${selectedTeam} at ${parseFloat(bet.price) > 4 ? 4 : bet.price} ? You'll not be able to withdraw once the bet is accepted.`)) return;
      }

      setSubmitting(true);

      // Place bet via api
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oddsInfo: odd,
          betType,
          bet,
          stake,
          bookmaker, //odd.bookmakers[0].key,
        }),
      };
      const response = await fetch("/api/sports/bet", options);
      if (response.ok) {
        toast.success(
          `${betType[0].toUpperCase() + betType.slice(1)
          } bet of ${stake.toLocaleString()} on ${selectedTeam} at ${bet.price
          } placed successfully`
        );
        setOpen(false); // close bet box
      } else toast.error(await response.text());
      // if response status code 402, wait 2 seconds then redirect to deposit page
      if (response.status == 402) {
        setTimeout(() => {
          router.push("/user/deposit");
        }, 2000);
      }
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setSubmitting(false);
    }
  };

  const placeFancyBet = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!isLoggedIn) return showLogin();
      if (stake <= 0) return toast.error("Please enter a valid stake");
      if (stake < 100) return toast.error("Min stake is 100");
      if (stake > 500000) return toast.error("Max stake is 5,00,000");

      if (confirm) {
        // show window.confirm to confirm bet
        if (!window.confirm(`Are you sure you want to place a ${betType[0].toUpperCase() + betType.slice(1)} bet of ₹ ${stake.toLocaleString()} on ${selectedTeam} at ${betType == "back" ? bet.backOdd : bet.layOdd} ? You'll not be able to withdraw once the bet is accepted.`)) return;
      }

      setSubmitting(true);

      // Place fancy bet via api
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oddsInfo: bet, // we're confirming this on backend 
          betType,
          stake,
        }),
      };

      const response = await fetch("/api/sports/fancyBet", options);

      if (response.ok) {
        toast.success(
          `${betType[0].toUpperCase() + betType.slice(1)
          } bet of ${stake.toLocaleString()} on ${selectedTeam} at ${betType == "back" ? bet.backOdd : bet.layOdd
          } placed successfully`
        );
        setOpen(false); // close bet box
      } else toast.error(await response.text());
      // if response status code 402, wait 2 seconds then redirect to deposit page
      if (response.status == 402) {
        setTimeout(() => {
          router.push("/user/deposit");
        }, 2000);
      }
      setSubmitting(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => isBetFancy ? placeFancyBet(e) : placeBet(e)}
      className={`col-span-12 grid grid-cols-12 py-4 px-4 shadow-lg ${betType == "lay"
        ? "bg-red-100 bottom-0"
        : betType == "back"
          ? "bg-blue-100"
          : ""
        }`}
    >
      <div className="col-span-12 grid grid-cols-12 text-left font-semibold text-sm uppercase tracking-wider">
        <div className="col-span-4">
          {isBetFancy ? bet.title : odd.home_team + " V " + odd.away_team}
        </div>
        {stake >= 100 && stake <= 500000 && (bet.price || bet.layOdd || bet.backOdd) ? (
          <div className="col-span-8 font-semibold uppercase tracking-wide text-sm flex flex-col md:flex-row justify-end items-end md:items-center">
            {/* Profit or liability based on back or lay */}
            <p className="text-green-700">
              {"Profit: + ₹ "}{pl.pnl.toLocaleString() || 0}
            </p>
            <span className="mx-1 opacity-20 hidden md:inline-block">
              {" | "}
            </span>
            <p className="text-red-700">
              {"Liability: ₹ "}{pl.liability.toLocaleString() || 0}
            </p>
          </div>
        ) : (
          <></>
        )}
      </div>

      <div className="col-span-12 text-left text-base text-blue-800 tracking-wider uppercase font-semibold mt-4">
        <FaRegHandPointRight className="inline-block mr-2" />
        {selectedTeam}
      </div>

      <div className="col-span-12 text-left text-base grid grid-cols-12 mt-2">
        {/* 2 inputs, 1 for odds price and 1 for stake */}
        <div className="col-span-6">
          {/* label */}
          <div className="text-left text-sm opacity-50 font-semibold mb-2">
            Odds
          </div>
          <input
            name="odds"
            type="number"
            placeholder="Odds"
            min={0}
            value={pl.odd}
            disabled={true}
            className="w-full max-w-[95%] h-[40px] rounded-lg border border-gray-300 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="col-span-6">
          <div className="text-left text-sm opacity-50 font-semibold mb-2">
            Stake
          </div>
          <input
            name="stake"
            type="number"
            placeholder="Stake"
            // min={100}
            // max={500000}
            value={stake}
            onChange={(e) => {
              setStake(parseInt(e.target.value));
            }}
            className="w-full max-w-[95%] h-[40px] rounded-lg border border-gray-300 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="col-span-12 my-4 font-semibold uppercase tracking-wide text-sm opacity-50">
          <p>or Choose Your Stake Size</p>
        </div>
        <div className="col-span-12">
          {/* 5 buttons with stake 10,000, 20,000 till 1,00,000 */}
          <div className="grid grid-cols-5 lg:grid-cols-6 w-full gap-1 md:gap-2 text-xs content-center">
            <button
              type="button"
              onClick={() => {
                setStake(stake + 10000); // add to stake
              }}
              className="col-span-1 bg-accent text-white rounded-lg px-1 md:px-2 lg:px-4 py-2"
            >
              +10,000
            </button>
            <button
              type="button"
              onClick={() => {
                setStake(stake + 20000); // add to stake
              }}
              className="col-span-1 bg-accent text-white rounded-lg px-1 md:px-2 lg:px-4 py-2 hidden lg:inline-block"
            >
              +20,000
            </button>
            <button
              type="button"
              onClick={() => {
                setStake(stake + 30000); // add to stake
              }}
              className="col-span-1 bg-accent text-white rounded-lg px-1 md:px-2 lg:px-4 py-2"
            >
              +30,000
            </button>
            <button
              type="button"
              onClick={() => {
                setStake(stake + 50000); // add to stake
              }}
              className="col-span-1 bg-accent text-white rounded-lg px-1 md:px-2 lg:px-4 py-2"
            >
              +50,000
            </button>
            <button
              type="button"
              onClick={() => {
                setStake(stake + 100000); // add to stake
              }}
              className="col-span-1 bg-accent text-white rounded-lg px-2 md:px-2 lg:px-4 py-2"
            >
              +1,00,000
            </button>
            {/* clear button */}
            <button
              type="button"
              onClick={() => {
                setStake(0); // clear stake
              }}
              className="col-span-1 bg-white text-black border border-accent rounded-lg px-1 md:px-2 lg:px-4 py-2"
            >
              Clear
            </button>
          </div>
          {/* Cancel and Place bet button */}
          <div className="grid grid-cols-2 w-full mt-8 mb-8 gap-x-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className="col-span-1 bg-white text-black border border-accent rounded-lg px-4 py-2"
            >
              Cancel
            </button>
            {!isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  showLogin();
                }}
                className="col-span-1 bg-primary text-white border border-primary rounded-lg px-4 py-2"
              >
                {"Login to Place Bet"}
              </button>
            ) : (
              <button
                type="submit"
                className="col-span-1 bg-primary text-white border border-primary rounded-lg px-4 py-2"
              >
                {submitting ? (
                  <AiOutlineLoading3Quarters className="animate-spin text-2xl mx-auto text-white my-1" />
                ) : (
                  "Place Bet"
                )}
              </button>
            )}
          </div>
          <div className="mt-4 flex flex-row justify-end items-center">
            <p className="mr-2 font-semibold uppercase opacity-50">
              Confirm bets before placing ?
            </p>
            <Switch
              checked={confirm}
              onChange={setConfirm}
              className={`${confirm ? "bg-primary" : "bg-gray-400"
                } relative inline-flex h-6 w-11 items-center rounded-full`}
            >
              <span className="sr-only">Confirm bets before placing ?</span>
              <span className={`${confirm ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
            </Switch>
          </div>
          <div className="mt-2 text-right">
            <AiFillInfoCircle className="inline-block text-primary" />
            <span className="text-xs text-primary">
              {" "}
              Min Bet: &#8377; 100. Max Bet: &#8377; 5,00,000. Max Winning: &#8377; 20,00,000
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}

function ScoreBoard({
  close,
  sportKey,
  group,
  matchId,
}: ScoreBoardProps) {
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<Score | undefined>(undefined);
  const [cScore, setCScore] = useState<ScoreCrawler | undefined>(undefined);
  const [teams, setTeams] = useState<string[]>([]);
  const [commenceTime, setCommenceTime] = useState<string>("");
  const [countdown, setCountdown] = useState<string>(""); // countdown time
  const { getOddsByMatchId } = useContext(SportContext);

  // update countdown if game has not started
  useEffect(() => {
    if (commenceTime) {
      const time = new Date(commenceTime).getTime();
      const now = new Date().getTime();
      const diff = time - now;
      if (diff > 0) {
        const interval = setInterval(() => {
          const now = new Date().getTime();
          const diff = time - now;
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown(`${days ? days + 'd :' : ''} ${hours}h : ${minutes}m : ${seconds}s`);
          } else {
            setCountdown("");
            clearInterval(interval);
          }
        }, 1000);
      }
    }
  }, [commenceTime]);

  const getScores = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sports/score/?sport=${sportKey}&group=${group}&teams=${teams?.toString()}&commence_time=${commenceTime}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        const data = await response.json();
        if (!response.ok) {
          const error = (data && data.message) || response.status;
          return Promise.reject(error);
        }

        if (group === "Cricket" && teams?.length > 0) {
          setCScore(data as ScoreCrawler)
        } else {
          setScore(data.find((d: Score) => d.id === matchId) as Score);
        }
      } else {
        // toast.error(await response.text());
        console.log(await response.text());
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  // fetch getScores every 5 seconds 
  useEffect(() => {
    if (!sportKey) return;
    getScores(); // 1st time
    const interval = setInterval(() => {
      getScores(); // every 5 seconds
    }, 5000);
    return () => clearInterval(interval);
  }, [commenceTime, teams, sportKey, group]);

  useEffect(() => {
    if (!matchId) return;
    const updateOdds = () => {
      const oddsByMatchId = getOddsByMatchId(matchId)[0];
      if (oddsByMatchId) {
        setTeams([oddsByMatchId.home_team, oddsByMatchId.away_team]);
        setCommenceTime(oddsByMatchId.commence_time);
      }
    };
    updateOdds();
  }, [matchId, sportKey, group]);

  // if (!score) return null;

  return (
    <div
      className="sportsbook-scoreboard bg-black bg-gradient-to-br from-accent/40 to-primary/20 z-10 w-full duration-200 rounded-lg mb-4 relative"
    >
      <div className="bg-stadium-img rounded-lg">
        {/* header */}
        <div className="animate__animated animate__fadeInDown flex flex-col items-center justify-between w-full text-white p-4 mb-4">
          <div className="w-full">
            <div className="flex flex-row justify-between uppercase text-xl w-full items-start">
              {commenceTime && (
                <p className="rounded-b-md font-bold">
                  {new Date(commenceTime) > new Date()
                    ? "Starts At "
                    : "Started At "}
                  {new Date(commenceTime).toLocaleString("en-US", {
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                    day: "numeric",
                    month: "short",
                  })}
                  <span className="mt-2 block font-normal text-base max-w-xs">{cScore?.format}{cScore?.desc ? `, ${cScore?.desc}` : ''}</span>
                  <span className="mt-1 block font-light text-base max-w-xs">{cScore?.venue}</span>
                </p>
              )}
              <button
                onClick={close}
                className="rounded-full text-white p-2 right-0"
                title="close"
              >
                <FiX className="h-8 w-8" />
              </button>
            </div>
          </div>
          {(teams && teams.length > 0) && (
            <div className="flex-row flex w-full text-center justify-center items-start mt-6 mb-4">
              <div className="flex flex-col justify-center items-center">
                <p className="text-xl">{teams[0]}</p>
                {/* filter score from cScore?.scores[] where name = teams[0], if not show 0-0 */}
                {cScore?.scores && cScore.scores.filter((s: any) => s.name === teams[0]).map((s: any) => (
                  <Fragment key={s.score + '_y6'}>
                    <p className="font-bold text-3xl mt-4">{s.score || '-'}</p>
                    <p className="font-semibold text-xl mt-2">{s.overs ? `Overs: ${s.overs}` : ''}</p>
                    <p className="font-semibold text-xl mt-2">{s.wickets ? `Wickets: ${s.wickets}` : ''}</p>
                  </Fragment>
                ))}
                {/* if score and find in scores where name is teams[0]  */}
                {score && score?.scores?.filter((s: any) => s.name === teams[0]).map((s: any) => (
                  <p key={s.score + '_s1'} className="font-bold text-3xl mt-4">{s.score || '-'}</p>
                ))}
              </div>
              <h2 className="mx-8 font-black text-xl">VS</h2>
              <div className="flex flex-col justify-center items-center">
                <p className="text-xl">{teams[1]}</p>
                {/* filter score from cScore?.scores[] where name = teams[1] */}
                {cScore?.scores && cScore.scores.filter((s: any) => s.name === teams[1]).map((s: any) => (
                  <Fragment key={s.score + '_y6'}>
                    <p className="font-bold text-3xl mt-4">{s.score || '-'}</p>
                    <p className="font-semibold text-xl mt-2">{s.overs ? `Overs: ${s.overs}` : ''}</p>
                    <p className="font-semibold text-xl mt-2">{s.wickets ? `Wickets: ${s.wickets}` : ''}</p>
                  </Fragment>
                ))}
                {/* if score and find in scores where name is teams[0]  */}
                {score && score?.scores?.filter((s: any) => s.name === teams[1]).map((s: any) => (
                  <p key={s.score + '_o8'} className="font-bold text-3xl mt-4">{s.score || '-'}</p>
                ))}
              </div>
            </div>
          )}
          {(!cScore?.scores?.length && !score?.scores?.length) && (
            <div className="animate__animated animate__fadeInDown flex-row flex w-full text-center justify-center items-start mt-6 mb-4">
              <p className="font-thin tracking-[0.7rem] uppercase text-xl max-w-xs">Scores will be updated soon</p>
            </div>
          )}
        </div>

        {/* content */}
        <div className="animate__animated animate__fadeInUp grid grid-cols-2 w-full text-white min-h-[240px] md:min-h-[250px] lg:min-h-[300px]">
          <div className="col-span-2 w-full h-full text-center flex flex-col justify-center items-start">
            {countdown && (
              <div className="animate__animated animate__fadeInUp col-span-2 w-full h-full text-center flex flex-col justify-start items-center">
                <p className="font-thin tracking-[0.7rem] uppercase text-xl">Starting in</p>
                <p className="font-black tracking-widest text-3xl">{countdown}</p>
              </div>
            )}
            {cScore?.recent_stats && (
              <div className="animate__animated animate__fadeInUp col-span-2 w-full h-full text-center flex flex-col justify-start items-center">
                <span className="text-base font-bold tracking-[0.5em] bg-white bg-opacity-40 rounded-lg px-2 py-1">{cScore?.recent_stats}</span>
                <p className="mt-4">{cScore.status}</p>
                <p className="mt-1 uppercase">{cScore.runrate ? `Runrate: ${cScore.runrate}` : ''}</p>
                <p className="mt-1 uppercase">{cScore.type ? `Type: ${cScore.type}` : ''}</p>
                {cScore?.toss && (
                  <p className="mt-4 text-sm absolute bottom-4"><span className="font-bold">{cScore.toss.winner}</span> won the toss and decided to <span className="font-bold">{cScore.toss.decision}</span></p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

