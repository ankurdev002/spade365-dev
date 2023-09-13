// All withdraw related requests will be handled here
// Add, approve, edit or delete withdrawals

import express from "express";
import { body, query, validationResult } from "express-validator";
import db from "../../db/models/index.js";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
import { txEvent } from "../../utils/transaction.js";
import { sendTelegramMessageAdmin } from "../../utils/telegram.js";

const USER = db.User;
const WITHDRAWACCOUNTS = db.WithdrawAccounts;
const WITHDRAWALS = db.Withdrawals;

const router = express.Router();

router
  // Get All Withdrawal Requests. Users will get their withdrawal requests. Admin will get all withdrawal requests from all users
  .get(
    "/",
    query("limit").isNumeric().optional({ checkFalsy: true }),
    query("skip").isNumeric().optional({ checkFalsy: true }),
    query("user").isNumeric().optional({ checkFalsy: true }), // user id, for use by admins to get deposits of particular user
    query("filter").isIn(["approved", "pending", "rejected"]).optional({ checkFalsy: true }),
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { limit = 20, skip = 0, filter = "" } = req.query;
        const withdraw_userId = parseInt(req.query.user) || 0;
        let where = {};
        let result;
        // if normal user, get all withdrawals for user
        if (!req.user.role || req.user.role !== "admin") {
          const user = req.user;
          const result = await WITHDRAWALS.findAll({
            where: { user_id: user.id },
            order: [["createdAt", "DESC"]],
            limit,
            offset: skip,
            include: ["bank_account"], // required for user transactions page
          });
          return res.status(200).send(result);
        }

        // only admin can access below. TODO: get withdrawal requests for subadmin, i.e where users are added by subadmin/req.user
        if (req.user.role !== "admin") return res.sendStatus(400);

        // if admin, get all withdrawals.
        if (withdraw_userId) where.user_id = withdraw_userId;
        if (filter) where.status = filter;
        result = await WITHDRAWALS.findAll({
          order: [["createdAt", "DESC"]],
          where,
          limit,
          offset: skip,
          include: ["user", "updated_by", "bank_account"],
        });

        res.status(200).send(result);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Get all withdrawal accounts for user
  .get("/accounts", authorizer, async (req, res) => {
    try {
      const user = req.user;
      const result = await WITHDRAWACCOUNTS.findAll({
        where: {
          user_id: user.id,
        },
      });
      return res.status(200).send(result);
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  })
  // Add Withdrawal request.
  // If bank_id is present, it means user is using an existing account. If not, it means user is adding a new account
  // Merged handlers for old and new account
  .post(
    "/",
    body("amount").exists().isFloat(),
    // body("bank_account").isJSON(), // bank_account is json in body that has name, account ifsc
    // body("bank_account.name").isString(),
    // body("bank_account.account").isString(),
    // body("bank_account.ifsc").isString(),
    body("bank_id").isNumeric().optional({ checkFalsy: true }), // if user is adding new account, this will be undefined or 0
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const { amount, bank_account, bank_id } = req.body;
        const user = req.user;
        // if amount is less than 100, return error
        if (amount < 100) {
          return res.status(400).send("Minimum withdrawal amount is 100");
        }
        // if amount is greater than user balance, return error
        if (amount > user.credit) {
          return res
            .status(400)
            .send(
              "Your account does not have enough balance to withdraw. Minimum balance required is 100"
            );
        }

        // if last withrawal is placed less than 5 mins ago, return error
        const lastWithrawalIn5Mins = await WITHDRAWALS.findOne({
          where: {
            user_id: user.id,
            createdAt: {
              [db.Sequelize.Op.gt]: new Date(
                Date.now() - 5 * 60 * 1000
              ).toISOString(),
            },
          },
        });
        if (lastWithrawalIn5Mins) {
          return res.status(400).send("You can only place one withdrawal request every 5 minutes. Please try again later");
        }

        // if user is using an existing account
        if (bank_id) {
          const account = await WITHDRAWACCOUNTS.findByPk(bank_id);
          await account.update({ last_used: Date.now() });
          if (!account) {
            return res.status(400).send("Requested account id not found");
          }
          await WITHDRAWALS.create({
            user_id: user.id,
            account_id: bank_id,
            amount: amount,
          });

        } else {
          // if user is using a new account

          // checking if the account already exists. DISABLED FOR NOW AS THIS CHECK IS GIVING ERRORS TO SOME USERS
          // const accountWithaccount = await WITHDRAWACCOUNTS.findOne({
          //   account: bank_account.account,
          // });
          // if (accountWithaccount) return res.status(400).send("account already registered");

          const withdrawAccount = await WITHDRAWACCOUNTS.create({
            user_id: user.id,
            ifsc: bank_account.ifsc,
            bank_name: bank_account.bank_name || "",
            name: bank_account.name,
            account: bank_account.account,
          });
          await WITHDRAWALS.create({
            user_id: user.id,
            account_id: withdrawAccount.id,
            amount: amount,
          });
        }
        // send telegram message to admin
        sendTelegramMessageAdmin(`Withdraw: New withdrawal request from ${user.phone} for amount ₹ ${amount.toLocaleString()}. Approving this will automatically deduct the amount from user balance.`);
        return res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  )
  .put(
    "/:id",
    body("status").isIn(["approved", "pending", "rejected"]),
    body("ref").isString().optional({ checkFalsy: true }),
    body("remark").isString().optional({ checkFalsy: true }),
    authorizer,
    async (req, res) => {
      try {
        if (req.user.role !== "admin" && req.user.role !== "subadmin") return res.sendStatus(400);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { status, ref = "", remark = "" } = req.body;
        const id = parseInt(req.params.id);
        const withdraw = await WITHDRAWALS.findByPk(id);
        const amount = withdraw.amount;
        if (withdraw.status != "pending")
          return res.status(400).send("Withdrawal request already finalised.");
        if (status == "approved") {
          const user = await USER.findByPk(withdraw.user_id);
          if (!user) return res.status(400).send("withdraw user not found");
          const userCredit = user.credit;

          if (userCredit < amount) return res.status(400).send(`user doesn't have enough balance to complete this request`);

          await user.update({ credit: userCredit - amount });
          const tx = {
            user_id: user.id,
            type: "debit",
            amount,
            status: "success",
            remark: `Withdrawal of ₹ ${amount.toLocaleString()} approved by admin: ${req.user.username}`,
            reference: withdraw.id,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
        await withdraw.update({
          status,
          action_by: req.user.id,
          reference: ref,
          remark,
        });
        return res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  );

export default router;
