import cron from "cron";
import { logger } from "../logger";
import {
  // deleteBankAccount,
  deleteGamingSession,
  deleteOTP,
  deleteLogs,
  // deleteWithdrawAccount,
  finalizeBetSlip,
  finalizeFancyBetSlip,
  voidOpenFawkBets,
} from "./jobs";
const CronJob = cron.CronJob;

// reference : https://github.com/kelektiv/node-cron#readme

// define jobs here

// 0 1 * * 0 => At 01:00 on every sunday.
const weekendJob = new CronJob("0 1 * * 0", async function () {
  logger.info("Cron: Started weekendJob");
  await deleteGamingSession();
  await deleteLogs();
  // await deleteBankAccount();
  // await deleteWithdrawAccount();
  logger.info("Cron: Finished weekendJob");
});

// 0 0 1 * * => At 00:00 on 1st day-of-month.
const monthlyJob = new CronJob("0 0 1 * *", async function () {
  logger.info("Cron: Started monthlyJob");
  await deleteOTP();
  logger.info("Cron: Finished monthlyJob");
});

// 0 * *  * * => At 0 minute of every hour.
const hourlyJob = new CronJob("0 * * * *", async function () {
  logger.info("Cron: Started hourlyJob");
  await finalizeBetSlip();
  logger.info("Cron: Finished hourlyJob");
});

// 30 * * * * => At 30 th minute of every hour
const halfHourJob = new CronJob("30 * * * *", async function () {
  logger.info("Cron: Started half hour Job");
  await voidOpenFawkBets(); // void open fawk bets after 30 minutes
  await finalizeFancyBetSlip();
  logger.info("Cron: Finished half hour Job");
});

// at every 15 minutes
// const fifteenMinutesJob = new CronJob("0 */15 * * * *", async function () {
//   logger.info("Cron: Started fifteenMinutesJob");
//   logger.info("Cron: Finished fifteenMinutesJob");
// });

export const startJobs = () => {
  // fifteenMinutesJob.start(); // every 15 minutes
  halfHourJob.start(); // at 30th minute of every hour, not every 30 minutes. 1:30, 2:30, 3:30 etc
  hourlyJob.start(); // at 0th minute of every hour. 1:00, 2:00, 3:00 etc
  weekendJob.start(); // at 1:00 on every sunday
  monthlyJob.start(); // at 0:00 on 1st day-of-month
};

/*self initiating function to manually enable cron job from package script
~npm run start:cron
*/
//startJobs();
