// All offer related requests will be handled here
// Add, approve, edit or delete offers

import express from "express";
import { query, validationResult, body } from "express-validator";
import { Op } from "sequelize";
import db from "../../db/models/index.js";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";

const OFFER = db.Offer;

const router = express.Router();

router
  // All logged in users can get all offers
  .get(
    "/",
    query("limit").isNumeric().optional({ checkFalsy: true }),
    query("skip").isNumeric().optional({ checkFalsy: true }),
    query("filter").optional({ checkFalsy: true }), // using filter=deposit on user deposit page on frontend
    query("isActive").optional({ checkFalsy: true }).isBoolean(),
    query("isValid").optional({ checkFalsy: true }).isBoolean(),
    query("search").isString().trim().escape().optional({ checkFalsy: true }),
    authorizer,
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        const { limit = 20, skip = 0, filter, isActive, isValid, search = "" } = req.query;

        // checking if type exists
        const type = filter ? filter : { [Op.ne]: null };

        // checking if isActive exists
        const active =
          typeof isActive == "undefined" ? { [Op.ne]: null } : isActive;

        // checking validity of the offer
        const valid =
          typeof isValid == "undefined"
            ? { [Op.ne]: null }
            : isValid == "true"
              ? { [Op.gte]: Date.now() }
              : { [Op.lt]: Date.now() };

        let result = [];
        // checking if search exists
        if (search) {
          result = await OFFER.findAll({
            where: {
              [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }, { code: { [Op.iLike]: `%${search}%` } }],
              type: type,
              is_active: active,
              valid_till: valid,
            },
            order: [["id", "DESC"]],
            limit,
            offset: skip,
          });
        } else {
          result = await OFFER.findAll({
            where: {
              type: type,
              is_active: active,
              valid_till: valid,
            },
            order: [["id", "DESC"]],
            limit,
            offset: skip,
          });
        }
        return res.status(200).send(result);
      } catch (error) {
        logger.error(error);
        res
          .status(400)
          .send("Request Failed");
      }
    }
  )
  // All logged in users can access by code
  .get("/:code", authorizer, async (req, res) => {
    try {
      const code = req.params.code;
      const offer = await OFFER.findOne({
        where: {
          code: code.toUpperCase(),
        },
      });
      if (!offer) return res.status(400).send("no offer found");
      return res.status(200).send(offer);
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  })
  .post(  // name, type, value and code are required
    "/",
    body("name").exists().isString(),
    body("description").optional({ checkFalsy: true }).exists().isString(),
    body("type").exists().isString(),
    body("value").exists().isNumeric(),
    body("code").exists(),
    body("valid_till").optional({ checkFalsy: true }).isString(), // some issues with isDate()
    body("is_percentage").optional({ checkFalsy: true }).isBoolean(),
    body("is_reusable").optional({ checkFalsy: true }).isBoolean(),
    body("is_bonus").optional({ checkFalsy: true }).isBoolean(),
    body("min_deposit").optional({ checkFalsy: true }).isFloat(),
    body("max_credit").optional({ checkFalsy: true }).isFloat(),
    body("games_cutoff").optional({ checkFalsy: true }).isInt(),
    authorizer,
    async (req, res) => {
      try {
        // only admin can access below
        if (req.user.role !== "admin")
          return res.sendStatus(400);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const {
          name,
          description,
          type,
          value,
          code,
          valid_till,
          is_percentage = false,
          is_reusable = false,
          is_bonus = false,
          min_deposit = 0,
          max_credit = 0,
          games_cutoff = 0,
        } = req.body;

        // if code already associated with an offer, bail
        const codeCheck = await OFFER.findOne({
          where: {
            code: code.toUpperCase(),
          },
        });
        if (codeCheck) return res.status(400).send("Code already used. Please try another code");

        const offer = await OFFER.create({
          name: name,
          description,
          type,
          value,
          code: code.toUpperCase(),
          valid_till,
          is_reusable,
          is_bonus,
          is_percentage,
          min_deposit,
          max_credit,
          games_cutoff,
        });

        return res.status(200).send(offer);
      } catch (error) {
        logger.error(error);
        res
          .status(400)
          .send("Request Failed");
      }
    }
  )
  .put("/deactivate/:id", authorizer, async (req, res) => {
    try {
      if (req.user.role !== "admin")
        return res.sendStatus(400);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const id = parseInt(req.params.id);

      const offer = await OFFER.findByPk(id);
      // bail if offer not found
      if (!offer) return res.status(400).send("requested offer id not found");

      if (!offer.is_active) return res.status(400).send("already deactivated");
      const result = await offer.update({ is_active: false });
      return res.status(200).send(result);
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  })
  .put("/activate/:id", authorizer, async (req, res) => {
    try {
      if (req.user.role !== "admin")
        return res.sendStatus(400);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const id = parseInt(req.params.id);

      const offer = await OFFER.findByPk(id);
      // bail if offer not found
      if (!offer) return res.status(400).send("requested offer id not found");
      if (offer.is_active) return res.status(400).send("already activated");
      const result = await offer.update({ is_active: true });
      return res.status(200).send(result);
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  })
  // restore soft deleted offer.
  .put("/restore/:id", authorizer, async function (req, res) {
    try {
      if (req.user.role !== "admin") return res.sendStatus(400); // only admin can restore offer, if not admin bail
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const id = parseInt(req.params.id); // convert to integer
      // set is_deleted to false
      const offer = await OFFER.update(
        {
          is_deleted: false,
          is_active: true,
        },
        {
          where: {
            id: id,
          },
        }
      );
      return res.status(200).send(true);
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  })
  .put( // name, type, value and code are required
    "/:id",
    body("name").isString(),
    body("description").optional({ checkFalsy: true }).isString(),
    body("type").isString(),
    body("value").isNumeric(),
    body("code").isString(),
    body("valid_till").optional({ checkFalsy: true }).isString(), // some issues with isDate()
    body("is_percentage").optional({ checkFalsy: true }).isBoolean(),
    body("is_reusable").optional({ checkFalsy: true }).isBoolean(),
    body("is_bonus").optional({ checkFalsy: true }).isBoolean(),
    body("min_deposit").optional({ checkFalsy: true }).isFloat(),
    body("max_credit").optional({ checkFalsy: true }).isFloat(),
    body("games_cutoff").optional({ checkFalsy: true }).isInt(),
    authorizer,
    async (req, res) => {
      try {
        // only admin can access below
        if (req.user.role !== "admin")
          return res.sendStatus(400);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        const {
          name,
          description,
          type,
          value,
          code,
          valid_till,
          is_reusable,
          is_bonus,
          is_percentage,
          min_deposit,
          max_credit,
          games_cutoff,
        } = req.body;
        const id = parseInt(req.params.id);
        const offer = await OFFER.findByPk(id);
        // bail if offer not found
        if (!offer) return res.status(400).send("requested offer id not found");

        // if code already associated with another offer where id not this, bail
        const offerWithCode = await OFFER.findOne({
          where: {
            code: code.toUpperCase(),
            id: {
              [Op.ne]: id,
            },
          },
        });
        if (offerWithCode) return res.status(400).send("Code already in use. Please try another code.");

        // else continue
        let data = {};
        // creating new data object
        if (name && offer.name != name) data.name = name;
        if (description && offer.description != description) data.description = description;
        if (type && offer.type != type) data.type = type;
        if (value && offer.value != value) data.value = value;
        if (code && offer.code != code.toUpperCase()) data.code = code.toUpperCase();
        if (valid_till && offer.valid_till.getTime() != new Date(valid_till).getTime()) data.valid_till = valid_till;
        if (is_percentage && offer.is_percentage != is_percentage) data.is_percentage = is_percentage;
        if (min_deposit && offer.min_deposit != min_deposit) data.min_deposit = min_deposit;
        if (max_credit && offer.max_credit != max_credit) data.max_credit = max_credit;
        if (games_cutoff && offer.games_cutoff != games_cutoff) data.games_cutoff = games_cutoff;
        if (is_reusable && offer.is_reusable != is_reusable) data.is_reusable = is_reusable;
        if (is_bonus && offer.is_bonus != is_bonus) data.is_bonus = is_bonus;

        // updating data
        const result = await offer.update(data);
        return res.status(200).send(result);
      } catch (error) {
        logger.error(error);
        res
          .status(400)
          .send("Request Failed");
      }
    }
  )
  // soft delete offer. This wont destroy data
  .delete("/:id", authorizer, async function (req, res) {
    try {
      if (req.user.role !== "admin") return res.sendStatus(400); // only admin can delete offer, if not admin bail
      const id = parseInt(req.params.id); // convert to integer
      // set is_deleted to true
      const offer = await OFFER.update(
        {
          is_deleted: true,
          is_active: false,
        },
        {
          where: {
            id: id,
          },
        }
      );
      return res.status(200).send(true);
    } catch (error) {
      logger.error(error);
      res.status(400).send("Request Failed");
    }
  });

export default router;
