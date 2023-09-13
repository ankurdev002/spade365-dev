// All bank account related requests will be handled here
// adding and fetching bank accounts etc

import express from "express";
import { body, query, validationResult } from "express-validator";
import db from "../../db/models/index.js";
import { Op } from "sequelize";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
const USER = db.User;
const BANKACCOUNT = db.BankAccount;

const router = express.Router();

router
    // Get All Bank Accounts. Accessible by all logged in users, including non-admins.
    .get("/",
        query("limit").isNumeric(),
        query("skip").isNumeric(),
        query("search").isString().trim().escape(),
        authorizer,
        async function (req, res) {
            try {
                if (!req.user.id) return res.sendStatus(400); // if not logged in, bail
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const { limit, skip, search } = req.query;
                let bankAccounts;
                if (req.user.role === "admin") {
                    bankAccounts = await BANKACCOUNT.findAll({
                        order: [["id", "DESC"]],
                        where: {
                            for_admin: true,  // for admin accounts are used for deposit, so they are shown to users too
                            // is_deleted: false, // admin get deleted accounts too
                            [Op.or]: [
                                { account: { [Op.like]: `%${search}%` } },
                                { name: { [Op.like]: `%${search}%` } },
                                { type: { [Op.like]: `%${search}%` } },
                                { method: { [Op.like]: `%${search}%` } },
                            ],
                        },
                        limit,
                        offset: skip,
                    });
                } else {
                    bankAccounts = await BANKACCOUNT.findAll({
                        order: [["id", "DESC"]],
                        where: {
                            for_admin: true, // for admin accounts are used for deposit, so they are shown to users too
                            is_deleted: false, // if not admin skip deleted accounts
                            [Op.or]: [
                                { account: { [Op.like]: `%${search}%` } },
                                { name: { [Op.like]: `%${search}%` } },
                                { type: { [Op.like]: `%${search}%` } },
                                { method: { [Op.like]: `%${search}%` } },
                            ],
                        },
                        limit,
                        offset: skip,
                    });
                }
                res.status(200).send(bankAccounts);
            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        })
    // Add a bank account. Admin only. 
    .post("/",
        body("name").isString().trim().escape(), //also used for upi id
        body("account").isString().trim().escape().optional({ checkFalsy: true }), // optional as account number is not needed when adding upi
        body("account_name").isString().trim().escape(), // also used for upi name
        body("type").isString().trim().escape(),
        body("method").isString().trim().escape(),
        body("ifsc").isString().trim().escape().optional({ checkFalsy: true }),
        body("image").isString().optional({ checkFalsy: true }), // base64 image used for upi qr code
        body("min_amount").isNumeric(),
        body("max_amount").isNumeric(),
        authorizer,
        async function (req, res) {
            try {
                if (req.user.role !== "admin") return res.sendStatus(400);// only admin can add bank accounts, if not admin bail
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const { name, account, account_name, type, method, ifsc, min_amount, max_amount, image } = req.body;
                // if max amount is less than min amount, bail
                if (max_amount < min_amount) return res.status(400).send("Max amount cannot be less than min amount.");
                // Add to database
                const bankAccount = await BANKACCOUNT.create({
                    account,
                    name,
                    account_name,
                    type,
                    method,
                    image,
                    ifsc,
                    min_amount,
                    max_amount,
                    for_admin: true,
                });
                res.status(200).send(bankAccount);
            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        })
    // Restore a deleted bank account. Admin only. 
    .put("/:id/restore",
        authorizer,
        async function (req, res) {
            try {
                if (req.user.role !== "admin") return res.sendStatus(400);// only admin can restore bank accounts, if not admin bail
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const id = parseInt(req.params.id); // convert to integer
                // set is_deleted to false
                const bankAccount = await BANKACCOUNT.update({
                    is_deleted: false,
                }, {
                    where: {
                        id: id,
                    },
                });
                res.status(200).send(true);
            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        })
    // Update a bank account. Admin only. Not used as of now, as updating bank accounts will create a mess.
    .put("/:id",
        body("name").isString().trim().escape(),
        body("account").isString().trim().escape(),
        body("account_name").isString().trim().escape(),
        body("type").isString().trim().escape(),
        body("method").isString().trim().escape(),
        body("ifsc").isString().trim().escape(),
        body("image").isString().optional({ checkFalsy: true }), // base64 image used for upi qr code
        body("min_amount").isNumeric(),
        body("max_amount").isNumeric(),
        authorizer,
        async function (req, res) {
            try {
                if (req.user.role !== "admin") return res.sendStatus(400);// only admin can update bank accounts, if not admin bail
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const { name, account, account_name, type, method, ifsc, min_amount, max_amount, image } = req.body;
                // if max amount is less than min amount, bail
                if (max_amount < min_amount) return res.status(400).send("Max amount cannot be less than min amount.");
                // Update in database
                const id = parseInt(req.params.id);
                const bankAccount = await BANKACCOUNT.update({
                    account,
                    name,
                    account_name,
                    type,
                    method,
                    image,
                    ifsc,
                    min_amount,
                    max_amount,
                }, {
                    where: {
                        id: id,
                    },
                });
                return res.status(200).send(bankAccount);
            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        })
    // Soft Delete a bank account. Admin only. We're just setting is_deleted to true, not actually deleting it.
    .delete("/:id",
        authorizer,
        async function (req, res) {
            try {
                if (req.user.role !== "admin") return res.sendStatus(400);// only admin can delete bank accounts, if not admin bail
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const id = parseInt(req.params.id); // convert to integer
                // set is_deleted to true
                const bankAccount = await BANKACCOUNT.update({
                    is_deleted: true,
                }, {
                    where: {
                        id: id,
                    },
                });
                return res.status(200).send(true);
            } catch (error) {
                logger.error(error);
                res.status(400).send("Request Failed");
            }
        });


export default router;
