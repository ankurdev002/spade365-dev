import express from "express";
import { body, query, validationResult } from "express-validator";
import db from "../../db/models/index.js";
import authorizer from "../../middleware/authorizer.js";
import { logger } from "../../utils/logger.js";
const BET = db.Bet;
const TRANSACTION = db.Transaction;

const router = express.Router();

router
    // Get All User Transactions. Only Admins can access. This route also includes bets merged with transactions as per client request
    .get(
        "/",
        query("limit").isNumeric().optional({ checkFalsy: true }),
        query("skip").isNumeric().optional({ checkFalsy: true }),
        query("user").isNumeric().optional({ checkFalsy: true }), // user id, for use by admins to get transactions of particular user
        query("status").optional({ checkFalsy: true }), // OPEN, VOID, WON, LOST
        authorizer,
        async (req, res) => {
            try {
                if (!req.user) return res.status(401).send("Unauthorized");
                const { limit = 20, skip = 0, status = "", } = req.query;
                const user = req.user;
                const trxn_UserId = parseInt(req.query.user) || 0;
                let result;
                let transactions;
                let bets;
                let where = {};

                if (status) where.status = status;
                if (trxn_UserId) where.user_id = trxn_UserId;

                transactions = await TRANSACTION.findAll({
                    // order: [["id", "DESC"]],
                    order: [["createdAt", "DESC"]],
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

                return res.status(200).send(transactions);

                // NOT MERGING WITH BETS FOR NOW

                // get bets for all parseInt(transaction.reference)=bet.id
                bets = await BET.findAll({
                    order: [["createdAt", "DESC"]],
                    where: {
                        // id: transactions.map((item) => parseInt(item.reference)), // bets for transactions.reference
                        user_id: transactions.map((item) => parseInt(item.user_id)), // bets for transactions.user_id
                    },
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

                // merge transactions and bets
                result = [...transactions, ...bets];
                // map to required format
                result = result.map((item) => {
                    return {
                        id: item.id,
                        type: item.type || `Bet: ${item.status}`,
                        user_id: item.user_id,
                        user: item.user,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        amount: item.amount || item.pnl || item.stake,
                        status: item.status,
                        remark: item.remark || `${item.selectedOdd ?? 'Odds: ' + item.selectedOdd} ${item.runnerName ?? 'on Runner: ' + item.runnerName} ${item.gameType ?? 'in Game: ' + item.gameType} ${item.roundId ?? 'at Round: ' + item.roundId}`
                    }
                });

                result.sort((a, b) => {
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                });

                return res.status(200).json(result);
            } catch (error) {
                logger.error(`transactions.get: ${error}`);
                return res.status(400).send("Request Failed");
            }
        }
    );

export default router;



