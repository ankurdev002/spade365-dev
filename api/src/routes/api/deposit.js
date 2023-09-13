// All deposit related requests will be handled here
// Add, approve, edit or delete deposits

import express from "express";
import { body, query, validationResult } from "express-validator";
import db from "../../db/models/index.js";
import { Op } from "sequelize";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
import { txEvent } from "../../utils/transaction.js";
import { sendTelegramMessageAdmin } from "../../utils/telegram.js";
const USER = db.User;
const BANKACCOUNT = db.BankAccount;
const DEPOSIT = db.Deposit;
const OFFER = db.Offer;
const BET = db.Bet;

const router = express.Router();

router
  // Get All Deposit Requests. Users can get their own deposit requests, while admin can get all deposit requests
  .get(
    "/",
    query("limit").isNumeric().optional({ checkFalsy: true }),
    query("skip").isNumeric().optional({ checkFalsy: true }),
    query("user").isNumeric().optional({ checkFalsy: true }), // user id, for use by admins to get deposits of particular user
    query("filter").optional({ checkFalsy: true }),
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const user = req.user;
        const { limit = 20, skip = 0, filter = "" } = req.query;
        const deposit_userId = parseInt(req.query.user) || 0;
        let where = {};
        let result;

        // if user with no role, then return only user's deposits
        if (!req.user.role) {
          result = await DEPOSIT.findAll({
            where: {
              user_id: user.id,
            },
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
            include: ["offer", "deposit_account"], // required for user transactions page
          });
          return res.status(200).send(result);
        }

        // if not admin bail
        if (req.user.role !== "admin") return res.sendStatus(400);

        // if admin, return all deposits
        if (deposit_userId) where.user_id = deposit_userId;
        if (filter) where.status = filter;
        result = await DEPOSIT.findAll({
          order: [["createdAt", "DESC"]],
          where,
          limit,
          offset: skip,
          include: ["user", "offer", "deposit_account"],
        });
        return res.status(200).send(result);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Add a new deposit request. Users can access this
  .post(
    "/",
    body("amount").isFloat(),
    body("utr").isLength({ min: 6, max: 12 }).isString(),
    body("bank_id").notEmpty(),
    body("offer_id").optional({ checkFalsy: true }),
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          console.log("error");
          return res.status(400).json({ errors: errors.array() });
        }
        const user = req.user;
        const { amount, utr, bank_id, offer_id = null } = req.body;
        const account = await BANKACCOUNT.findByPk(bank_id);
        if (!account) {
          return res
            .status(400)
            .send("Bank account that you deposited in does not exist.");
        }

        let bonus;
        if (offer_id) {
          const offer = await OFFER.findByPk(offer_id);
          if (!offer) return res.status(400).send("Requested offer not found ");

          // check if offer is valid
          const validity = offer.valid_till;
          const isValid = Date.now() < validity;
          if (!isValid) return res.status(400).send("Offer expired");
          if (!offer.is_active || offer.is_deleted) return res.status(400).send("Invalid offer");

          // check if user has already used this offer
          const isUsed = await DEPOSIT.findOne({
            where: {
              user_id: user.id,
              offer_id: parseInt(offer_id),
              // [Op.not]: [{ id: req.params.id }], // id not equal to current deposit id. Not required here, since we are creating a new deposit and id is not yet generated
              status: { [Op.not]: "rejected" }, // status not equal to rejected
            },
          });

          if (isUsed && !offer.is_reusable) return res.status(400).send("You have already used this offer. Please choose another offer");

          // get count of all user bets and compare with offer.games_cutoff to check if user is eligible for this offer
          const userBets = await BET.count({ where: { user_id: user.id } });
          if (userBets < offer.games_cutoff) return res.status(400).send(`You need to place at least ${offer.games_cutoff} bets to avail this offer`);

          // calculate bonus amount from offer using min_deposit, max_credit, is_percentage. TOOD: check games played
          const { min_deposit, max_credit = 10000, is_percentage, value } = offer;
          if (amount < min_deposit) return res.status(400).send(`You need to deposit at least ${min_deposit} to avail this offer`);
          if (is_percentage) {
            bonus = (amount * value) / 100;
          } else {
            bonus = value;
          }
          // if bonus is more than max_credit, set bonus to max_credit
          bonus = Math.min(bonus, max_credit);
        }
        await DEPOSIT.create({
          user_id: user.id,
          amount,
          utr,
          bank_id,
          offer_id,
          bonus,
          status: "pending",
        });

        // send telegram message to admin
        sendTelegramMessageAdmin(`Deposit: New deposit request from ${user.phone} for ₹ ${amount.toLocaleString()}. Approving will automatically credit ₹ ${amount.toLocaleString()} to user's account.`);

        return res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Approve or reject a deposit with id. Only admin can do this
  .put(
    "/:id",
    body("status").isIn(["approved", "rejected"]),
    body("remark").isString().optional({ checkFalsy: true }),
    authorizer,
    async (req, res) => {
      try {
        if (req.user.role !== "admin") return res.sendStatus(400);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { status, remark = "" } = req.body;
        const id = parseInt(req.params.id);
        const deposit = await DEPOSIT.findOne({
          where: {
            id,
          },
          include: "offer",
        });
        if (!deposit) return res.status(400).send("Requested deposit not found.");
        if (deposit.status != "pending") return res.status(400).send("deposit request already finalised.");

        // get user from deposit
        const user = await USER.findOne({
          where: {
            id: deposit.user_id,
          },
        });
        if (!user) return res.status(400).send("deposit user not found");

        // if req user is subadmin, and user addedBy field is not equal to req user id, return 400
        if (req.user.role === "subadmin" && user.addedBy !== req.user.id) return res.status(400).send("You are not authorized to do this.");

        if (status == "approved") {
          // if status is approved, add amount to user's credit and bonus to user's bonus
          // if deposit.offer.is_bonus, add bonus to user's bonus else add to user's credit
          if (deposit.offer) {
            if (deposit.offer.is_bonus) {
              await user.update({
                credit: user.credit + deposit.amount,
                bonus: user.bonus + deposit.bonus,
                wagering: 0, // reset wagering on deposit approval
              });
            } else {
              await user.update({
                credit: user.credit + deposit.amount + deposit.bonus,
                wagering: 0, // reset wagering on deposit approval
              });
            }
          } else {
            await user.update({
              credit: user.credit + deposit.amount,
              wagering: 0, // reset wagering on deposit approval
            });
          }
          const tx = {
            user_id: user.id,
            type: "credit",
            amount: deposit.amount,
            status: "success",
            remark: `Deposit of ₹ ${deposit.amount.toLocaleString()} approved by admin: ${req.user.username}`,
            reference: deposit.id,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
        await deposit.update({ status, remark });
        return res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  );

export default router;
