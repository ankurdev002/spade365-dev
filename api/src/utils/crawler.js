// const crawler = require('crawler');
import crawler from "crawler";
import axios from "axios";
import NodeCache from "node-cache";
import * as Tunnel from 'tunnel';
import config from "../config/index.js";
import { logger } from "./logger";

const cachedData = new NodeCache({
  stdTTL: 10, // 10 second cache
  checkperiod: 2, // 2 seconds
  maxKeys: -1, // max number of keys in cache, -1 means unlimited
});

// Crawler to get the score of the teams. pass team names as an array in any order and in any casing
// Only Live, Recent and Upcoming matches are available on source website (cricbuzz.com)
// getCricketScoreFromCrawl(["Peshawar Zalmi", "Quetta Gladiators"], "2023-03-08T14:00:00Z");
export async function getCricketScoreFromCrawl(teams, date) {
  try {
    const key = `cricScore_${teams.join("_")}_${date}`; // key for cache, use team names as key
    const value = cachedData.get(key); // get the cached value
    if (value) {
      return value; // keys expire after ttl
    }

    let response = {
      category: "",
      desc: "", // 25th Match etc (if available)
      format: "", // test, odi, t20
      status: "",
      started_at: "",
      completed_at: "",
      completed: false,
      abandoned: false,
      toss: {},
      venue: "",
      scoreboard_url: "",
      target: "",
      scores: [],
      result: {},
      players_of_match: [], // array having mvp or man/player of the match
    };

    const url = [
      "https://www.cricbuzz.com/cricket-match/live-scores",
      "https://www.cricbuzz.com/cricket-match/live-scores/recent-matches",
      "https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches",
    ]; // live, recent and upcoming

    const tunnel = Tunnel.httpsOverHttp({
      proxy: {
        host: config.proxyUrl,
        port: config.proxyPort,
        proxyAuth: `${config.proxyUser}:${config.proxyPass}` // "username:password"
      },
      headers: generate_req_headers(),
    });

    const c = new crawler({
      maxConnections: 10,
      retries: 5, // retry 5 times
      retryTimeout: 6000, // 6 secs
      userAgent: get_random_user_agent(), // random user agent for more anonymity and to avoid blocking
      tunnel,
      jQuery: {
        name: "cheerio",
        options: {
          normalizeWhitespace: true,
          xmlMode: false,
        },
      },
    });

    // for each url, queue, break when scores are found
    for (let i = 0; i < url.length; i++) {
      if (response.scores.length > 0) {
        break;
      }

      response.category = url[i]
        .split("/")
        .pop()
        .replace("-", " ")
        .replace("matches", "")
        .replace("scores", "")
        .trim(); // live, recent, upcoming

      // visit the feed url and get basic scores and game link
      await new Promise((resolve, reject) => {
        c.queue({
          uri: url[i],
          // proxy: proxy, // random proxy
          // limiter: proxy, // 1 sec
          callback: function (error, res, done) {
            if (error) {
              console.log(error);
              logger.error("Crawler: " + error);
            }
            crawl_cricbuzz_feed(teams, date, res, response);
            done();
            resolve();
          },
        });
      });

      if (!response.scoreboard_url) {
        continue;
      }

      // get match id from scorecard url
      const match_id = response.scoreboard_url.match(/\/(\d+)\//)[1];
      const commentary_api = `https://www.cricbuzz.com/api/cricket-match/${match_id}/full-commentary/0`;
      const commentary_res = await proxied_axios_request(commentary_api, "GET");
      const com = commentary_res.data.matchDetails.matchHeader; // match header
      const cms = commentary_res.data.matchDetails.miniscore; // miniscore
      response.format = com.matchFormat;
      response.completed = com.complete;
      response.day = com.dayNumber;
      response.desc = com.matchDescription;
      response.type = com.matchType;
      response.completed_at = new Date(com.matchCompleteTimestamp).toISOString(); // input is timestamp
      response.started_at = new Date(com.matchStartTimestamp).toISOString(); // input is timestamp
      response.venue = com.venue.name + ", " + com.venue.city + ", " + com.venue.country;
      response.toss.winner = com.tossResults.tossWinnerName;
      response.toss.decision = com.tossResults.decision;
      response.target = cms?.target;
      response.status = cms?.status;
      response.recent_stats = cms?.recentOvsStats; // recent overs stats
      response.runrate = cms?.currentRunRate;
      response.req_runrate = cms?.requiredRunRate;

      if (response.scores.length > 0) {
        const team1 = com.team1;
        const team2 = com.team2;
        for (const score of response.scores) {
          if (score.name === team1.name) score.short_name = team1.shortName;
          if (score.name === team2.name) score.short_name = team2.shortName;
          // if score.score in format 179-6 (20 Ovs) or 183-8 (19.3 Ovs), i.e score-wickets (overs)
          if (score.score.match(/\d+-\d+\s\(\d+\.\d+\sOvs\)/) || score.score.match(/\d+-\d+\s\(\d+\sOvs\)/)) {
            const score_arr = score.score.split(" ");
            const score_wickets = score_arr[0].split("-");
            score.score = parseInt(score_wickets[0]);
            score.wickets = parseInt(score_wickets[1]);
            score.overs = parseFloat(score_arr[1].replace("(", "").replace("Ovs)", ""));
          }

          // get first cms.matchScoreDetails.inningsScoreList.inningsId where batTeamName === score.short_name
          const innings = cms?.matchScoreDetails.inningsScoreList.find(
            (i) => i.batTeamName === score.short_name
          );
          // no need to get score if innings not started
          if (innings) {
            score.innings_id = innings?.inningsId;
            const over_by_over = await get_cricbuzz_overbyover(match_id, score);
            score.over_by_over = over_by_over;
          }
        }
      }

      if (response.completed || com.result.length > 0) {
        const type = com.result.resultType;
        const winner = com.result.winningTeam;
        response.result = { type, winner };
        for (const pom of com.playersOfTheMatch) {
          response.players_of_match.push({
            name: pom.fullName,
            team: pom.teamName,
          });
        }
      }
    }
    cachedData.set(key, response, 60 * 5); // set the cache for 5 mins
    // console.log(response);
    return response;
  } catch (error) {
    console.log(error);
    logger.error("getCricketScoreFromCrawl: " + error);
  }
}

function crawl_cricbuzz_feed(teams, date, res, response) {
  try {
    const $ = res.$;

    // if res.body has first element h1 with text "Access Denied", then return and log error
    if (res.body.match(/<H1>Access Denied<\/H1>/)) {
      logger.error("crawl_cricbuzz_feed: Cricbuzz Access Denied. Either IP is banned or too many requests.");
      return;
    }

    const scoreboard = $("div.cb-scrd-lft-col"); // container of the scoreboard
    const rows = scoreboard.find("div.cb-mtch-lst"); // get the score of the teams
    rows.each(function (i, row) {
      const teamNames = $(row).find("a.text-hvr-underline.text-bold").text().replace(["vs ", ","], "").trim(); // output type: string

      // compare dates for more accuracy including time of match (2023-03-08T08:00:00.000Z !== 2023-03-08T14:00:00.000Z)
      const gDateCont = $(row).find("div.cb-billing-plans-text").children().first().children().last().children().first().attr("ng-if");
      const gDate = gDateCont.match(/\((\d+)\s\|/)[1];
      const gDateObj = new Date(parseInt(gDate));
      if (gDateObj.toDateString() !== new Date(date).toDateString()) return; // if date not equal, bail. replace toDateString() with toISOString() to compare time and date. although a min difference in time will not return the match as sometimes the time is different by a few mins between crizbuzz and odds api.. so sticking with date comparison for now

      // if all team names are present in teams array in any order, ignoring casing
      if (teams.every((team) => teamNames.toLowerCase().includes(team.toLowerCase()))) {
        if (response.scores.length > 1) return; // if both teams are found, break the loop
        const scorecards = $(row).find("div.cb-scr-wll-chvrn.cb-lv-scrs-col").children();
        response.scoreboard_url = "https://www.cricbuzz.com" + $(row).find("a.text-hvr-underline.text-bold").attr("href"); // scoreboard url
        response.status = $(row).find("div.cb-text-complete").text().trim() || $(row).find("div.cb-text-live").text().trim();
        if ($(row).find("div.cb-text-complete").text().trim()) {
          response.completed = true;
          // inner text is No result, then match is completed but status is abandoned
          if ($(row).find("div.cb-text-complete").text().trim() === "No result") {
            response.abandoned = true;
          }
        } else if ($(row).find("div.cb-text-live").text().trim()) {
          response.completed = false;
        }
        scorecards.each(function (i, scorecard) {
          if (i < 2) {
            const team = {};
            team.name = $(row).find("a.text-hvr-underline.text-bold").text().replace(",", "").split("vs")
            [i].trim(); //$(scorecard).children().first().text().trim();
            team.score = $(scorecard).children().last().text().trim();
            response.scores.push(team);
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
    logger.error("crawl_cricbuzz_feed: " + error);
  }
}

async function get_cricbuzz_overbyover(match_id, team) {
  try {
    let over_by_over = [];
    const com = await proxied_axios_request(`https://www.cricbuzz.com/api/cricket-match/${match_id}/full-commentary/${team.innings_id}`, "GET");
    const ci = com.data.commentary[0].commentaryList;
    let lastOver = 0;
    ci.filter((c) => c.overNumber).sort((a, b) => a.overNumber - b.overNumber).forEach((c) => {
      if (c.batTeamName === team.short_name) {
        const over = Math.floor(c.overNumber);
        if (over > lastOver) {
          over_by_over.push({
            over: over,
            score: c.batTeamScore,
          });
          lastOver = over;
        }
      }
    });
    return over_by_over;
  } catch (error) {
    console.log(error);
    logger.error("get_cricbuzz_overbyover: " + error);
  }
}

// get random desktop user agent. skipping mobile user agents as they change the page layout
function get_random_user_agent() {
  const user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/110.0.1587.63",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:110.0) Gecko/20100101 Firefox/110.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Vivaldi/5.7.2921.60",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13.2; rv:110.0) Gecko/20100101 Firefox/110.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  ];
  const rand_user_agent = user_agents[Math.floor(Math.random() * user_agents.length)];
  return rand_user_agent;
}

function generate_req_headers() {
  return {
    "user-agent": get_random_user_agent(),
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-encoding": "gzip, deflate, br",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "sec-gpc": "1",
    "sec-fetch-user": "?1",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "navigate",
    "sec-fetch-dest": "document",
    "sec-ch-ua-mobile": "?0",
    "connection": "keep-alive",
    "pragma": "no-cache",
    "cookie": "pc=1; cb_config=%7B%7D; cbzads=IN|not_set|not_set|not_set; cbgeo=IN",
    "upgrade-insecure-requests": "0",
  };
}

export async function proxied_axios_request(url, method, data = {}) {
  try {
    const tunnel = Tunnel.httpsOverHttp({
      proxy: {
        host: config.proxyUrl,
        port: config.proxyPort,
        proxyAuth: `${config.proxyUser}:${config.proxyPass}` // "username:password"
      },
      headers: generate_req_headers(),
    });

    const response = await axios.request({
      url,
      method,
      timeout: 8000, // 8 seconds
      // headers: generate_req_headers(),
      httpsAgent: tunnel,
      proxy: false,
      data,
    });

    return response;

  } catch (error) {
    console.log(error);
    logger.error("get_working_proxy: " + error);
  }
}

// getCricketScoreFromCrawl(["New Zealand", "Sri Lanka"], "2023-03-08T22:01:55Z");