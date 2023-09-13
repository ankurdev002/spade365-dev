// This script will run after the build is complete

import TelegramBot from "node-telegram-bot-api";
import * as dotenv from 'dotenv';
dotenv.config();

export const telegram = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: false,
});

telegram.sendMessage(process.env.TELEGRAM_CHAT_ID_ADMIN, `🚀 New code pushed by developers. Build successful ✅ Deployed to production complete. 🚀`);