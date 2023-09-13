import { logger } from "./logger";
import db from "../db/models";
const USER = db.User;
const TRANSACTION = db.Transaction;

import { EventEmitter } from "events";

export const txEvent = new EventEmitter();

export const subscribeTransaction = async () => {
  txEvent.on("new_transacion", async (txObject) => {
    logger.info("new transaction");
    createTransaction(txObject);
  });
};

export const createTransaction = async (transactionObject) => {
  try {
    const { user_id } = transactionObject;
    const user = await USER.findByPk(user_id);
    if (!user) throw new Error("user not found");
    await TRANSACTION.create(transactionObject);
  } catch (error) {
    logger.error("transaction error " + error);
  }
};
