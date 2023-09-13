// All site settings will be handled here
// Site settings include things like: site name, site colors, site logo, bank account, header notice, pages, page content etc.

import express from "express";
import { body, validationResult } from "express-validator";
import db from "../../db/models/index.js";
import { Op } from "sequelize";
import { logger } from "../../utils/logger.js";
import authorizer from "../../middleware/authorizer.js";
import fs from 'fs';
const SITE = db.Site;

const router = express.Router();

router
  // Public route: Get all site settings
  .get("/", async function (req, res) {
    try {
      // get all site settings where 'key' is colors, notices, banners
      const site = await SITE.findAll({
        order: [["key", "ASC"]],
        where: {
          key: {
            [Op.in]: ["colors", "notices", "banners", "signup_bonus", "whatsapp_number"],
          },
        },
      });
      // send data in the format { colors: {}, notices: {}, banners: [] }
      res.status(200).json({
        banners: JSON.parse(site[0].value),
        colors: JSON.parse(site[1].value),
        notices: JSON.parse(site[2].value),
        signup_bonus: JSON.parse(site[3].value),
        whatsapp_number: JSON.parse(site[4].value),
      });
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  })
  // Authenticated route. only admin can access this route and update site settings
  .post(
    "/",
    // Validate the request body colors.primary, colors.secondary, colors.accent, colors.neutral, notices.loggedIn, notices.loggedOut, for each array in banners, banners.image, banners.redirect, banners.page
    body("colors.primary").isString().trim().optional({ checkFalsy: true }),
    body("colors.secondary").isString().trim().optional({ checkFalsy: true }),
    body("colors.accent").isString().trim().optional({ checkFalsy: true }),
    body("colors.neutral").isString().trim().optional({ checkFalsy: true }),
    body("notices.loggedIn.*.text")
      .isString()
      .trim()
      .escape()
      .optional({ checkFalsy: true }),
    body("notices.loggedOut.*.text")
      .isString()
      .trim()
      .escape()
      .optional({ checkFalsy: true }),
    body("banners.*.image").isString().optional({ checkFalsy: true }), // base64 encoded string of an image
    body("banners.*.redirect").isString().trim().optional({ checkFalsy: true }), // url banner will redirect to on click
    body("banners.*.page").isString().trim().optional({ checkFalsy: true }),
    authorizer,
    async function (req, res) {
      try {
        // only admin can access below
        if (req.user.role !== "admin") return res.sendStatus(400);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        // for each key in request body, update the site settings
        for (const [key, value] of Object.entries(req.body)) {
          // If key exists in database, update it with the new value
          const site = await SITE.findOne({
            where: {
              key: key,
            },
          });
          if (site) {
            site.value = JSON.stringify(value);
            site.save();
          }
          // else create it
          else {
            SITE.create({
              key: key,
              value: JSON.stringify(value),
            });
          }
        }
        res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  )
  // Download database backup lastest file by mtime in /var/www/db_backups
  .get("/db-backup", authorizer, async function (req, res) {
    try {
      if (req.user.role !== "admin") return res.sendStatus(400); // if req user not admin, bail early
      const files = await fs.promises.readdir("/var/www/db_backups");
      const filesWithStats = await Promise.all(
        files.map(async (file) => {
          const stats = await fs.promises.stat(`/var/www/db_backups/${file}`);
          return {
            name: file,
            mtime: stats.mtime,
          };
        })
      );
      const latestFile = filesWithStats.sort((a, b) => b.mtime - a.mtime)[0];
      return res.download(`/var/www/db_backups/${latestFile.name}`);
    } catch (err) {
      console.log(err);
      return res.sendStatus(500);
    }
  })
  .post(
    "/sms",
    body("message").isString().trim(),
    body("numbers").optional().isArray(),
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        // only admin can access below
        if (req.user.role !== "admin") return res.sendStatus(400);

        let allNumbers = [];
        const { message, numbers } = req.body;
        if (!numbers || numbers?.length == 0) {
          const users = await db.User.findAll({
            where: {
              role: { [Op.or]: [null, ""] },
            },
          });
          for (let i = 0; i < users.length; i++) {
            const num = users[i].phone;
            if (num) allNumbers.push(num);
          }
        } else allNumbers = numbers;
        for (let i = 0; i < allNumbers.length; i++) {
          // call sms api here
          console.log(message, allNumbers[i]);
        }
        res.status(200).send(true);
      } catch (error) {
        logger.error(error);
        res.status(400).send("Request Failed");
      }
    }
  );

export default router;
