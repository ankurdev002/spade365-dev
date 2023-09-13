// All user related routes will be handled here
// User routes include things like: user login, user logout, user registration, user profile, user settings, user password reset etc.

import express from "express";
import { generateOtp, timeDiffinMins, timeDiffinSecs } from "../../utils/index.js";
import { compare, encrypt } from "../../utils/crypto.js";
import { body, query, validationResult } from "express-validator";
import { generateToken, deleteToken, findUserByToken } from "../../utils/jwt.js";
import db from "../../db/models/index.js";
import { Op } from "sequelize";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
import NodeCache from "node-cache";
import config from "../../config/index.js";
import { sendTelegramMessageAdmin } from "../../utils/telegram.js";
import { txEvent } from "../../utils/transaction.js";
import axios from "axios";

const cachedData = new NodeCache({
  stdTTL: 30 * 60, // 30 min
  checkperiod: 30 * 60 * 0.2, // CHECK EVERY 6 min
  maxKeys: -1, // max number of keys in cache, -1 means unlimited
}); //expiry time is 30 MIN

const OTP = db.Otp;
const USER = db.User;
const SITE = db.Site;

const router = express.Router();

router
  .get("/otp", query("phoneNumber").isMobilePhone(), async function (req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { phoneNumber } = req.query;

      // We are caching the otp sent count for a particular phone number to avoid spamming
      const key = `otpSend${phoneNumber}`;
      const otpSentCount = cachedData.get(key);
      if (otpSentCount && otpSentCount >= 5) {
        return res.status(400).send("otp limit reached. try again after after 30 minutes");
      }

      // get user by phone number and check if he is banned
      const user = await USER.findOne({
        where: {
          phone: phoneNumber,
          // check if is_banned or is_deleted is true
          [Op.or]: [{ is_banned: true }, { is_deleted: true }],
        },
      });
      if (user) return res.status(400).send("You're banned from using our services due to suspicious activity. Please contact support for more details.");

      // check if otp exists for this phone number where createdAt is less than 60 seconds
      const lastOTP = await OTP.findOne({
        where: {
          phone_number: phoneNumber,
          is_active: true,
          createdAt: {
            [Op.gt]: new Date(new Date() - 60 * 1000),
          },
        },
        order: [["createdAt", "DESC"]],
      });
      if (lastOTP) {
        const otpTime = lastOTP.createdAt.getTime();
        const secs = timeDiffinSecs(otpTime);
        if (secs < 60) {
          return res.status(400).send({
            timePending: 60 - secs,
            // otp: null,
          });
        }
      }
      const otp = generateOtp();

      // console.log("otp", otp);

      // Send OTP to user via SMS
      const smsResponse = await axios.get(`${config.smsApiUrl}?authorization=${config.smsApiKey}&variables_values=${otp}&route=otp&numbers=${phoneNumber}`);
      if (smsResponse.status !== 200) {
        sendTelegramMessageAdmin("URGENT: Error sending SMS. Please check SMS credits at https://www.fast2sms.com/dashboard/ Add credits asap to get SMS and OTP's working. Once recharged, SMS will start working again automatically.");
        return res.status(400).send("Error sending SMS. Please try again later");
      }

      // Save OTP to DB for future reference
      await OTP.create({
        otp,
        is_active: true,
        phone_number: phoneNumber,
        is_used: false,
      });

      // Increment otp sent count for this phone number in cache to avoid spamming
      if (!otpSentCount) cachedData.set(key, 1);
      else cachedData.set(key, otpSentCount + 1);

      // res.status(200).send({ otp });
      return res.status(200).send(true);
    } catch (error) {
      logger.error(`users.otp.get: ${error}`);
      res.status(400).send("Request Failed");
    }
  })
  .post(
    "/signup",
    body("password").isString().trim().escape().isLength({ min: 8, max: 40 }), // escaping and trimming password for security reasons
    body("phoneNumber").trim().escape().isMobilePhone(), // escaping and trimming phoneNumber for security reasons
    body("confirmPassword")
      .isString()
      .trim()
      .escape()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password confirmation does not match password");
        }
        return true;
      }),
    body("otp").isString().isLength({ min: 4, max: 6 }),
    body("name").optional().isString().trim().escape().isLength({ min: 3, max: 120 }),// optional name
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { phoneNumber, otp, password, name = "" } = req.body;

        const ip =
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.headers["x-forwarded-for"] ||
          req.ip;

        const key = `otpError${ip}`;
        const errorCount = cachedData.get(key);
        if (errorCount && errorCount >= 5) {
          return res.status(400).send("try again after after 30 minutes");
        }
        // check if user already exists with that phone number
        const user = await USER.findOne({
          where: { phone: phoneNumber },
        });
        if (user) return res.status(400).send("User with this phone number already exists");

        // check if otp exists for this phone number where createdAt is less than 5 minutes. otp send time is 60 seconds but we are giving 5 mins to user to enter otp
        const lastOTP = await OTP.findOne({
          where: {
            phone_number: phoneNumber,
            is_active: true,
            createdAt: {
              [Op.gt]: new Date(new Date() - 300 * 1000),
            },
          },
          order: [["createdAt", "DESC"]],
        });
        if (lastOTP?.otp != otp) {
          if (!errorCount) cachedData.set(key, 1);
          else cachedData.set(key, errorCount + 1);
          return res.status(400).send("OTP error");
        }
        const otpTime = lastOTP.createdAt.getTime();
        // const mins = timeDiffinMins(otpTime);
        const secs = timeDiffinSecs(otpTime);
        if (secs > 300) { // 5 mins
          return res.status(400).send(`Otp expired`);
        }

        // Otp verified, now create user

        // first delete all otp's for this phone number as they are no longer needed
        await OTP.destroy({
          where: {
            phone_number: phoneNumber,
          },
        });

        const hash = await encrypt(password);

        // IMP: if this is first user, set role as admin, is_superuser to true and access all to true
        const userCount = await USER.count();
        const role = userCount === 0 ? "admin" : "";
        const is_superuser = userCount === 0 ? true : false;
        const username = userCount === 0 ? "admin" : "";
        const access = {
          dashboard: userCount === 0 ? true : false,
          users: userCount === 0 ? true : false,
          games: userCount === 0 ? true : false,
          settings: userCount === 0 ? true : false,
          team: userCount === 0 ? true : false,
          deposits: userCount === 0 ? true : false,
          withdrawals: userCount === 0 ? true : false,
          bankAccounts: userCount === 0 ? true : false,
          transactions: userCount === 0 ? true : false,
          reports: userCount === 0 ? true : false,
          offers: userCount === 0 ? true : false,
        }

        // from site settings, get where key is "signup_bonus" and get value
        const signupBonus = await SITE.findOne({
          where: {
            key: "signup_bonus",
          },
        });

        const newUser = await USER.create({
          password: hash,
          phone: phoneNumber,
          ip,
          role,
          name,
          is_superuser,
          access,
          username,
          bonus: parseInt(signupBonus?.value || 0),
        });

        // if signupBonus add transaction
        if (signupBonus?.value > 0) {
          const tx = {
            user_id: newUser.id,
            type: "credit",
            amount: parseInt(signupBonus?.value),
            status: "success",
            remark: `User signup bonus of ₹ ${signupBonus?.value} added`,
          };
          process.nextTick(() => {
            txEvent.emit("new_transacion", tx);
          });
        }
        return res.status(200).send(true);
      } catch (error) {
        logger.error(`users.signup.post: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  .post(
    "/login",
    body("password").isString().trim().escape().isLength({ min: 8, max: 40 }), // escaping and trimming password for security reasons
    body("phoneNumber").trim().escape().isMobilePhone(), // escaping and trimming phoneNumber for security reasons
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        // const authToken = req.headers["x-access-token"];
        // Disabled for now as this was causing issues with logout and login again
        // const authToken = req.cookies.token || req.headers["x-access-token"];
        // if (authToken) {
        //   const user = await findUserByToken(authToken);
        //   if (user) return res.status(400).send("Already logged in");
        // }

        const { phoneNumber, password } = req.body;
        const ip =
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.headers["x-forwarded-for"] ||
          req.ip;

        const key = `loginError${ip}`;
        const errorCount = cachedData.get(key);
        if (errorCount && errorCount >= 8) {
          return res.status(400).send("try again after after 30 minutes");
        }
        const user = await USER.scope("withSecret").findOne({
          where: {
            phone: phoneNumber,
            role: { [Op.or]: [null, ""] }, // role is empty or null
            [Op.or]: [{ is_banned: false }, { is_banned: null }, { is_deleted: false }, { is_deleted: null }], // is_banned or is_deleted is false or null
          },
        });
        if (!user || user.is_banned || user.is_deleted) {
          return res.status(400).send("Username or password incorrect"); // for security reasons, make the error message same as incorrect password
        }
        // if (user.token) { // Disabled this as this was causing issues with logging in again
        //   return res.status(400).send("User already logged in");
        // }
        const verification = await compare(password, user.password);
        if (!verification) {
          if (!errorCount) cachedData.set(key, 1);
          else cachedData.set(key, errorCount + 1);
          return res.status(400).send("Username or password incorrect");
        }
        user.update({ is_active: true, last_login: new Date(), ip });
        const token = await generateToken(user);
        res.cookie("token", token, {
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          secure: config.NODE_ENV === "production" ? true : false, // set secure to true in production
        });
        // return json with token and user
        res.status(200).send({
          token: token,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      } catch (error) {
        logger.error(`users.login.post: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  .get("/logout", authorizer, async function (req, res) {
    try {
      const user = req.user;
      deleteToken(user);
      // delete browser cookie
      res.clearCookie("token");
      // Are we using sessions anymore? If not, please remove this
      // req.session.destroy();
      return res.status(200).send(true);
    } catch (error) {
      logger.error(`users.logout.get: ${error}`);
      res.status(400).send("Request Failed");
    }
  })
  .post(
    "/forgotPassword",
    body("password").isString().trim().escape().isLength({ min: 8, max: 40 }), // escaping and trimming password for security reasons
    body("phoneNumber").trim().escape().isMobilePhone(), // escaping and trimming phoneNumber for security reasons
    body("confirmPassword")
      .isString()
      .trim()
      .escape()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error("Password confirmation does not match password");
        }
        return true;
      }),
    body("otp").isNumeric().isLength({ min: 4, max: 6 }),
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { phoneNumber, password, otp } = req.body;

        const ip =
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.headers["x-forwarded-for"] ||
          req.ip;

        const key = `forgetPasswordError${ip}`;
        const errorCount = cachedData.get(key);
        if (errorCount && errorCount >= 6) {
          return res.status(400).send("try again after after 30 minutes");
        }
        const user = await USER.findOne({
          where: {
            phone: phoneNumber,
            role: { [Op.or]: [null, ""] }, // role is empty or null
          },
        });
        if (!user || user.is_banned) {
          return res.status(400).send("User not found");
        }
        const lastOTP = await OTP.findOne({
          where: {
            phone_number: phoneNumber,
            is_active: true,
          },
          order: [["createdAt", "DESC"]],
        });
        if (!lastOTP) {
          return res.status(400).send("Otp not found");
        }

        if (lastOTP.otp !== otp) {
          if (!errorCount) cachedData.set(key, 1);
          else cachedData.set(key, errorCount + 1);
          return res.status(400).send("Otp incorrect");
        }
        const hash = await encrypt(password);
        user.update({ password: hash });
        lastOTP.update({ is_active: false });
        res.status(200).send(true);
      } catch (error) {
        logger.error(`users.forgotPassword.post: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  )
  .get("/isLoggedIn", authorizer, async function (req, res) {
    try {
      const user = req.user;
      if (!user) return res.status(200).send(false);
      return res.status(200).send(true);
    } catch (error) {
      logger.error(`users.isLoggedIn.get: ${error}`);
      res.status(400).send("Request Failed");
    }
  })
  .get("/profile", authorizer, async function (req, res) {
    try {
      const authToken = req.cookies.token;
      if (!authToken) return res.status(200).send(null);
      const user = await findUserByToken(authToken);
      if (!user) return res.status(200).send(null);
      return res.status(200).send(user);
    } catch (error) {
      logger.error(`users.profile.get: ${error}`);
      res.status(400).send("Request Failed");
    }
  })
  // WHY DO WE NEED THIS? THIS IS NOT USED ANYWHERE. Also user should not be able to change their exposure/liaibility
  // .put(
  //   "/exposure",
  //   body("operator").isIn(["INC", "DEC"]),
  //   body("value").isNumeric(),
  //   authorizer,
  //   async (req, res) => {
  //     try {
  //       const { operator, value } = req.body;
  //       const user = req.user;
  //       let expo = 0;
  //       if (operator == "INC") {
  //         expo = user.exposure + value;
  //       } else {
  //         expo = user.exposure - value;
  //       }
  //       await user.update({ exposure: expo });
  //       res.sendStatus(200);
  //     } catch (error) {
  //       logger.error(error);
  //       res.status(400).send("Request Failed");
  //     }
  //   }
  // )

  .put(
    "/profile",
    body("name")
      .isString()
      .trim()
      .escape()
      .isLength({ min: 3, max: 40 })
      .optional({ checkFalsy: true }), // escaping and trimming name for security reasons
    body("email").trim().escape().isEmail().optional({ checkFalsy: true }), // escaping and trimming email for security reasons
    body("oldPassword")
      .isString()
      .trim()
      .escape()
      .isLength({ min: 8, max: 40 })
      .optional({ checkFalsy: true }), // escaping and trimming oldPassword for security reasons
    body("newPassword")
      .isString()
      .trim()
      .escape()
      .isLength({ min: 8, max: 40 })
      .optional({ checkFalsy: true }), // escaping and trimming newPassword for security reasons
    body("timezone")
      .isString()
      .trim()
      .escape()
      .isLength({ min: 3, max: 40 })
      .optional({ checkFalsy: true }), // escaping and trimming timezone for security reasons
    authorizer,
    async function (req, res) {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, oldPassword, newPassword, timezone } = req.body;
        // find user by id and scope "withSecret"
        const user = await USER.scope("withSecret").findOne({
          where: { id: req.user.id },
        });

        if (name) user.update({ name });
        if (email) user.update({ email });
        if (timezone) user.update({ timezone });
        if (oldPassword && newPassword) {
          const verification = await compare(oldPassword, user.password);
          if (!verification) {
            return res.status(400).send("Old password incorrect");
          } else {
            const hash = await encrypt(newPassword);
            user.update({ password: hash });
          }
        }
        res.status(200).send(true);
      } catch (error) {
        logger.error(`users.profile.put: ${error}`);
        res.status(400).send("Request Failed");
      }
    }
  );

export default router;
