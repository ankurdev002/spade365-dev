// WACS : We are casino suite endpoints
// All requests and responses by game provider are in XML format, unless required from our front-end (to be in JSON format)
// The game provider requires 5 endpoints to be implemented
// 1. /api/wacs/getPlayerInfo (to get player info)
// 2. /api/wacs/getBalance (to get player balance)
// 3. /api/wacs/bet (to place bet and lock user exposure)
// 4. /api/wacs/win (to complete bet and update user balance/credit and release exposure locked while placing bet)
// 5. /api/wacs/refund (to refund bet and release exposure locked while placing bet)

// IMPORTANT: WACS deals in INR Paisa (1 INR = 100 Paisa) and not in INR Rupees, so all amounts are multiplied by 100 before being sent to WACS and divided by 100 after receiving from WACS. This is done to avoid floating point errors. For example, if a player places a bet of 100 INR, the amount sent to WACS will be 10000 Paisa and the amount received from WACS will be 10000 Paisa, which is equal to 100 INR. Since we are storing all amounts in Rupees, we need to convert Paisa to Rupees before storing in database and vice versa.

import express from "express";
import { query, validationResult, body } from "express-validator";
import db from "../../db/models/index.js";
import { findUserByToken } from "../../utils/jwt.js";
import { logger } from "../../utils/logger.js";
import xml from "xml";
import { txEvent } from "../../utils/transaction.js";

const GAMEPROVIDER = db.GameProvider;
const BET = db.Bet;
const TX = db.Transaction;
const router = express.Router();
const headerConfig = {
  "Content-Type": "text/xml",
};
// TO-DO: update IP and last access
// TO_DO: validation

router.post(
  "/",
  body("message.method[0].params[0].amount[0].key.value")
    .optional()
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error("invalid value");
      }
      return true;
    }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      let gameProvider;
      const { login, password } = req.body.message.method[0].credentials[0].key;
      const { value } = req.body.message.method[0].params[0].token[0].key;
      const method = req.body.message.method[0].key.name;

      if (!errors.isEmpty()) {
        logger.error(`validation failed: ${JSON.stringify(errors.array())}`);
        const xmlBody = xml({
          message: [
            {
              result: [
                {
                  _attr: { name: method, success: "0" },
                },
                {
                  returnset: [
                    {
                      error: {
                        _attr: {
                          value: "validation failed: invalid amount ",
                        },
                      },
                    },
                    { errorCode: { _attr: { value: "101" } } },
                  ],
                },
              ],
            },
          ],
        });
        return res.header(headerConfig).status(400).send(xmlBody);
      }
      gameProvider = await GAMEPROVIDER.findOne({
        where: {
          name: login,
          key: password,
        },
      });

      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.headers["x-forwarded-for"] ||
        req.ip;

      if (!gameProvider) {
        // create new gameprovider if gameprovider not found.
        // TO-DO: add a ip check to avoid vulnerability
        gameProvider = await GAMEPROVIDER.create({
          name: login,
          key: password,
          ip,
        });
        // logger.error("The authentication credentials for the API are incorrect");
        // const xmlBody = xml({
        //   message: [
        //     {
        //       result: [
        //         {
        //           _attr: { name: method, success: "0" },
        //         },
        //         {
        //           returnset: [
        //             {
        //               error: {
        //                 _attr: {
        //                   value:
        //                     "The authentication credentials for the API are incorrect",
        //                 },
        //               },
        //             },
        //             { errorCode: { _attr: { value: "103" } } },
        //           ],
        //         },
        //       ],
        //     },
        //   ],
        // });
        // return res.header(headerConfig).status(400).send(xmlBody);
      }
      gameProvider.update({
        lastaccess: new Date(),
        ip,
      });

      const user = await findUserByToken(value);
      if (!user) {
        logger.error("The player token is invalid");
        const xmlBody = xml({
          message: [
            {
              result: [
                {
                  _attr: { name: method, success: "0" },
                },
                {
                  returnset: [
                    {
                      error: {
                        _attr: {
                          value: "The player token is invalid",
                        },
                      },
                    },
                    { errorCode: { _attr: { value: "101" } } },
                  ],
                },
              ],
            },
          ],
        });
        return res.header(headerConfig).status(400).send(xmlBody);
      }
      req.user = user;
      if (method == "getPlayerInfo") getPlayerInfo(req, res);
      else if (method == "getBalance") getBalance(req, res);
      else if (method == "bet") bet(req, res);
      else if (method == "win") win(req, res);
      else if (method == "refundTransaction") refundTransaction(req, res);
      else {
        return res.status(400).send("requested method not found");
      }
    } catch (error) {
      logger.error(`post request failed: ${error.message}`);
      if (error.message == "findUserByToken failed") {
        const xmlBody = xml({
          message: [
            {
              result: [
                {
                  _attr: { name: "", success: "0" },
                },
                {
                  returnset: [
                    {
                      error: {
                        _attr: {
                          value: "Token is invalid or old",
                        },
                      },
                    },
                    { errorCode: { _attr: { value: "2000" } } },
                  ],
                },
              ],
            },
          ],
        });
        return res.header(headerConfig).status(400).send(xmlBody);
      }
      res.status(400).send("post request Failed");
    }
  }
);

const getPlayerInfo = async (req, res) => {
  try {
    const body = req.body.message.method[0];
    const { value } = body.params[0].token[0].key;
    const user = req.user;
    const name = user.name || "spadeUser";
    const xmlBody = xml({
      message: [
        {
          result: [
            {
              _attr: { name: "getPlayerInfo", success: "1" },
            },
            {
              returnset: [
                {
                  token: { _attr: { value } },
                },
                { loginName: { _attr: { value: name } } },
                { currency: { _attr: { value: "INR" } } },
                { balance: { _attr: { value: user.credit * 100 } } }, // convert to paisa
              ],
            },
          ],
        },
      ],
    });
    res.header(headerConfig).send(xmlBody);
  } catch (error) {
    logger.error(error);
    res.status(400).send("Request Failed");
  }
};

const getBalance = async (req, res) => {
  try {
    const body = req.body.message.method[0];
    const { value } = body.params[0].token[0].key;

    const user = req.user;
    const xmlBody = xml({
      message: [
        {
          result: [
            {
              _attr: { name: "getBalance", success: "1" },
            },
            {
              returnset: [
                {
                  token: { _attr: { value } },
                },
                { balance: { _attr: { value: user.credit * 100 } } }, // convert to paisa
              ],
            },
          ],
        },
      ],
    });
    res.status(200).header(headerConfig).send(xmlBody);
  } catch (error) {
    logger.error(error);
    res.status(400).send("Request Failed");
  }
};

const bet = async (req, res) => {
  try {
    let tx;
    const body = req.body.message.method[0];
    const { value: tokenValue } = body.params[0].token[0].key;
    const { value: txId } = body.params[0].transactionId[0].key;
    const { value: amount } = body.params[0].amount[0].key; // in paisa
    const { value: gameRef } = body.params[0].gameReference[0].key;
    const { value: roundId } = body.params[0].roundId[0].key;

    const user = req.user;
    const existingBet = await BET.findOne({
      where: {
        user_id: user.id,
        category: "wacs",
        gameId: gameRef,
        roundId,
        // orderId: txId,
      },
    });

    // deducting user balnce upon placing a bet.
    const newBalance = user.credit - parseInt(amount) / 100; // convert to rupees

    if (newBalance < 0) {
      const xmlBody = xml({
        message: [
          {
            result: [
              {
                _attr: { name: "win", success: "0" },
              },
              {
                returnset: [
                  {
                    error: {
                      _attr: { value: "Not enough credits" },
                    },
                  },
                  { errorCode: { _attr: { value: "200" } } },
                ],
              },
            ],
          },
        ],
      });
      return res.header(headerConfig).status(400).send(xmlBody);
    }

    if (existingBet) {
      const currentBetAmount = existingBet.betExposure;
      const newBetAmount = currentBetAmount + amount / 100;
      await existingBet.update({ betExposure: parseInt(newBetAmount) });
      await user.update({ credit: newBalance });
      tx = {
        user_id: user.id,
        type: "debit",
        amount: parseInt(amount) / 100, // convert to rupees
        status: "success",
        remark: `wacs updating bet ${existingBet.id}`,
        reference: `wacs txid: ${txId}`,
        timestamp: new Date(),
        game_data: { provider: "wacs", name: gameRef },
      };
    } else {
      const bet_details = {
        user_id: user.id,
        category: "wacs", // wacs
        gameId: gameRef,
        roundId,
        status: "OPEN",
        orderId: txId,
        betExposure: parseInt(amount / 100), // convert to rupees
        exposureTime: Date.now(),
      };
      const betData = await BET.create(bet_details);
      await user.update({ credit: newBalance });
      tx = {
        user_id: user.id,
        type: "debit",
        amount: parseInt(amount) / 100, // convert to rupees
        status: "success",
        remark: `wacs new bet ${betData.id}`,
        reference: `wacs txid: ${txId}`,
        timestamp: new Date(),
        game_data: { provider: "wacs", name: gameRef },
      };
    }

    const xmlBody = xml({
      message: [
        {
          result: [
            {
              _attr: { name: "bet", success: "1" },
            },
            {
              returnset: [
                {
                  token: { _attr: { value: tokenValue } },
                },
                { balance: { _attr: { value: newBalance * 100 } } }, // convert to paisa
                { transactionId: { _attr: { value: txId } } },
                { alreadyProcessed: { _attr: { value: "false" } } },
              ],
            },
          ],
        },
      ],
    });
    process.nextTick(() => {
      txEvent.emit("new_transacion", tx);
    });
    res.status(200).header(headerConfig).send(xmlBody);
  } catch (error) {
    logger.error(error);
    res.status(400).send("Request Failed");
  }
};

const win = async (req, res) => {
  try {
    const body = req.body.message.method[0];
    const { value: tokenValue } = body.params[0].token[0].key;
    const { value: txId } = body.params[0].transactionId[0].key;
    const { value: amount } = body.params[0].amount[0].key;
    const { value: gameRef } = body.params[0].gameReference[0].key;
    const { value: roundId } = body.params[0].roundId[0].key;

    const user = req.user;

    const existingBet = await BET.findOne({
      where: {
        user_id: user.id,
        category: "wacs",
        gameId: gameRef,
        roundId,
        //orderId: txId,
      },
    });

    if (!existingBet) {
      const xmlBody = xml({
        message: [
          {
            result: [
              {
                _attr: { name: "win", success: "0" },
              },
              {
                returnset: [
                  {
                    error: {
                      _attr: { value: "Transaction not found" },
                    },
                  },
                  { errorCode: { _attr: { value: "202" } } },
                ],
              },
            ],
          },
        ],
      });
      return res.status(400).send(xmlBody);
    }

    // updating user balance upon winning a bet
    const newBalance = user.credit + parseInt(amount) / 100; // convert to rupees
    const tx = {
      user_id: user.id,
      type: "credit",
      amount: parseInt(amount) / 100, // convert to rupees
      status: "success",
      remark: `wacs won bet id: ${existingBet.id}`,
      reference: `wacs txid: ${txId}`,
      timestamp: new Date(),
      game_data: { provider: "wacs", name: gameRef },
    };
    await user.update({ credit: newBalance });
    await existingBet.update({
      status: "WON",
      betExposure: parseInt(existingBet.betExposure - parseInt(amount) / 100), // convert to rupees
    });
    const xmlBody = xml({
      message: [
        {
          result: [
            {
              _attr: { name: "win", success: "1" },
            },
            {
              returnset: [
                {
                  token: { _attr: { value: tokenValue } },
                },
                { balance: { _attr: { value: newBalance * 100 } } }, // convert to paisa
                { transactionId: { _attr: { value: txId } } },
                { alreadyProcessed: { _attr: { value: "false" } } },
              ],
            },
          ],
        },
      ],
    });
    res.status(200).header(headerConfig).send(xmlBody);
    process.nextTick(() => {
      txEvent.emit("new_transacion", tx);
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send("Request Failed");
  }
};

const refundTransaction = async (req, res) => {
  try {
    const body = req.body.message.method[0];
    const { value: tokenValue } = body.params[0].token[0].key;
    const { value: txId } = body.params[0].transactionId[0].key;
    const { value: amount } = body.params[0].amount[0].key;
    const { value: gameRef } = body.params[0].gameReference[0].key;
    const { value: roundId } = body.params[0].roundId[0].key;
    const { value: refundedTransactionId } =
      body.params[0].refundedTransactionId[0].key;

    const user = req.user;

    const existingBet = await BET.findOne({
      where: {
        user_id: user.id,
        category: "wacs",
        gameId: gameRef,
        roundId,
        //orderId: txId,
      },
    });

    if (!existingBet) {
      const xmlBody = xml({
        message: [
          {
            result: [
              {
                _attr: { name: "refundTransaction", success: "0" },
              },
              {
                returnset: [
                  {
                    error: {
                      _attr: { value: "Transaction not found" },
                    },
                  },
                  { errorCode: { _attr: { value: "202" } } },
                ],
              },
            ],
          },
        ],
      });
      return res.status(400).send(xmlBody);
    }
    if (existingBet.status == "CANCELLED") {
      const xmlBody = xml({
        message: [
          {
            result: [
              {
                _attr: { name: "refundTransaction", success: "0" },
              },
              {
                returnset: [
                  {
                    token: { _attr: { value: tokenValue } },
                  },
                  { balance: { _attr: { value: user.credit * 100 } } }, // convert to paisa
                  { transactionId: { _attr: { value: txId } } },
                  { alreadyProcessed: { _attr: { value: "true" } } },
                ],
              },
            ],
          },
        ],
      });
      return res.status(400).send(xmlBody);
    }
    if (existingBet.status == "WON") {
      const xmlBody = xml({
        message: [
          {
            result: [
              {
                _attr: { name: "refundTransaction", success: "0" },
              },
              {
                returnset: [
                  {
                    error: { _attr: { value: "bet already won" } },
                  },
                  { errorCode: { _attr: { value: 200 } } },
                ],
              },
            ],
          },
        ],
      });
      return res.status(400).send(xmlBody);
    }
    const existingTx = await TX.findOne({
      where: {
        reference: refundedTransactionId,
        status: "success",
        user_id: user.id,
      },
    });
    if (!existingTx) {
      const xmlBody = xml({
        message: [
          {
            result: [
              {
                _attr: { name: "refundTransaction", success: "0" },
              },
              {
                returnset: [
                  {
                    error: {
                      _attr: {
                        value: `transaction with id: ${refundedTransactionId} doesn't exist`,
                      },
                    },
                  },
                  { balance: { _attr: { value: user.credit * 100 } } }, // convert to paisa
                ],
              },
            ],
          },
        ],
      });
      return res.status(400).send(xmlBody);
    }
    await existingTx.update({ status: "reverted" });
    await existingBet.update({ status: "CANCELLED" });

    // updaing user balance upon refunding of a bet
    const newBalance = user.credit + parseInt(amount) / 100; // convert to rupees
    const tx = {
      user_id: user.id,
      type: "credit",
      amount: parseInt(amount) / 100, // convert to rupees
      status: "success",
      remark: `cancelled reference: ${existingTx.reference}`,
      reference: `wacs txid: ${txId}`,
      timestamp: new Date(),
      game_data: { provider: "wacs", name: gameRef },
    };
    await user.update({ credit: newBalance });
    const xmlBody = xml({
      message: [
        {
          result: [
            {
              _attr: { name: "refundTransaction", success: "1" },
            },
            {
              returnset: [
                {
                  token: { _attr: { value: tokenValue } },
                },
                { balance: { _attr: { value: newBalance * 100 } } }, // convert to paisa
                { transactionId: { _attr: { value: txId } } },
                { alreadyProcessed: { _attr: { value: "false" } } },
              ],
            },
          ],
        },
      ],
    });
    res.status(200).header(headerConfig).send(xmlBody);
    process.nextTick(() => {
      txEvent.emit("new_transacion", tx);
    });
  } catch (error) {
    logger.error(error);
    res.status(400).send("Request Failed");
  }
};

export default router;
