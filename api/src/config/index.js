import dotenv from "dotenv";
import config from "12factor-config";
dotenv.config();

var cfg = config({
  NODE_ENV: {
    env: "NODE_ENV",
    type: "string",
    default: "development",
  },
  host: {
    env: "APP_HOST",
    type: "string",
    default: "localhost",
    required: true,
  },
  port: {
    env: "APP_PORT",
    type: "integer",
    default: 3000,
  },
  DBURL: {
    env: "DATABASE_URL",
    type: "string",
    required: true,
  },
  dbUsername: {
    env: "DB_USERNAME",
    type: "string",
    default: "spade_user",
  },
  dbSecret: {
    env: "DB_SECRET",
    type: "string",
    default: "",
  },
  dbName: {
    env: "DB_NAME",
    type: "string",
    default: "spade_dev",
  },
  sessionSecret: {
    env: "SESSION_SECRET",
    type: "string",
    required: true,
  },
  wcoPartnerKey: {
    env: "WCO_PARTNER_KEY",
    type: "string",
    default:
      "yL7+KgrtTS++4hzO4cfc1tUeR5JJP4BBHm2ImF9KXeexfQMQUAUZgn2FQAWrXN93uChpZQ0KIzQ=", // staging key
  },
  oddsAPI: {
    env: "ODDS_API",
    type: "string",
    default: "https://api.the-odds-api.com/v4",
  },
  bookmakerFetchTime: {
    env: "BOOKMAKER_FETCH_TIME",
    type: "integer",
    default: 1600,
  },
  oddsAPIKey: {
    env: "ODDS_API_KEY",
    type: "string",
    default: "d4493077ce40a61d169c1b241fde2754",
  },
  homeURl: {
    env: "HOME_URL",
    type: "string",
    default: "https://spade365.com/",
  },
  enableCronJob: {
    env: "ENABLE_CRON_JOB",
    type: "string",
    default: "true",
  },
  telegramBotToken: {
    env: "TELEGRAM_BOT_TOKEN",
    type: "string",
    default: "",
  },
  telegramChatIdAdmin: {
    env: "TELEGRAM_CHAT_ID_ADMIN",
    type: "string",
    default: "-1001834057818",
  },
  wacsUser: {
    env: "WACS_USER",
    type: "string",
    default: "fancybet",
  },
  wacsApiPass: {
    env: "WACS_API_PASS",
    type: "string",
    default: "",
  },
  smsApiUrl: {
    env: "SMS_API_URL",
    type: "string",
    default: "https://www.fast2sms.com/dev/bulkV2",
  },
  smsApiKey: {
    env: "SMS_API_KEY",
    type: "string",
    default: "",
  },
  proxyUrl: {
    env: "PROXY_URL",
    type: "string",
    default: "",
  },
  proxyPort: {
    env: "PROXY_PORT",
    type: "string",
    default: "",
  },
  proxyUser: {
    env: "PROXY_USER",
    type: "string",
    default: "",
  },
  proxyPass: {
    env: "PROXY_PASS",
    type: "string",
    default: "",
  },
});

export default cfg;
