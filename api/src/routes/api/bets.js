// All Bets related requests will be handled here

import express from "express";
import { body, query, validationResult } from "express-validator";
import db from "../../db/models/index.js";
import { Op } from "sequelize";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
const BET = db.Bet;

const router = express.Router();

router
  // Get All User Bets. Both Admins and Users can access
  .get(
    "/",
    query("limit").isNumeric().optional({ checkFalsy: true }),
    query("skip").isNumeric().optional({ checkFalsy: true }),
    query("user").isNumeric().optional({ checkFalsy: true }), // user id, for use by admins to get bets of particular user
    query("id").isNumeric().optional({ checkFalsy: true }), // bet id, for use by admins to get particular bet
    query("status").optional({ checkFalsy: true }), // OPEN, VOID, WON, LOST
    query("category").optional({ checkFalsy: true }), // sports, sports_fancy, fawk, wacs
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { limit = 20, skip = 0, status = "", category = "" } = req.query;
        const user = req.user;
        const bet_userId = parseInt(req.query.user) || 0;
        const bet_id = parseInt(req.query.id) || 0;
        let result;

        let where = {};

        if (status) where.status = status;
        if (category) where.category = category;

        // if admin, get all bets, else get bets of user
        if (user.role === "admin") {
          if (bet_userId && bet_userId > 0) where.user_id = bet_userId;
          if (!status) where.status = { [Op.notIn]: ["OPEN", "VOID"] };
          result = await BET.findAll({
            order: [["id", "DESC"]],
            // order: [["updatedAt", "DESC"]],
            where,
            limit,
            offset: skip,
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["id", "phone", "credit", "bonus"],
              },
            ],
          });
        } else {
          where.user_id = user.id;
          // where.id = bet_id;
          result = await BET.findAll({
            // order: [["id", "DESC"]],
            order: [["updatedAt", "DESC"]],
            where,
            limit,
            offset: skip,
          });
        }
        return res.status(200).json(result);
      } catch (error) {
        logger.error(error);
        return res.status(400).send("Request Failed");
      }
    }
  )
  .get(
    "/stats",
    query("user").isNumeric().optional({ checkFalsy: true }), // user id, for use by admins to get bets of particular user
    query("status").optional({ checkFalsy: true }), // OPEN, VOID, WON, LOST
    query("category").optional({ checkFalsy: true }), // sports, sports_fancy, fawk, wacs
    authorizer,
    async (req, res) => {
      try {
        const { status = "", category = "" } = req.query;
        const user = req.user;
        const bet_userId = parseInt(req.query.user) || 0;

        let where = {};
        let wagering = 0;

        if (status) where.status = status;
        if (category) where.category = category;

        // if admin, get all bets, else get bets of user
        if (user.role === "admin") {
          if (bet_userId && bet_userId > 0) where.user_id = bet_userId;
          if (!status) where.status = { [Op.notIn]: ["OPEN", "VOID"] };
          // get user.wagering
          const user = await db.User.findOne({ where: { id: bet_userId } });
          wagering = user.wagering || 0;
        } else {
          wagering = user.wagering || 0;
          where.user_id = user.id;
        }

        const totalBets = await BET.count({ where });
        const totalOpenBets = await BET.count({ where: { ...where, status: "OPEN" } });
        const totalVoidBets = await BET.count({ where: { ...where, status: "VOID" } });
        const totalWonBets = await BET.count({ where: { ...where, status: "WON" } });
        const totalLostBets = await BET.count({ where: { ...where, status: "LOST" } });
        const totalStakeAmount = await BET.sum("stake", {
          where: {
            ...where,
            [Op.not]: [{ stake: null }, { stake: 0 }],
          },
        });
        const totalOpenStakeAmount = await BET.sum("stake", {
          where: {
            ...where,
            status: "OPEN",
            [Op.not]: [{ stake: null }, { stake: 0 }],
          },
        });
        const totalWinningAmount = await BET.sum("pnl", {
          where: {
            ...where,
            status: "WON",
            [Op.not]: [{ pnl: null }, { pnl: 0 }],
          },
        });
        const totalLossAmount = await BET.sum("pnl", {
          where: {
            ...where,
            status: "LOST",
            [Op.not]: [{ pnl: null }, { pnl: 0 }],
          },
        });
        const totalPnl = parseInt(totalWinningAmount - Math.abs(totalLossAmount));

        return res.status(200).json({
          wagering,
          totalBets,
          totalOpenBets,
          totalVoidBets,
          totalWonBets,
          totalLostBets,
          totalStakeAmount,
          totalOpenStakeAmount,
          totalWinningAmount,
          totalLossAmount,
          totalPnl,
        });
      } catch (error) {
        logger.error(error);
        return res.status(400).send("Request Failed");
      }
    }
  )
  // Get total winnings/pnl of user
  .get("/winnings", authorizer, async (req, res) => {
    try {
      const user = req.user;
      const result = await BET.sum("pnl", {
        where: {
          user_id: user.id,
          status: "WON",
          [Op.not]: [{ pnl: null }, { pnl: 0 }],
        },
      });
      return res.status(200).json(result ? result : 0);
    } catch (error) {
      logger.error(error);
      return res.status(400).send("Request Failed");
    }
  })
  // Get total losses of user
  .get("/losses", authorizer, async (req, res) => {
    try {
      const user = req.user;
      const result = await BET.sum("pnl", {
        where: {
          user_id: user.id,
          status: "LOST",
          [Op.not]: [{ pnl: null }, { pnl: 0 }],
        },
      });
      return res.status(200).json(result ? result : 0);
    } catch (error) {
      logger.error(error);
      return res.status(400).send("Request Failed");
    }
  })
  // Update bet status. Accessible only by admin. Used in case of manual settlement or auto settlement fails
  .put(
    "/update",
    body("id").isNumeric(),
    body("status").isString(),
    body("amount").isNumeric().optional({ checkFalsy: true }).custom((value) => {
      if (value < 0) throw new Error("Invalid amount");
      return true;
    }),
    authorizer,
    async (req, res) => {
      try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { id, status, amount = 0 } = req.body;

        // if invalid status, bail early
        if (!["OPEN", "VOID", "WON", "LOST"].includes(status)) return res.status(400).send("Invalid status");

        const bet = await BET.findOne({ where: { id } });
        const user = await db.User.findOne({ where: { id: bet.user_id } });
        if (!bet) return res.status(404).send("Bet not found");

        // if (status == "OPEN") {
        //   await bet.update({ status });
        //   return res.status(200).send("Bet status updated");
        // }

        // amount = Math.abs(parseInt(amount) || 0);

        let tx = {
          user_id: bet.user_id,
          type: "",
          amount: 0,
          game_data: {},
          status: "success",
          remark: "",
          reference: bet.id,
        };

        // update bet and user with amount and status
        // if (bet.status !== "OPEN") return res.status(400).send("Bet not OPEN");

        tx.type = status == "WON" ? "credit" : status == "LOST" ? "debit" : status == "VOID" ? "credit" : "";
        tx.amount = 0;
        tx.remark = `Bet manually marked as ${status} with PNL Amount ₹ ${amount} by admin: ${req.user.username} bet_id: ${bet.id}`;


        // update user credit
        if (bet.status == "OPEN") { // if bet open, use req status to determine credit/debit
          if (status == "WON") {
            tx.amount = amount + parseInt(bet.stake);
            await user.increment({ credit: amount + parseInt(bet.stake) });
          }
          if (status == "LOST") {
            tx.amount = parseInt(bet.stake) - amount;
            await user.update({ credit: parseInt(user.credit) + parseInt(bet.stake) - amount });
          }
          if (status == "VOID") {
            tx.amount = parseInt(bet.stake);
            await user.increment({ credit: parseInt(bet.stake) });
          }
        } else if (bet.status == "WON") { // if bet won, use req status to determine credit/debit
          if (status == "WON") return res.status(400).send("Bet already WON");
          if (status == "LOST") {
            tx.amount = parseInt(bet.stake) + Math.abs(bet.pnl) - Math.abs(amount);
            await user.update({ credit: parseInt(user.credit) + parseInt(bet.stake) + Math.abs(bet.pnl) - Math.abs(amount) });
          }
          if (status == "VOID") {
            tx.amount = parseInt(bet.stake) + Math.abs(bet.pnl) - Math.abs(amount);
            await user.update({ credit: parseInt(user.credit) + parseInt(bet.stake) + Math.abs(bet.pnl) - Math.abs(amount) });
          }
        } else if (bet.status == "LOST") { // if bet lost, use req status to determine credit/debit
          if (status == "WON") {
            tx.amount = parseInt(bet.stake) - Math.abs(bet.pnl) + Math.abs(amount);
            await user.update({ credit: parseInt(user.credit) + parseInt(bet.stake) - Math.abs(bet.pnl) + Math.abs(amount) });
          }
          if (status == "LOST") return res.status(400).send("Bet already LOST");
          if (status == "VOID") {
            tx.amount = parseInt(bet.stake) - Math.abs(bet.pnl) + Math.abs(amount);
            await user.update({ credit: parseInt(user.credit) + parseInt(bet.stake) - Math.abs(bet.pnl) + Math.abs(amount) });
          }
        } else if (bet.status == "VOID") { // if bet void, use req status to determine credit/debit
          if (status == "WON") {
            tx.amount = Math.abs(amount);
            await user.increment({ credit: Math.abs(amount) });
          }
          if (status == "LOST") {
            tx.amount = Math.abs(amount);
            await user.decrement({ credit: Math.abs(amount) });
          }
          if (status == "VOID") return res.status(400).send("Bet already VOID");
        }

        const transaction = await db.Transaction.create(tx); // create transaction
        await bet.update({ status, pnl: amount, settlement_id: transaction.id }); // update bet
        return res.status(200).send(true);

        // DISABLED BELOW FOR NOW DUE TO COMPLEXITY. ALLOWWING MANUAL SETTLEMENT BY ADMIN
        // Sports and sports fancy bets
        // if (bet.category.includes("sports")) {
        //   if (status == "WON") {
        //     if (bet.status != "OPEN") return res.status(400).send("Bet not OPEN");
        //     if (bet.status == "WON") return res.status(400).send("Bet already WON");
        //     await user.increment({ credit: parseInt(bet.pnl) + parseInt(bet.stake) });
        //     tx.type = "credit";
        //     tx.amount = parseInt(bet.pnl) + parseInt(bet.stake); // stake already deducted
        //     tx.remark = `bet marked as won by admin: ${req.user.username}. user credited: ₹ ${tx.amount}`;
        //     const transaction = await db.Transaction.create(tx);
        //     await bet.update({ status: "WON", settlement_id: transaction.id });
        //   } else if (status == "LOST") {
        //     if (!bet.category.includes("sports")) return res.status(400).send("LOST status update is limited to sports bet type");
        //     if (bet.status != "OPEN") return res.status(400).send("Bet not OPEN");
        //     if (bet.status == "LOST") return res.status(400).send("Bet already LOST");
        //     if (bet.bet_type == "back") {
        //       tx.type = "debit";
        //       tx.remark = `bet marked as lost by admin: ${req.user.username}. user refunded stake: ₹ ${bet.stake}`;
        //       const transaction = await db.Transaction.create(tx);
        //       // no credit update since stake already deducted
        //       await bet.update({ status: "LOST", settlement_id: transaction.id });
        //     } else {
        //       tx.type = "debit";
        //       tx.amount = parseInt(bet.liability) - parseInt(bet.stake);
        //       tx.remark = `bet marked as lost by admin: ${req.user.username}. user debited: ₹ ${tx.amount}`;
        //       await user.decrement({ credit: tx.amount }); // updating credit
        //       const transaction = await db.Transaction.create(tx);
        //       await bet.update({ status: "LOST", settlement_id: transaction.id });
        //     }
        //   } else {
        //     if (bet.status == "VOID") return res.status(400).send("Bet already cancelled");
        //     // if (bet.status !== "OPEN") return res.status(400).send("Bet cannot be cancelled");

        //     // CREDIT USER BACK
        //     // if status not won, credit back stake
        //     if (bet.stake > 0 && bet.status !== "WON") await user.increment({ credit: bet.stake });
        //     // if status won, deduct pnl from user
        //     if (bet.stake > 0 && bet.status === "WON") await user.decrement({ credit: bet.pnl });

        //     // last, set bet as void
        //     await bet.update({ status: "VOID", pnl: 0 });
        //   }
        // } else if (bet.category.includes("fawk") || bet.category.includes("wacs")) { // fancy and wacs bets
        //   let newUserBalance = parseInt(user.credit) + parseInt(bet.stake) || 0;
        //   if (status == "WON") {
        //     if (bet.status != "OPEN") return res.status(400).send("Bet not OPEN");
        //     if (bet.status == "WON") return res.status(400).send("Bet already WON");
        //     newUserBalance += parseInt(bet.pnl);
        //     tx.type = "credit";
        //     tx.amount = parseInt(bet.pnl); // stake already deducted
        //     tx.remark = `bet marked as won by admin: ${req.user.username}. user credited: ₹ ${tx.amount}`;

        //     // update user
        //     await user.update({ credit: newUserBalance });
        //     // create transaction
        //     const transaction = await db.Transaction.create(tx);
        //     // update bet
        //     await bet.update({ status: "WON", settlement_id: transaction.id });
        //   } else if (status == "LOST") {
        //     if (bet.status != "OPEN") return res.status(400).send("Bet not OPEN");
        //     if (bet.status == "LOST") return res.status(400).send("Bet already LOST");
        //     newUserBalance -= bet.bonus_used >= Math.abs(bet.pnl) ? 0 : Math.abs(bet.pnl) - bet.bonus_used;
        //     tx.type = "debit";
        //     tx.amount = parseInt(bet.pnl);
        //     tx.remark = `bet marked as lost by admin: ${req.user.username}. user debited: ₹ ${tx.amount}`;

        //     // update user 
        //     await user.update({ credit: newUserBalance });
        //     // create transaction
        //     const transaction = await db.Transaction.create(tx);
        //     // update bet
        //     await bet.update({ status: "LOST", settlement_id: transaction.id });
        //   } else {
        //     if (bet.status == "VOID") return res.status(400).send("Bet already cancelled");
        //     newUserBalance += 0;
        //     // CREDIT USER BACK
        //     // if current status lost, credit back pnl
        //     if (bet.stake > 0 && bet.status !== "WON") await user.increment({ credit: bet.stake + Math.abs(bet.pnl) });
        //     // if current status won, deduct pnl from user
        //     if (bet.stake > 0 && bet.status === "WON") await user.decrement({ credit: bet.pnl });

        //     // last, set bet as void
        //     await bet.update({ status: "VOID", pnl: 0 });
        //   }
        // }
        // return res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        return res.status(400).send("Request Failed");
      }
    }
  );

export default router;
