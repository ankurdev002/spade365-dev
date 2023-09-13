// 2. WCO (aka SUPERNOWA and more)
// Docs: https://documenter.getpostman.com/view/11720530/Uyr7Gy3A
// Provider Needs 3 API Endpoints from us.
// /api/wco/debit <- This is the endpoint WCO will be calling to to debit money from the player’s wallet (place bet) or rollback/cancel bet
// /api/wco/credit <- This is the endpoint WCO will be calling to to credit money from the player’s wallet (settle/lose/cancel).
// /api/wco/balance <- This is the endpoint WCO will be calling to to get/send player balance.

// Following endpoints are for our use to fetch details from WCO API
// /api/wco/auth/ <- This is the endpoint we'll calling from the frontend to get session id & game launch url. All secrets to be handled here and not expected to be sent from frontend.
// /api/wco/games <- (optional) This is optional endpoint we can call to fetch game details by particular provider. All secrets to be handled here and not expected to be sent from frontend.

// Staging Details from WCO: (For testing purpose only)
// Authentication url : https://stage.worldcasinoonline.com/api/Auth/UserAuthentication
// Partner name : spade365
// Partner key  : yL7+KgrtTS++4hzO4cfc1tUeR5JJP4BBHm2ImF9KXeexfQMQUAUZgn2FQAWrXN93uChpZQ0KIzQ=
// Provider enabled SN
// https://staging.spade365.com/api/wco/balance/
// https://staging.spade365.com/api/wco/credit/
// https://staging.spade365.com/api/wco/debit/

// Game providers (ProviderName -> ProviderCode)
// Supernowa -> SN, Power Games -> PG, Xprogramming -> XPG, Evolution -> EV, Ezugi -> EZ, Qtech -> QT, AE Sexy Casino -> AWC, Binary -> BN, Pragmatic Play -> PP, Only Play -> GT, One Touch -> OT, Fantasy Sports -> FTZ

/** ===> make sure gameprovider data is added to db with name as 'wco'  */

import express from "express";
import { validationResult, body } from "express-validator";
import config from "../../config/index.js";
import db from "../../db/models/index.js";
import axios from "axios";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
import { txEvent } from "../../utils/transaction.js";

const GAMEPROVIDER = db.GameProvider;
const USER = db.User;
const TX = db.Transaction;
const BET = db.Bet;
const router = express.Router();

router
  .post(
    "/auth", // Called by us from frontend to get session id & game launch url
    body("gameCode").isString().optional({ checkFalsy: true }), // (Optional) Unique code per game table created by provider/ pass null if lobby needs to be opened
    body("providerCode").isString().optional({ checkFalsy: true }), // (Optional) Provider code for the game providers, it will be 'SN' for Supernowa lobby. Refer list of provider code. (Upon not passing any value, lobby will be opened with all provider game
    authorizer,
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: errors.array(),
            },
          });
        }
        const { gameCode = null, providerCode = null } = req.body;
        const { user } = req;

        // check if gameprovider exists
        let gameProvider;
        gameProvider = await GAMEPROVIDER.findOne({
          where: {
            name: "wco",
          },
        });

        // if gameprovider does not exist return error
        if (!gameProvider) {
          // create gameprovider
          gameProvider = await GAMEPROVIDER.create({
            name: "wco",
            key: config.wcoPartnerKey, // secret key, should not reach frontend or expected to be sent from frontend
          });
        }

        const reqData = {
          partnerKey: gameProvider.key,
          game: {
            gameCode,
            providerCode,
          },
          timestamp: Date.now(),
          user: {
            id: user.id,
            currency: "INR",
            displayName: user.name,
            backUrl: config.homeURL,
          },
        };
        const result = await axios.post(
          `https://stage.worldcasinoonline.com/api/Auth/UserAuthentication`,
          reqData,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // log axios post request
        logger.info(
          `post https://stage.worldcasinoonline.com/api/Auth/UserAuthentication with ${JSON.stringify(
            reqData
          )} and got ${JSON.stringify(result?.data)}`
        );

        // bail if post request failed
        if (result?.data?.status?.code != "SUCCESS") {
          logger.error(
            `post https://stage.worldcasinoonline.com/api/Auth/UserAuthentication failed with ${JSON.stringify(
              result?.data?.status
            )} `
          );
          return res
            .status(400)
            .send(
              `request failed with ${JSON.stringify(result?.data?.status)}`
            );
        }

        res.status(200).send(result.data);
      } catch (error) {
        logger.error(error);
        res.status(400).send("request failed");
      }
    }
  )
  .post(
    "/balance", // Called by WCO to get user balance
    body("partnerKey").isString().trim().escape(),
    body("userId").isString().trim().escape(),
    body("timestamp").optional({ checkFalsy: true }).isString().trim().escape(),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: errors.array(),
            },
          });
        }
        const { partnerKey, userId } = req.body;

        // TODO: Check if request is coming from WCO server IP

        // get user from userId
        const user = await USER.findOne({
          where: {
            id: userId,
          },
        });

        // if user does not exist return error
        if (!user) {
          return res.status(400).send({
            status: {
              code: "INVALID_TOKEN",
              message: "",
            },
          });
        }

        // get gameprovider where name is 'wco'
        const gameProvider = await GAMEPROVIDER.findOne({
          where: {
            name: "wco",
          },
        });

        // if gameprovider does not exist or gameProvider.key is not equal to partnerKey, return error
        if (!gameProvider || gameProvider.key != partnerKey) {
          return res.status(401).send({
            status: {
              code: "INVALID_TOKEN",
              message: "",
            },
          });
        }
        gameProvider.update({ lastAccess: new Date() });
        // success reponse with user balance to WCO
        return res.status(200).send({
          partnerKey,
          timestamp: Date.now(),
          userId,
          balance: user.credit - user.exposure,
          status: {
            code: "SUCCESS",
            message: "",
          },
        });
      } catch (error) {
        logger.error(error);
        res.status(400).send("request failed");
      }
    }
  )
  .post(
    "/credit", // Called by WCO to credit user balance
    body("partnerKey")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("partnerKey is required"),
    body("timestamp")
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("timestamp is required"),
    body("gameData").optional({ checkFalsy: true }).isObject(),
    body("user").isObject().withMessage("user is required"),
    body("transactionData")
      .isObject()
      .withMessage("transactionData is required"),
    body("transactionData.amount").isFloat({ min: 0 }),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: errors.array(),
            },
          });
        }
        let tx;
        let resData = {};
        const {
          partnerKey,
          user,
          gameData = {},
          transactionData,
          timestamp = new Date(),
        } = req.body;

        // TODO: Check if request is coming from WCO server IP

        // check if gameprovider exists
        const gameProvider = await GAMEPROVIDER.findOne({
          where: {
            name: "wco",
          },
        });

        // if gameprovider does not exist return error
        if (!gameProvider) {
          return res.status(401).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "LOGIN_FAILED",
              message: "cannot find game provider",
            },
          });
        }
        gameProvider.update({ lastAccess: new Date() });
        const userInfo = await USER.findOne({ where: { id: user.id } });
        if (!userInfo) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: "user not found",
            },
          });
        }
        if (userInfo.is_banned) {
          return res.status(403).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "ACCOUNT_BLOCKED",
              message: "account is banned",
            },
          });
        }

        const existingBet = await BET.findOne({
          where: {
            user_id: user.id,
            gameId: gameData.gameCode,
            roundId: gameData.providerRoundId,
            orderId: gameData.providerTransactionId,
          },
        });
        if (!existingBet) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: "bet info not found",
            },
          });
        }
        if (gameData.description == "win") {
          if (existingBet.status != "OPEN") {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet already finalised",
              },
            });
          }
          const betData = existingBet;
          await betData.update({ status: "WON" });
          let userBalance = userInfo.credit;
          userBalance += transactionData.amount;
          await userInfo.update({ credit: userBalance });
          tx = {
            user_id: user.id,
            type: "credit",
            amount: transactionData.amount,
            status: "success",
            remark: `wco won bet id: ${betData.id}`,
            reference: transactionData.id,
            timestamp: new Date(timestamp * 1000),
            game_data: gameData,
          };
          resData = {
            partnerKey: gameProvider.key,
            userId: user.id,
            timestamp: Date.now(),
            balance: userBalance,
            status: {
              code: "SUCCESS",
              message: "",
            },
          };
        } else if (gameData.description == "lose") {
          const betData = existingBet;
          if (betData.status != "OPEN") {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet info already finalized",
              },
            });
          }
          await betData.update({ status: "LOSE" });
          resData = {
            partnerKey: gameProvider.key,
            userId: user.id,
            timestamp: Date.now(),
            balance: userInfo.credit,
            status: {
              code: "SUCCESS",
              message: "",
            },
          };
          tx = {
            user_id: user.id,
            type: "debit",
            amount: 0,
            status: "success",
            remark: `wco lose bet id: ${betData.id}`,
            reference: transactionData.id,
            timestamp: new Date(timestamp * 1000),
            game_data: gameData,
          };
        } else if (gameData.description == "cancel") {
          const existingTx = await TX.findOne({
            where: {
              reference: transactionData.referenceId,
            },
          });
          if (!existingTx) {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "transaction reference id invalid",
              },
            });
          }
          const betData = existingBet;
          if (betData.status != "WON") {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet info already finalized",
              },
            });
          }
          await betData.update({ status: "CREDIT_CANCEL" });
          await existingTx.update({ status: "reverted" });

          let userBalance = userInfo.credit;
          userBalance -= transactionData.amount;

          tx = {
            user_id: user.id,
            type: "debit",
            amount: transactionData.amount,
            status: "success",
            remark: `cancelled reference ${existingTx.reference}`,
            reference: transactionData.id,
            timestamp: new Date(timestamp * 1000),
            game_data: gameData,
          };
          resData = {
            partnerKey: gameProvider.key,
            userId: user.id,
            timestamp: Date.now(),
            balance: userInfo.credit,
            status: {
              code: "SUCCESS",
              message: "",
            },
          };
          await userInfo.update({ credit: userBalance });
        } else {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: "invalid method",
            },
          });
        }
        res.status(200).send(resData);
        if (tx) {
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
      } catch (error) {
        logger.error(error);
        res.status(500).send({
          partnerKey: null,
          timestamp: null,
          userId: null,
          balance: 0,
          status: {
            code: "UNKNOWN_ERROR",
            message: "credit request failed",
          },
        });
      }
    }
  )
  .post(
    "/debit", // Called by WCO to debit user balance
    body("partnerKey")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("partnerKey is required"),
    body("timestamp")
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .escape()
      .notEmpty()
      .withMessage("timestamp is required"),
    body("gameData").optional({ checkFalsy: true }).isObject(),
    body("user").isObject().withMessage("user is required"),
    body("transactionData")
      .isObject()
      .withMessage("transactionData is required"),
    body("transactionData.amount").isFloat({ min: 0 }),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: errors.array(),
            },
          });
        }
        let tx;
        let resData = {};
        const {
          partnerKey,
          user,
          gameData = {},
          transactionData,
          timestamp = new Date(),
        } = req.body;

        // check if gameprovider exists
        const gameProvider = await GAMEPROVIDER.findOne({
          where: {
            name: "wco",
          },
        });
        // if gameprovider does not exist return error
        if (!gameProvider) {
          return res.status(401).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "LOGIN_FAILED",
              message: "cannot find game provider",
            },
          });
        }
        gameProvider.update({ lastAccess: new Date() });
        const userInfo = await USER.findOne({ where: { id: user.id } });
        if (!userInfo) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: "user not found",
            },
          });
        }
        if (userInfo.is_banned) {
          return res.status(403).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "ACCOUNT_BLOCKED",
              message: "account is banned",
            },
          });
        }
        if (gameData.description == "bet") {
          const existingBet = await BET.findOne({
            where: {
              user_id: user.id,
              gameId: gameData.gameCode,
              roundId: gameData.providerRoundId,
              orderId: gameData.providerTransactionId,
            },
          });
          if (existingBet) {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet info already added",
              },
            });
          }
          const bet_details = {
            user_id: user.id,
            matchName: gameData.providerCode,
            gameId: gameData.gameCode,
            roundId: gameData.providerRoundId,
            status: "OPEN",
            orderId: gameData.providerTransactionId,
            betExposure: transactionData.amount,
            exposureTime: Date.now(timestamp * 1000),
          };
          const betData = await BET.create(bet_details);
          let userBalance = userInfo.credit;
          userBalance -= transactionData.amount;
          await userInfo.update({ credit: userBalance });
          tx = {
            user_id: user.id,
            type: "debit",
            amount: transactionData.amount,
            status: "success",
            remark: `wco new bet Id: ${betData.id}`,
            reference: transactionData.id,
            timestamp: new Date(timestamp * 1000),
            game_data: gameData,
          };
          resData = {
            partnerKey: gameProvider.key,
            userId: user.id,
            timestamp: Date.now(),
            balance: userBalance,
            status: {
              code: "SUCCESS",
              message: "",
            },
          };
        } else if (gameData.description == "cancel") {
          const existingBet = await BET.findOne({
            where: {
              user_id: user.id,
              gameId: gameData.gameCode,
              roundId: gameData.providerRoundId,
              orderId: gameData.providerTransactionId,
            },
          });
          if (!existingBet) {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet info not found",
              },
            });
          }
          const betData = existingBet;
          const existingTx = await TX.findOne({
            where: {
              user_id: user.id,
              reference: transactionData.referenceId,
            },
          });
          if (!existingTx) {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "transaction reference id invalid",
              },
            });
          }
          if (betData.status == "CANCELLED") {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet already cancelled",
              },
            });
          }
          if (betData.status != "OPEN") {
            return res.status(422).send({
              partnerKey: null,
              timestamp: null,
              userId: null,
              balance: 0,
              status: {
                code: "VALIDATION_ERROR",
                message: "bet not open",
              },
            });
          }
          await betData.update({ status: "CANCELLED" });
          let userBalance = userInfo.credit;
          userBalance += transactionData.amount;
          await userInfo.update({ credit: userBalance });
          tx = {
            user_id: user.id,
            type: "credit",
            amount: transactionData.amount,
            status: "success",
            remark: `cancelled reference: ${existingTx.reference}`,
            reference: transactionData.id,
            timestamp: new Date(timestamp * 1000),
            game_data: gameData,
          };
          resData = {
            partnerKey: gameProvider.key,
            userId: user.id,
            timestamp: Date.now(),
            balance: userBalance,
            status: {
              code: "SUCCESS",
              message: "",
            },
          };
        } else {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "UNKNOWN_ERROR",
              message: "method not found",
            },
          });
        }
        res.status(200).send(resData);
        if (tx) {
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
      } catch (error) {
        logger.error(error);
        res.status(500).send({
          partnerKey: null,
          timestamp: null,
          userId: null,
          balance: 0,
          status: {
            code: "UNKNOWN_ERROR",
            message: "debit request failed",
          },
        });
      }
    }
  )
  .get(
    "/games", // Called by us from frontend to get game list
    body("providerCode")
      .isString()
      .trim()
      .escape()
      .optional({ checkFalsy: true }), // optional
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).send({
            partnerKey: null,
            timestamp: null,
            userId: null,
            balance: 0,
            status: {
              code: "VALIDATION_ERROR",
              message: errors.array(),
            },
          });
        }

        const { providerCode } = req.body; // optional

        const gameProvider = await GAMEPROVIDER.findOne({
          where: {
            name: "wco",
          },
        });
        // if gameprovider does not exist return error
        if (!gameProvider) {
          return res.status(400).send("game provider not found");
        }

        const reqData = {
          partnerKey: gameProvider.key,
          // providerCode: providerCode || null, // if null is passed then all games will be returned
        };
        const result = await axios.post(
          `https://stageapi.worldcasinoonline.com/api/games`,
          reqData
        );

        // bail if post request failed
        // if (result?.data?.status?.code != "SUCCESS") {
        //   logger.error(
        //     `post https://stageapi.worldcasinoonline.com/api/games failed with ${JSON.stringify(
        //       result?.data?.status
        //     )} `
        //   );
        //   return res
        //     .status(400)
        //     .send(
        //       `request failed with ${JSON.stringify(result?.data?.status)}`
        //     );
        // }
        res.status(200).send(result.data);
      } catch (error) {
        logger.error(error);
        res.status(400).send("request failed");
      }
    }
  );

export default router;
