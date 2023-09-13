// 1. FAWK LIVE POKER
// Operator ID : 9507
// Docs: https://documenter.getpostman.com/view/15443387/U16jP6uB#ad3b4937-dd27-4528-833a-993b2339ba5e
// Provider Needs 4 API Endpoints from us.
// /api/poker/auth/
// /api/poker/exposure
// /api/poker/results
// /api/poker/refund

// FAWK SERVER IP's: "52.66.120.45", "65.1.211.242", "3.108.94.176"

import express from "express";
import jwt from "jsonwebtoken";
import { query, validationResult, body } from "express-validator";
import config from "../../config/index.js";
import authorizer from "../../middleware/authorizer.js";
import db from "../../db/models/index.js";
import axios from "axios";
import { findUserByToken } from "../../utils/jwt.js";
import { logger } from "../../utils/logger.js";
import { txEvent } from "../../utils/transaction.js";
import { proxied_axios_request } from "../../utils/crawler.js";
import { Op } from "sequelize";
// import { sendTelegramMessageAdmin } from "../../utils/telegram.js";
const GAMEPROVIDER = db.GameProvider;
const BET = db.Bet;
const USER = db.User;
const router = express.Router();
const fawkAllowedIps = ["52.66.120.45", "65.1.211.242", "3.108.94.176"];

router
  .post(
    "/auth",
    body("token")
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("required param missing"), // Fawk will send user token in request body
    body("operatorId")
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("required param missing"),
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
          return res.status(400).json({ errors: errors.array() });
        const { token, operatorId } = req.body;

        // console.log(JSON.stringify(req.headers));
        // output of req.headers : {"x-forwarded-host":"staging.spade365.com","x-forwarded-port":"80","content-type":"application/json","content-length":"251","x-forwarded-proto":"https,http","x-forwarded-for":"52.66.120.45,127.0.0.1","host":"127.0.0.1:3000","connection":"upgrade"}

        // get ip from headers (x-forwarded-for: since we're behind nginx proxy in production)
        const ip =
          req.headers["x-forwarded-for"].split(",")[0] ||
          req.headers["x-forwarded-for"] ||
          req.ip;

        // if request ip is not in the list of allowed ips, return error
        if (!fawkAllowedIps.includes(ip)) {
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            errorCode: 1,
            message: "IP is not allowed to access",
          });
        }

        // Get user from body token
        const user = await findUserByToken(token);

        if (!user) {
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            errorCode: 1,
            message: "User token is invalid",
          });
        }

        // check if gameprovider with name fawk exists
        const gameProvider = await GAMEPROVIDER.findOne({
          where: {
            name: "fawk",
            key: operatorId,
          },
        });
        let providerId;
        // if gameprovider does not exist, create a new gameprovider with name "fawk" and save providerToken
        if (!gameProvider) {
          // create a gameprovider with name fawk
          const newGameProvider = await GAMEPROVIDER.create({
            name: "fawk",
            // token: providerToken, // no need to save token as multiple users can be playing at the same time
            ip: ip,
            lastAccess: Date.now(),
            key: operatorId,
          });
          providerId = newGameProvider.id;
        } else {
          providerId = gameProvider.id;
          // update token of gameprovider with name fawk
          await gameProvider.update({
            // token: providerToken, // no need to save token as multiple users can be playing at the same time
            ip: ip,
            lastAccess: Date.now(),
          });
        }

        // create a jwt for gameprovider
        let providerToken;
        providerToken = jwt.sign(
          {
            name: "fawk",
            gameProvider: true,
          },
          config.sessionSecret,
          { expiresIn: "1d" } // 1 day
        );

        // Success response
        return res.status(200).send({
          operatorId: parseInt(operatorId),
          userId: `${operatorId}_` + user.id,
          username: user.username || user.phone,
          playerTokenAtLaunch: token,
          token: providerToken,
          balance: user.credit + user.bonus,
          exposure: user.exposure,
          currency: "INR",
          language: "en",
          timestamp: Date.now(),
          clientIP: [user.ip],
          VIP: "3",
          errorCode: 0,
          errorDescription: "ok",
        });
      } catch (error) {
        logger.error(error);
        return res.status(200).send({
          // Fawk wants 200 even if there is an error
          errorCode: 1,
          message: "Request Failed",
        });
      }
    }
  )
  .post(
    "/exposure",
    body("token")
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Token is required"),
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          logger.error(`poker.exposure: validation failed`);
          // return res.status(400).json({ errors: errors.array() });
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            status: 1,
            message: "Token is required",
          });
        }

        // logger.info(`poker.exposure.req: ${JSON.stringify(req.body)}`); // log fawk request for debugging

        const {
          token,
          gameId,
          matchName,
          roundId,
          marketId,
          marketType,
          userId,
          calculateExposure,
          betInfo,
          runners,
        } = req.body;

        // if request ip is not in the list of allowed ips, return error
        // get ip from headers (x-forwarded-for: since we're behind nginx proxy in production)
        const ip =
          req.headers["x-forwarded-for"].split(",")[0] ||
          req.headers["x-forwarded-for"] ||
          req.ip;
        if (!fawkAllowedIps.includes(ip)) {
          logger.error("poker.exposure: req ip not found in fawkAllowedIps");
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            errorCode: 1,
            message: "IP is not allowed to access",
          });
        }

        // check if JWT token is valid
        const jwtData = jwt.verify(token, config.sessionSecret);
        if (!jwtData || !jwtData.gameProvider || jwtData.name !== "fawk") {
          logger.error("poker.exposure: fawk token verification failed");
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            status: 1,
            message: "Invalid Token",
          });
        }

        // get user from userId and calculate exposure
        const USER_ID = userId.split("_")[1];
        const user = await USER.findOne({
          where: {
            id: USER_ID,
          },
        });

        //  If user does not exist, return error response
        if (!user) {
          logger.error(`poker.exposure: invalid user id ${USER_ID}`);
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            status: 1,
            message: "Invalid User",
          });
        }

        // calculate exposure
        let totalUserExposure = calculateExposure || 0;
        totalUserExposure += parseInt(user.exposure) || 0;

        // if totalUserExposure is greater than user credit or user.exposureLimit, return error response
        // if (totalUserExposure > (user.credit + user.bonus) || totalUserExposure > Math.abs(user.exposureLimit)) {
        if (Math.abs(totalUserExposure) > (user.credit + user.bonus)) {
          // logger.error(`poker.exposure: Insufficient Balance for user ${user.id}`);
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            status: 1,
            message: "Insufficient Balance",
          });
        }

        // get bet where user_id = userId and gameId = gameId and marketId = marketId
        let bet = await BET.findOne({
          where: {
            user_id: USER_ID,
            category: "fawk",
            gameId: gameId,
            marketId: marketId,
            roundId: roundId,
          },
        });

        const bet_details = {
          user_id: USER_ID,
          category: "fawk", // fawk
          bonus_used: parseInt(user.bonus || 0) >= parseInt(betInfo?.reqStake || 0) ? parseInt(betInfo?.reqStake || 0) : parseInt(user.bonus || 0), // bonus_used will be used in case of status change by admin and to refund user.
          gameId: gameId,
          matchName: matchName,
          roundId: roundId,
          marketId: marketId,
          marketType: marketType,
          runnerName: betInfo?.runnerName,
          // reqStake: parseInt(betInfo?.reqStake || 0), // reqStake is the stake sent by fawk, using stake now instead of reqStake
          stake: parseInt(user.bonus || 0) >= parseInt(betInfo?.reqStake || 0) ? 0 : parseInt(betInfo?.reqStake || 0) - parseInt(user.bonus || 0), // stake will be used in case of status change by admin and to refund user. 
          selectedOdd: betInfo?.requestedOdds,
          pnl: parseInt(betInfo?.pnl),
          liability: Math.abs(calculateExposure || 0) || betInfo?.liability,
          status: betInfo?.status,
          // isBack: betInfo?.isBack,
          // pl: parseInt(betInfo?.pl),
          runners: runners,
          // bet_type: betInfo?.isBack ? "back" : "lay",
          orderId: betInfo?.orderId,
          betExposure: parseInt(calculateExposure || 0),
          exposureTime: Date.now(),
        };

        // Always update in order. First Bet, then user, then transaction
        // if bet does not exist, create a new bet else update bet
        if (!bet) {
          // create a bet
          bet = await BET.create(bet_details);
        } else {
          // update bet
          await bet.update(bet_details);
        }

        // Update user exposure with negative value of totalUserExposure
        // calculate req stake from credit and bonus. if bonus is greater than req stake, deduct from bonus first, then deduct remaining from credit
        if (user.bonus > 0) {
          if (user.bonus >= betInfo?.reqStake) {
            await user.update({
              bonus: parseInt(user.bonus) - parseInt(betInfo?.reqStake || 0), // deduct bet stake from user bonus
              exposure: -Math.abs(totalUserExposure),
              exposureTime: Date.now(),
            });
          } else {
            await user.update({
              bonus: 0, // bonus is all used and remaining req stake is deducted from credit as bonus is less than credit
              credit: parseInt(user.credit) - parseInt(betInfo?.reqStake - user.bonus),
              exposure: -Math.abs(totalUserExposure),
              exposureTime: Date.now(),
            });
          }
        } else {
          await user.update({
            credit: parseInt(user.credit) - parseInt(betInfo?.reqStake || 0), // deduct bet stake from user credit
            exposure: -Math.abs(totalUserExposure),
            exposureTime: Date.now(),
          });
        }

        const response = {
          status: 0,
          Message: "Exposure insert Successfully...",
          wallet: (user.credit + user.bonus) - betInfo?.reqStake,
          exposure: -Math.abs(totalUserExposure),
        };
        const tx = {
          user_id: user.id,
          type: "debit",
          amount: parseInt(betInfo?.reqStake),
          status: "success",
          remark: `Bet placed on ${matchName} for ${betInfo?.runnerName} at odds ${betInfo?.requestedOdds} with stake ₹ ${betInfo?.reqStake} - bet id: ${bet.id}`,
          reference: bet.id,
        };
        process.nextTick(() => {
          txEvent.emit("new_transacion", tx);
        });
        // logger.info(`poker.exposure.res ${JSON.stringify(response)}`); // log fawk response for debugging

        // Success response
        return res.status(200).send(response);
      } catch (error) {
        logger.error(`poker.exposure: ${error}`);
        return res.status(200).send({
          // Fawk wants 200 even if there is an error
          status: 1,
          message: "Request Failed",
        });
      }
    }
  )
  .post(
    "/results", // When result is declared for particular game, Fawk will send us profit loss object of users containing details about market and exact user P/L. One result Api call will be made per market settlement.
    async function (req, res) {
      try {
        // logger.info(`poker.results.req: ${JSON.stringify(req.body)}`); // log fawk request for debugging
        const { result, runners, betvoid, roundId, market } = req.body;

        // if request ip is not in the list of allowed ips, return error
        const ip = req.headers["x-forwarded-for"].split(",")[0] || req.headers["x-forwarded-for"] || req.ip;
        if (!fawkAllowedIps.includes(ip)) {
          logger.error("req ip not found in fawkAllowedIps");
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            errorCode: 1,
            message: "IP is not allowed to access",
          });
        }

        let resResult = []; // result array to be sent in response

        await Promise.all(
          // loop through each result
          await result.map(async (r) => {
            // if r.remoteUpdate is true, it means that we have recieved it before and result is already updated in our database
            // DISABLED AS WE'RE CHECKING FOR bet.remoteUpdate below instead
            // if (r.remoteUpdate) {
            //   logger.info(`poker.results: result already updated for ${r.userId}. Skipping... Results: ${JSON.stringify(result)}`);
            //   return
            // }
            const userId = parseInt(r.userId.split("_")[1]);

            // Find bet
            const bet = await BET.findOne({
              where: {
                roundId: roundId,
                category: "fawk",
                user_id: userId,
                marketId: r.marketId,
                gameId: r.gameId,
                status: "OPEN",
                // remoteUpdate: false, // DISABLED AS WE'RE CHECKING FOR bet.remoteUpdate below instead
              },
            });

            // if bet does not exist, return error response
            if (!bet) {
              logger.error(`poker.results: bet not found for user ${userId}`);
              return res.status(200).send({
                // Fawk wants 200 even if there is an error
                Error: 1,
                message: "Bet not found",
              });
            }

            if (bet.remoteUpdate) {
              logger.info(`Info: poker.results: result already updated for ${bet.id}. Skipping...`);
              // sendTelegramMessageAdmin(`poker.results: result already updated for bet id: ${bet.id}. Skipping...`);
              return
            }

            // Find bet user
            const user = await USER.findOne({
              where: {
                id: userId,
              },
            });

            // if user does not exist, return error response
            if (!user) {
              logger.error(`poker.results: user not found for user ${userId}`);
              return res.status(200).send({
                // Fawk wants 200 even if there is an error
                Error: 1,
                message: "User not found",
              });
            }

            // Calculate new user balance
            let newUserBalance = parseInt(user.credit) + parseInt(bet.stake) || 0;
            if (betvoid) { // if bet is void
              newUserBalance += 0;
            } else if (parseInt(r.downpl) < 0) { // if user lost the bet
              newUserBalance -= bet.bonus_used >= Math.abs(r.downpl) ? 0 : Math.abs(r.downpl) - bet.bonus_used; // if bonus used is greater than or equal to user loss, then no need to deduct from user balance
            } else if (parseInt(r.downpl) >= 0) { // user won the bet
              newUserBalance += parseInt(Math.abs(r.downpl));
            }

            // Calculate new user exposure. user.exposure is stored as negative value in our database
            let newUserExposure = parseInt(user.exposure) || 0;
            newUserExposure += Math.abs(parseInt(bet.betExposure)) || 0;

            // Always update in order. First Bet, then user, then transaction
            // update bet
            await bet.update({
              // pl: parseInt(r.downpl) || 0,
              pnl: parseInt(r.downpl) || 0,
              status: betvoid ? "VOID" : parseInt(r.downpl) > 0 ? "WON" : "LOST",
              // settlement_id: r._id, // settlement_id is int type and r._id is string type, hence not updating it
              // downpl: parseInt(r.downpl) || 0, // Profit/loss from this market
              gameType: market?.gameType,
              gameSubType: market?.gameSubType,
              remoteUpdate: true, // set remoteUpdate to true so that we can skip this bet if results are sent again next time
              // result: r,
            });

            // logger.info(`poker.results: bet ${bet.id} updated`); // log fawk response for debugging

            // update user
            await user.update({
              // exposure: -Math.abs(newUserExposure), // exposures to be kept negative
              exposure: 0, // reset exposure to 0
              credit: parseInt(newUserBalance),
            });

            // add transaction when credit, debit tx already in /exposure endpoint
            const tx = {
              user_id: user.id,
              // type: r.downpl > 0 ? "credit" : "debit",
              type: betvoid ? "credit" : r.downpl >= 0 ? "credit" : r.downpl < 0 ? bet.stake <= Math.abs(parseInt(r.downpl)) ? "debit" : "credit" : "debit", // if bet is void, then credit, else if user won, then credit, else if user lost and stake is greater than loss, then debit, else credit
              amount: betvoid ? bet.stake : r.downpl >= 0 ? parseInt(r.downpl) + bet.stake : Math.abs(Math.abs(bet.stake) - Math.abs(parseInt(r.downpl))), // if lost deduct pnl from stake, as stake already deducted in /exposure
              status: "success",
              remark: `user ${betvoid ? "bet void" : r.downpl >= 0 ? "won" : "lost"} ₹ ${r.downpl} at stake of ₹ ${bet.stake} in bet id: ${bet.id}`,
              reference: bet.id,
            };
            process.nextTick(() => {
              txEvent.emit("new_transacion", tx);
            });

            // logger.info(`poker.results: user ${userId} balance and exposure updated`); // log fawk response for debugging

            // push to resResult array
            resResult.push({
              wallet: newUserBalance + user.bonus,
              exposure: -Math.abs(newUserExposure),
              userId: r.userId,
            });
          })
        );

        // logger.info(`poker.results.res: ${JSON.stringify(resResult)}`); // log fawk response for debugging

        return res.status(200).send({
          Error: "0",
          result: resResult,
          message: `${resResult.length} users pl updated`,
        });
      } catch (error) {
        logger.error(`poker.results: ${error}`);
        return res.status(200).send({
          Error: 1,
          message: "Request Failed",
        });
      }
    }
  )
  .post(
    // Refund API is called when exposure request is failed or rejected from poker server.
    "/refund",
    body("token")
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Token is required"), // refund request will have user's token
    body("exposureTime").optional({ checkFalsy: true }),
    body("betInfo").optional({ checkFalsy: true }).isObject(),
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const {
          token,
          gameId,
          matchName,
          roundId,
          marketId,
          marketType = "",
          userId,
          exposureTime,
          betInfo,
        } = req.body;

        // if request ip is not in the list of allowed ips, return error
        const ip = req.headers["x-forwarded-for"].split(",")[0] || req.headers["x-forwarded-for"] || req.ip;
        if (!fawkAllowedIps.includes(ip)) {
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            errorCode: 1,
            message: "IP is not allowed to access",
          });
        }

        const USER_ID = parseInt(userId.split("_")[1]);
        const user = await USER.findOne({
          where: {
            id: USER_ID,
          },
        });

        // if not user, return error response
        if (!user) {
          logger.error(`poker.refund: user not found ${USER_ID} Skipping...`);
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            status: 1,
            Message: "request failed",
          });
        }

        // Find bet where status is not VOID
        const bet = await BET.findOne({
          where: {
            category: "fawk",
            roundId: roundId,
            user_id: USER_ID,
            marketId: marketId,
            gameId: gameId,
            // status: "OPEN",
            status: {
              [Op.not]: "VOID", // IMPORTANT: status is not VOID
            },
          },
        });

        // if bet does not exist, return error response
        if (!bet) {
          // if bet not found and fawk is sending refund request, then user must have been charged for this bet. So refund user's credit
          // DISABLED DUE TO MULTIPLE REFUND LOOP REQUESTS FROM FAWK
          // if (betInfo?.reqStake) {
          //   await user.update({ credit: parseInt(user.credit) + parseInt(betInfo.reqStake), exposure: 0 });
          //   logger.info(`poker.refund: bet not found but refund successful. user ${userId} balance and exposure updated`); // log fawk response for debugging
          //   return res.status(200).send({
          //     status: 0,
          //     Message: "success",
          //     wallet: parseInt(user.credit) + parseInt(betInfo.reqStake),
          //     exposure: user.exposure, // user exposure is already negative
          //   });
          // }
          logger.error(`Info: poker.refund: bet not found for user id: ${USER_ID}  Skipping...`);
          // sendTelegramMessageAdmin(`Info: poker.refund: Refund request from Fawk but bet not found for User ID: ${USER_ID} Skipping...`);
          return res.status(200).send({
            // Fawk wants 200 even if there is an error
            status: 1,
            Message: "Bet not found",
          });
        }

        // remove exposure from user.exposure and mark bet as void

        // Calculate new user exposure. user.exposure is stored as negative value in our database
        let newExposure = parseInt(user.exposure) || 0;
        newExposure += Math.abs(parseInt(bet.betExposure)) || 0;

        // update bet
        await bet.update({
          betvoid: true,
          status: "VOID", // IMPORTANT: status is VOID now
          settlement_id: null,
          pnl: 0,
          gameType: marketType,
          remoteUpdate: true,
        });

        // update user
        await user.update({
          credit: user.credit + parseInt(bet.stake || 0), // add bet stake to user credit
          // exposure: -newExposure,
          exposure: 0,
        });

        // sendTelegramMessageAdmin(`Info: poker.refund: Refund request from Fawk for User ID: ${USER_ID} successful. User credit and exposure updated`);
        logger.info(`poker.refund: refund successful. user id: ${USER_ID} balance and exposure updated`); // log fawk response for debugging

        // emit new transaction event
        const tx = {
          user_id: user.id,
          // type: r.downpl > 0 ? "credit" : "debit",
          type: "credit",
          amount: parseInt(bet.stake || 0),
          status: "success",
          remark: `Refund for bet id: ${bet.id}`,
          reference: bet.id,
        };
        process.nextTick(() => {
          txEvent.emit("new_transacion", tx);
        });

        // Success response
        return res.status(200).send({
          status: 0,
          Message: "success",
          wallet: user.credit + user.bonus,
          exposure: -newExposure,
        });
      } catch (error) {
        logger.error(`poker.refund: ${error}`);
        // logger.error(`poker.refund.req: ${JSON.stringify(req.body)}`); // log fawk response for debugging
        return res.status(200).send({
          // Fawk wants 200 even if there is an error
          status: 1,
          Message: "request failed",
        });
      }
    }
  )
  .get(
    // Called from admin panel. This API returns result object same as "RESULT API". This is purely for getting Json of your missed results. This API cannot return response for the unsettled games
    "/results",
    query("market")
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("markets is required"),
    authorizer,
    async function (req, res) {
      try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { market } = req.query;
        const operatorId = "9507";

        // send a post request to https://fawk.app/api/exchange/odds/market/result with operatorId and markets. marketexample: "6450c3e19efc2eb03e8af479"
        // const result = await axios.post("https://fawk.app/api/exchange/odds/market/result",
        //   {
        //     operatorId,
        //     markets: [market],
        //   }
        // );

        // Using proxy to bypass cloudflare restriction from fawk. This is a temporary fix as they're not accepting issue with our ip being blocked by cloudflare
        const result = await proxied_axios_request("https://fawk.app/api/exchange/odds/market/result", "post", {
          operatorId,
          markets: [market],
        });

        // return response
        return res.status(200).json(result.data);
      } catch (error) {
        logger.error(`poker.results: ${error}`);
        return res.status(400).send("Request Failed");
      }
    }
  );
// .post(
//   // Called from admin panel. Fix for when fawk results fail to update bet status but updates user credit. This api settles all open bets in category "fawk". It goes through all open bets where category is "fawk" and gets result from https://fawk.app/api/exchange/odds/market/resultJson and settles the bets. It doesn't update user's credit and exposure
//   "/settle",
//   authorizer,
//   async function (req, res) {
//     try {
//       if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

//       // get all open bets where category is "fawk"
//       const bets = await BET.findAll({
//         where: {
//           category: "fawk",
//           status: "OPEN",
//         },
//       });

//       // if no bets, return error
//       if (!bets.length) return res.status(400).send("No bets found");

//       // for each bet, get result from https://fawk.app/api/exchange/odds/market/resultJson
//       for (let i = 0; i < bets.length; i++) {
//         const bet = bets[i];
//         const response = await axios.post(
//           "https://fawk.app/api/exchange/odds/market/resultJson",
//           {
//             operatorId: "9507",
//             markets: [bet.marketId],
//           }
//         );

//         // if result is not found, continue
//         if (!response.data.result.length || !response.data.success) continue;

//         // if result is found, update bet
//         const resultsObj = response.data.result[0].result;

//         logger.info(`poker.settle: resultsObj: ${JSON.stringify(resultsObj)}`);

//         // get result where "userId": "9507_4622" matches with bet.user_id after splitting on "_"
//         const resultObj = resultsObj.find((r) => parseInt(r.userId.split("_")[1]) === bet.user_id);

//         logger.info(`poker.settle: resultObj: ${JSON.stringify(resultObj)}`);

//         // if resultObj is not found, continue
//         if (!resultObj) {
//           // update bet as void
//           await bet.update({
//             status: "VOID",
//           });
//           continue;
//         };

//         // if resultObj is found, update bet
//         await bet.update({
//           status: resultObj.orders[0].status || "OPEN",
//           // settlement_id: resultObj._id,
//           pnl: parseInt(resultObj.downpl) || 0,
//         });
//       }
//     } catch (error) {
//       logger.error(`poker.settle: ${error}`);
//       return res.status(400).send("Request Failed");
//     }
//   }
// )

export default router;
