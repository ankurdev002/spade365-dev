// All Admin and admin panel requests will be handled here
// Admin/team route include things like: user management, site settings, site pages, site content, site bank account, site header notice, game api's etc.

import express from "express";
import { body, query, validationResult } from "express-validator";
import { compare, encrypt } from "../../utils/crypto.js";
import db from "../../db/models/index.js";
import { Op } from "sequelize";
import authorizer from "../../middleware/authorizer.js";
import { generateToken, findUserByToken } from "../../utils/jwt.js";
import { logger } from "../../utils/logger.js";
import { sendTelegramMessageAdmin } from "../../utils/telegram.js";
import { txEvent } from "../../utils/transaction.js";
import config from "../../config/index.js";
const USER = db.User;
const BET = db.Bet;
const BANKACCOUNT = db.BankAccount;
const DEPOSIT = db.Deposit;
const WITHDRAWALS = db.Withdrawals;
const WITHDRAW_ACCOUNT = db.WithdrawAccount;
const TRANSACTION = db.Transaction;

const router = express.Router();

router
  .get("/profile", authorizer, async function (req, res) {
    try {
      if (req.user.role !== "admin" && req.user.role !== "subadmin") {
        res.clearCookie("token"); // delete cookie token if user is not admin or subadmin
        return res.sendStatus(400); // if req user not admin or subadmin, bail early
      }
      const user = await findUserByToken(req.cookies.token);
      if (!user) {
        return res.status(400).send(false);
      }
      res.status(200).send(user);
    } catch (error) {
      logger.error(`team.profile.get: ${error}`);
      res.status(400).send("Request Failed");
    }
  })
  .post(
    "/login",
    body("password").isString().trim().escape().isLength({ min: 8, max: 32 }), // escaping for security reasons
    body("username").isString().trim().escape().isLength({ min: 5, max: 80 }),
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        // if user is already logged in, bail early
        // Disabled for now as this was causing issues with logout and login again
        // const authToken = req.cookies.token || req.headers["x-access-token"];
        // if (authToken) {
        //   const user = await findUserByToken(authToken);
        //   if (user) return res.status(400).send("Already logged in");
        // }

        const { username, password } = req.body;
        // find user with password and token scope
        const user = await USER.scope("withSecret").findOne({
          where: {
            username,
            role: { [Op.or]: ["admin", "subadmin"] },
          },
        });
        if (!user) {
          return res.status(400).send("Username or password incorrect"); // for security reasons, make the error message same as incorrect password
        }
        // if (user.token) { // Disabled this as this was causing issues with logging in again
        //   return res.status(400).send("User already logged in");
        // }
        const verification = await compare(password, user.password);
        if (!verification) {
          return res.status(400).send("Username or password incorrect");
        }
        user.update({ is_active: true, last_login: new Date() });
        // Are we using sessions anymore? If not, please remove this
        // let session = req.session;
        // session.userId = user.id;
        const token = await generateToken(user);
        res.cookie("token", token, {
          maxAge: 1000 * 60 * 60 * 24 * 3, // 3 days for admin
          httpOnly: true,
          secure: config.NODE_ENV === "production" ? true : false, // set secure to true in production
        });
        // return json with token and user
        res.status(200).send({
          token: token,
          user: {
            username: user.username,
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
            access: user.access,
          },
        });
      } catch (error) {
        logger.error(`team.login.post: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  // dashboard analytics
  .get(
    "/dashboard",
    query("from").isNumeric().isInt({ min: 1, max: 1000 }), // from is number of days to go back from today. 1 is get from last 24 hours, 2 is get from last 48 hours etc.
    authorizer,
    async function (req, res) {
      try {
        if (req.user.role !== "admin") return res.sendStatus(400); // if req user not admin or subadmin, bail early

        const { from } = req.query;

        const users = await USER.count();
        const bets = await BET.count();
        const deposits = await DEPOSIT.count();
        const withdrawals = await WITHDRAWALS.count();
        // new users, where created_at is within "from"
        const newUsers = await USER.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // active users, where lastActive is within "from"
        const activeUsers = await USER.count({
          where: {
            lastActive: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });
        // new bets, where created_at is within "from"
        const newBets = await BET.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });
        // new deposits, where created_at is within "from"
        const newDeposits = await DEPOSIT.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });
        // new withdrawals, where created_at is within "from"
        const newWithdrawals = await WITHDRAWALS.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // get all bets where status is WON within "from"
        const wonBets = await BET.count({
          where: {
            status: "WON",
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });
        // get all bets where status is LOST within "from"
        const lostBets = await BET.count({
          where: {
            status: "LOST",
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // get all bets where status is OPEN within "from"
        const openBets = await BET.count({
          where: {
            status: "OPEN",
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // get all bets where status is VOID within "from"
        const voidBets = await BET.count({
          where: {
            status: "VOID",
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // get all bets where category is "sports" within "from"
        const sportsBets = await BET.count({
          where: {
            category: "sports",
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // get all bets where category is "sports_fancy" within "from"
        const sportsFancyBets = await BET.count({
          where: {
            category: "sports_fancy",
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        // get all bets where category is "wacs" or "fawk" within "from"
        const casinoBets = await BET.count({
          where: {
            [Op.or]: [{ category: "wacs" }, { category: "fawk" }],
            createdAt: {
              [Op.gte]: new Date(new Date() - from * 24 * 60 * 60 * 1000),
            },
          },
        });

        return res.status(200).send({
          users,
          bets,
          deposits,
          withdrawals,
          newUsers,
          activeUsers,
          newBets,
          newDeposits,
          newWithdrawals,
          wonBets,
          lostBets,
          openBets,
          voidBets,
          sportsBets,
          sportsFancyBets,
          casinoBets,
        });
      } catch (err) {
        logger.error(`team.dashboard.get: ${err}`);
        return res.sendStatus(500);
      }
    }
  )
  .get( // get all logs
    "/logs",
    authorizer,
    query("limit").isNumeric().optional({ checkFalsy: true }),
    query("skip").isNumeric().optional({ checkFalsy: true }),
    query("type").isString().trim().escape().optional({ checkFalsy: true }),
    query("search").isString().trim().escape().optional({ checkFalsy: true }),
    async function (req, res) {
      try {
        if (req.user.role !== "admin") return res.sendStatus(400); // if req user not admin or subadmin, bail early
        const { limit = 20, skip = 0, search = "", type = "" } = req.query;
        const logs = await db.Log.findAll({
          order: [["createdAt", "DESC"]],
          where: {
            type: { [Op.like]: `%${type}%` },
            message: { [Op.like]: `%${search}%` },
          },
          limit,
          offset: skip,
        });
        return res.status(200).send(logs);
      } catch (err) {
        logger.error(`team.logs.get: ${err}`);
        return res.sendStatus(500);
      }
    }
  )
  // Admin only route: Get all users.
  .get(
    "/users",
    authorizer,
    query("limit").isNumeric(),
    query("skip").isNumeric(),
    query("search").isString().trim().escape(),
    query("user").isNumeric().optional({ checkFalsy: true }), // user id, for use by admins to get particular user
    query("download").isBoolean().optional({ checkFalsy: true }), // download flag, for use by admins to download all users
    async function (req, res) {
      try {
        if (req.user.role !== "admin" && req.user.role !== "subadmin")
          return res.sendStatus(400); // if req user not admin or subadmin, bail early
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const {
          limit = 0,
          skip,
          search,
          user = 0,
          download = false,
        } = req.query;
        const user_id = parseInt(user) || 0;
        let users;
        let include = !download ? [{
          model: TRANSACTION,
          as: "transactions",
          attributes: [
            "id",
            "amount",
            "type",
            "status",
            "createdAt",
            "remark",
          ],
          order: [["id", "DESC"]],
        }] : []; // if download is true, don't include transactions

        // find all users where role is empty
        // if subadmin, find all users where addedBy is subadmin id, else find all users if admin
        if (req.user.role === "admin") {
          if (user_id > 0) {
            users = await USER.findAll({ where: { id: user_id, role: "", is_deleted: false, }, include }); // findAll instead of findOne, to keep the response consistent
          } else {
            users = await USER.findAll({
              order: [["id", "DESC"]],
              where: {
                role: "",
                // is_deleted: false, // admin get deleted users too
                [Op.or]: [
                  { name: { [Op.iLike]: `%${search}%` } },
                  { email: { [Op.iLike]: `%${search}%` } },
                  { phone: { [Op.iLike]: `%${search}%` } },
                  { id: { [Op.eq]: parseInt(search) || 0 } },
                ],
              },
              limit,
              include,
              offset: skip,
            });
          }
        } else if (req.user.role === "subadmin") {
          users = await USER.findAll({
            order: [["id", "DESC"]],
            where: {
              role: "",
              is_deleted: false,
              addedBy: req.user.id,
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
                { id: { [Op.eq]: parseInt(search) || 0 } },
              ],
            },
            limit,
            include,
            offset: skip,
          });
        }
        if (download) return res.status(200).send(users); // if download flag is true, send users array, below details are not required for download

        // for each user, get their winnings, losses, pnl, deposits, withdrawals
        const result = await Promise.all(
          await users.map(async (user) => {
            user = user.get({ plain: true });
            const winnings = await BET.sum("pnl", {
              where: {
                user_id: user.id,
                status: "WON",
                [Op.not]: [{ pnl: null }, { pnl: 0 }],
              },
            });
            const losses = await BET.sum("pnl", {
              where: {
                user_id: user.id,
                status: "LOST",
                [Op.not]: [{ pnl: null }, { pnl: 0 }],
              },
            });
            user.winnings = winnings || 0;
            user.losses = losses || 0;
            user.pnl = winnings - Math.abs(losses);

            // sum all deposits amount for user, where status is approved
            const deposits = await DEPOSIT.sum("amount", {
              where: {
                user_id: user.id,
                status: "approved",
                amount: { [Op.gt]: 0 },
              },
            });
            user.deposits = deposits || 0;

            // sum all withdrawals amount for user, where status is approved
            const withdrawals = await WITHDRAWALS.sum("amount", {
              where: {
                user_id: user.id,
                status: "approved",
                amount: { [Op.gt]: 0 },
              },
            });
            user.withdrawals = withdrawals || 0;
            return user;
          })
        );

        return res.status(200).send(result);
      } catch (error) {
        logger.error(`team.users.get: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Authenticated route: Add a new user.
  .post(
    "/users",
    authorizer,
    body("name").isString().trim().escape().optional({ checkFalsy: true }),
    body("email").isEmail().normalizeEmail().optional({ checkFalsy: true }),
    body("username")
      .isString()
      .trim()
      .escape()
      .isLength({ min: 5, max: 80 })
      .optional({ checkFalsy: true }), // username optional for normal users
    body("phoneNumber").isMobilePhone(), // Not optional as we are adding a normal user here
    body("newPassword").isLength({ min: 8, max: 32 }),
    body("credit").isNumeric().optional({ checkFalsy: true }),
    body("bonus").isNumeric().optional({ checkFalsy: true }),
    body("exposure").isNumeric().optional({ checkFalsy: true }),
    body("exposureLimit").isNumeric().optional({ checkFalsy: true }),
    body("is_active").toBoolean().optional({ checkFalsy: true }),
    body("is_verified").toBoolean().optional({ checkFalsy: true }),
    body("is_deleted").toBoolean().optional({ checkFalsy: true }),
    body("is_banned").toBoolean().optional({ checkFalsy: true }),
    async function (req, res) {
      try {
        if (req.user.role !== "admin" && req.user.role !== "subadmin")
          return res.sendStatus(400); // if req user not admin or subadmin, bail early
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const {
          username,
          name,
          email,
          phoneNumber,
          newPassword,
          // is_active,
          is_verified,
          is_banned = false,
          is_deleted = false,
          credit = 0,
          bonus = 0,
          exposure,
          exposureLimit,
        } = req.body;

        // check if any user with that phone exists
        let findUserWithPhone = await USER.findOne({
          where: { phone: phoneNumber },
        });
        if (findUserWithPhone) {
          return res.status(400).send("User with that phone already exists");
        }

        const user = await USER.create({
          username,
          name,
          email,
          phone: phoneNumber,
          password: await encrypt(newPassword),
          credit: credit,
          role: "",
          // is_active: is_active,
          is_verified: is_verified,
          is_banned,
          is_deleted,
          addedBy: req.user.id,
          bonus: bonus,
          exposure: exposure,
          exposureLimit: exposureLimit,
        });

        if (credit > 0) {
          // create deposit with user_id=user.id, amount=credit, utr=ADDEDBYADMIN, status=approved, remark=credited by admin
          const deposit = await DEPOSIT.create({
            user_id: user.id,
            amount: Math.abs(credit),
            status: "approved",
            remark: `Credited by admin`,
          });
          const tx = {
            user_id: user.id,
            type: "credit",
            amount: Math.abs(credit),
            status: "success",
            remark: `User added and credited ₹ ${credit} by admin: ${req.user.username}`,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }

        sendTelegramMessageAdmin(`User ${user.phone} added${credit > 0 ? ' and credited ₹ ' + credit : ''} by admin: ${req.user.username}`);

        return res.status(200).send(true);
      } catch (error) {
        logger.error(`team.users.post: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Update a user. Only admin can update all users, subadmin can update only users created by him
  .put(
    "/users/:id",
    authorizer,
    body("name").isString().trim().escape().optional({ checkFalsy: true }),
    body("email").isEmail().normalizeEmail().optional({ checkFalsy: true }),
    body("username")
      .isString()
      .trim()
      .escape()
      .isLength({ min: 5, max: 80 })
      .optional({ checkFalsy: true }), // username optional for normal users
    body("phoneNumber").isMobilePhone(),
    body("newPassword")
      .isLength({ min: 8, max: 32 })
      .optional({ checkFalsy: true }),
    body("credit").isNumeric().optional({ checkFalsy: true }),
    body("bonus").isNumeric().optional({ checkFalsy: true }),
    body("exposure").isNumeric().optional({ checkFalsy: true }),
    body("exposureLimit").isNumeric().optional({ checkFalsy: true }),
    body("is_verified").toBoolean(),
    body("is_deleted").toBoolean().optional({ checkFalsy: true }),
    body("is_banned").toBoolean(),
    // body("role").isString().trim().escape(), // dont take role for user from request
    async function (req, res) {
      try {
        if (req.user.role !== "admin" && req.user.role !== "subadmin")
          return res.sendStatus(400); // if req user not admin or subadmin, bail early
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const {
          name,
          email,
          phoneNumber,
          newPassword,
          is_deleted = false,
          is_banned,
          is_verified,
          credit,
          bonus,
          exposure,
          exposureLimit,
        } = req.body;
        const id = parseInt(req.params.id);
        let user;
        if (req.user.role === "admin") {
          user = await USER.findOne({
            where: {
              id,
              // and role is empty or null
              [Op.or]: [{ role: null }, { role: "" }],
            },
          });
        } else if (req.user.role === "subadmin") {
          user = await USER.findOne({
            where: {
              id,
              addedBy: req.user.id,
              // and role is empty or null
              [Op.or]: [{ role: null }, { role: "" }],
            },
          });
        }

        // if no user found, bail
        if (!user) {
          res.status(400);
          return res.send("user not found");
        }

        // check if any user with that phone exists except the user being updated
        let findUserWithPhone = await USER.findOne({
          where: { phone: phoneNumber, id: { [Op.ne]: id } },
        });
        if (findUserWithPhone) {
          return res
            .status(400)
            .send("Phone number associated with another user");
        }

        user.name = name;
        user.email = email;
        user.phone = phoneNumber;
        if (newPassword) {
          user.password = await encrypt(newPassword);
        }
        user.role = "";
        user.is_banned = is_banned;
        user.is_deleted = is_deleted;
        user.is_verified = is_verified;
        user.bonus = bonus;
        user.exposure = exposure;
        user.exposureLimit = exposureLimit;
        // user.role = role; // dont update role here

        if (user.credit !== credit) {
          // if difference is positive create deposit, if negative create withdrawal
          if (credit > (user.credit || 0)) {
            const deposit = await DEPOSIT.create({
              user_id: user.id,
              amount: Math.abs(credit - (user.credit || 0)),
              status: "approved",
              // remark: `Credited by admin: ${req.user.username}`,
              remark: `Credited by admin`,
            });
            user.wagering = 0; // update user.wagering to 0 on deposit
          } else if (credit < (user.credit || 0)) {
            const withdrawal = await WITHDRAWALS.create({
              user_id: user.id,
              amount: Math.abs((user.credit || 0) - credit),
              status: "approved",
              remark: `Debited by admin`,
            });
          }
          // if user credit changed by admin, add a transaction
          const tx = {
            user_id: user.id,
            type: credit > (user.credit || 0) ? "credit" : "debit",
            amount: Math.abs((user.credit || 0) - credit),
            status: "success",
            remark: `${credit > (user.credit || 0) ? "Added" : "Reduced"} ₹ ${Math.abs((user.credit || 0) - credit)} by ${req.user.username}`,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
          user.credit = credit;
          sendTelegramMessageAdmin(`User ${user.phone} credit changed to ₹ ${credit} by admin: ${req.user.username}`);
        }

        await user.save();
        return res.status(200).send(true);
      } catch (error) {
        logger.error(`team.users.put: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Authenticated route: Delete a user.
  .delete("/users/:id", authorizer, async function (req, res) {
    try {
      if (req.user.role !== "admin" && req.user.role !== "subadmin")
        return res.sendStatus(400); // if req user not admin or subadmin, bail early
      const id = parseInt(req.params.id);
      let user;
      if (req.user.role === "admin") {
        // find user with scope withAllAssociations
        user = await USER.scope("withAllAssociations").findOne({
          where: {
            id,
            // and role is empty or null
            [Op.or]: [{ role: null }, { role: "" }],
          },
        });
      } else if (req.user.role === "subadmin") {
        user = await USER.scope("withAllAssociations").findOne({
          where: {
            id,
            addedBy: req.user.id,
            is_superuser: false,
            // and role is empty or null
            [Op.or]: [{ role: null }, { role: "" }],
          },
        });
      }
      if (!user) {
        res.status(400);
        return res.send("User not found");
      }

      // if user has bets, bankAccounts, deposits, WithdrawAccounts, Withdrawals, or transactions, delete them first
      // if (user?.bets?.length > 0)
      //   await BET.destroy({ where: { user_id: user.id } });
      // if (user?.bankAccounts?.length > 0)
      //   await BANKACCOUNT.destroy({ where: { user_id: user.id } });
      // if (user?.deposits?.length > 0)
      //   await DEPOSIT.destroy({ where: { user_id: user.id } });
      // if (user?.withdrawAccounts?.length > 0)
      //   await WITHDRAW_ACCOUNT.destroy({ where: { user_id: user.id } });
      // if (user?.updated_by?.length > 0)
      //   await WITHDRAWALS.destroy({ where: { user_id: user.id } });
      // if (user?.transactions?.length > 0)
      //   await TRANSACTION.destroy({ where: { user_id: user.id } });
      // await user.destroy();

      // set user.is_deleted to true
      user.is_deleted = true;
      await user.save();

      return res.status(200).send(true);
    } catch (error) {
      logger.error(`team.users.delete: ${error}`);
      res.status(400).send("Request Failed");
    }
  })
  // Authenticated route: Get all team/admin members where role is admin or subadmin.
  .get(
    "/",
    authorizer,
    query("limit").isNumeric(),
    query("skip").isNumeric(),
    query("search").isString().trim().escape(),
    async function (req, res) {
      try {
        // if req user not admin or subadmin, bail early
        if (req.user.role !== "admin" && req.user.role !== "subadmin")
          return res.sendStatus(400);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { limit, skip, search } = req.query;
        let users;
        // if admin, get all users, if subadmin get only users added by request user
        if (req.user.role === "admin") {
          users = await USER.findAll({
            order: [["id", "DESC"]],
            where: {
              role: { [Op.or]: ["admin", "subadmin"] },
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
              ],
            },
            limit,
            offset: skip,
          });
        } else if (req.user.role === "subadmin") {
          users = await USER.findAll({
            order: [["id", "DESC"]],
            where: {
              role: { [Op.or]: ["admin", "subadmin"] },
              // if subadmin get only users added by request user
              addedBy: req.user.id,
              [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } },
              ],
            },
            limit,
            offset: skip,
          });
        }

        return res.status(200).send({ users });
      } catch (error) {
        logger.error(`team.get: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )

  // Authenticated route: Create a new admin/team member. Only admin can add a new team member and only admin can access this route
  .post(
    "/",
    authorizer,
    body("name").isString().trim().escape().optional({ checkFalsy: true }),
    body("email").isEmail().normalizeEmail().optional({ checkFalsy: true }),
    body("phoneNumber").isMobilePhone().optional({ checkFalsy: true }), // optional phone for team members
    body("username").isString().trim().escape().isLength({ min: 5, max: 80 }),
    body("newPassword").isLength({ min: 8, max: 32 }).notEmpty(),
    body("role").isString().trim().escape(),
    body("is_verified").toBoolean(),
    body("is_banned").toBoolean(),
    // body("access").isJSON(),
    async function (req, res) {
      try {
        // if req user not admin or subadmin, bail early
        if (req.user.role !== "admin" && req.user.role !== "subadmin")
          return res.sendStatus(400);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        let {
          username,
          name,
          email,
          phoneNumber,
          newPassword,
          role,
          is_verified,
          is_banned,
          access,
          // is_superuser, // update this directly from db
        } = req.body;
        // if req user is not admin, but trying to add admin, change role to subadmin
        if (req.user.role !== "admin" && role === "admin") {
          role = "subadmin";
        }

        // check if username already exists
        const userExists = await USER.findOne({
          where: { username: username },
        });
        if (userExists) {
          return res.status(400).send("username already exists");
        }

        const user = await USER.create({
          username,
          name,
          email,
          phone: phoneNumber,
          password: await encrypt(newPassword),
          role,
          is_verified,
          is_banned,
          access,
          addedBy: req.user.id,
        });
        sendTelegramMessageAdmin(
          `A new admin with username: ${username} created. You can manage the admin from admin panel`
        );
        return res.status(200).send(true);
      } catch (error) {
        logger.error(`team.post: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )

  // Authenticated route: Update a team member. Only admin can update a team member and only admin can access this route. Superuser can't be updated by admin
  .put(
    "/:id",
    authorizer,
    body("name").isString().trim().escape().optional({ checkFalsy: true }),
    body("username").isString().trim().escape().isLength({ min: 5, max: 80 }),
    body("email").isEmail().normalizeEmail().optional({ checkFalsy: true }),
    body("phoneNumber").isMobilePhone().optional({ checkFalsy: true }), // optional phone for team members
    body("newPassword")
      .isLength({ min: 8, max: 32 })
      .optional({ checkFalsy: true }),
    // body("credit").isNumeric(), // team doesnt need credit
    // body("is_active").toBoolean(),
    body("is_verified").toBoolean(),
    body("is_banned").toBoolean(),
    // body("is_superuser").toBoolean(),  // update this directly from db
    body("role").isString().trim().escape(),
    async function (req, res) {
      try {
        if (req.user.role !== "admin" && req.user.role !== "subadmin")
          return res.sendStatus(400); // if req user not admin or subadmin, bail early
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        let {
          username,
          name,
          email,
          phoneNumber,
          newPassword,
          // credit,
          // is_active,
          is_verified,
          is_banned,
          // is_superuser, // update this directly from db
          access,
          role,
        } = req.body;
        const id = parseInt(req.params.id);
        let user;
        // only admin can update all team members, suadmin can only update team members added by him
        if (req.user.role === "subadmin") {
          user = await USER.findOne({
            where: { id, addedBy: req.user.id, is_superuser: false },
          });
        } else if (req.user.role === "admin") {
          user = await USER.findOne({
            where: { id },
          });
        }
        if (!user) {
          return res.status(400).send("user not found");
        }

        if (!req.user.is_superuser && user.is_superuser) {
          // some who is not usperuser is trying to update superuser, bail early
          return res
            .status(400)
            .send(
              "You can't update superuser, but big balls on you to try this!"
            );
        }

        // check if username already exists but doesn't belong to this user
        const userExists = await USER.findOne({
          where: { username, id: { [Op.ne]: id } },
        });
        if (userExists) {
          return res
            .status(400)
            .send("Username already belongs to another user");
        }

        user.username = username;
        user.name = name;
        user.email = email;
        user.phone = phoneNumber;
        user.access = access;
        if (newPassword) {
          user.password = await encrypt(newPassword);
        }
        user.role = "";
        user.is_banned = is_banned;
        user.is_verified = is_verified;
        user.role = role;
        // if req user is not admin, but trying to add admin role, change role to subadmin
        if (req.user.role !== "admin" && role === "admin") {
          user.role = "subadmin";
        }
        await user.save();
        return res.status(200).send(true);
      } catch (error) {
        logger.error(`team.put: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )

  // Authenticated route: Delete a team member.
  .delete("/:id", authorizer, async function (req, res) {
    try {
      if (req.user.role !== "admin" && req.user.role !== "subadmin")
        return res.sendStatus(400); // if req user not admin or subadmin, bail early
      // find user by id, and if is_superuser or role == admin is true, then don't delete
      const id = parseInt(req.params.id);
      let user;
      // only admin can delete all team members, suadmin can only delete team members added by him
      if (req.user.role === "subadmin") {
        user = await USER.findOne({
          where: { id, addedBy: req.user.id, is_superuser: false },
        });
      } else if (req.user.role === "admin") {
        user = await USER.findOne({
          where: { id },
        });
      }
      if (!user) {
        return res.status(400).send("User not found");
      }
      if (req.user.id === user.id) {
        // if req user is trying to delete himself, bail early
        return res
          .status(400)
          .send(
            "You can't delete yourself, ask another admin or superuser to delete your account"
          );
      }
      if (user.is_superuser) {
        // admins can be deleted by admin, but superusers can't be deleted by anyone
        return res
          .status(400)
          .send(
            "Superusers can't be deleted by anyone, but big balls on you to try this"
          );
      }
      // else delete
      await user.destroy();
      // }
      return res.status(200).send(true);
    } catch (error) {
      logger.error(`team.delete: ${error}`);
      res.status(400).send("Request Failed");
    }
  });

export default router;
