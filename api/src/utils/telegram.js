import { logger } from "./logger";
import TelegramBot from "node-telegram-bot-api";
import config from "../config/index";
import NodeCache from "node-cache";

const cachedData = new NodeCache({
  stdTTL: 60 * 60 * 1, // 1 hour
  checkperiod: 60 * 60 * 0.2, // 12 minutes
  maxKeys: -1, // max number of keys in cache, -1 means unlimited
});

export const telegram = new TelegramBot(config.telegramBotToken, {
  polling: false,
});

export const sendTelegramMessageAdmin = async (message) => {
  try {
    if (message == "Request quota has been reached. See usage plans at https://the-odds-api.com") {
      const value = cachedData.get("notifyQuotaExpired");
      if (value) return;
      cachedData.set("notifyQuotaExpired", true);
      message = "URGENT: Odds-api request quota is finished. All sportsbook odds will fail until the plan is upgraded. Please urgently upgrade the plan at: https://the-odds-api.com/ to get the sportsbook online and working again. If the renew date is close, you can wait but sportsbook won't work until we have odds. For upgrading, please use the same email address associated with api to upgrade the plan. You can also use the contact form on their website. Their support is quick, usually within a few hours. Once upgraded, you don't need to do anything else as sportsbook will be automatically online again.";
    }
    if (message == "requestQuotaWarning") {
      const value = cachedData.get("notifyQuotaWarning");
      if (value) return;
      cachedData.set("notifyQuotaWarning", true);
      message = "WARNING: Odds-api request quota will exhaust soon. Remaining Request is less than 1000. Please update your plan at: https://the-odds-api.com/.";
    }
    await telegram.sendMessage(config.telegramChatIdAdmin, message);
  } catch (error) {
    console.log("Error sending telegram message", error);
    logger.error("Telegram Bot error " + error);
  }
};
