import axios from "axios";
import { Op } from "sequelize";
import db from "../../db/models";
import { logger } from "../logger";
import config from "../../config/index.js";
import { getCricketScoreFromCrawl } from "../crawler";
import { sendTelegramMessageAdmin } from "../telegram";

// delete abandoned game sessions older than 30 days
export const deleteGamingSession = async () => {
  try {
    logger.info("Cron: Starting deleteGamingSession job");
    const sessions = await db.GamingSession.destroy({
      where: {
        updatedAt: {
          [Op.lt]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      truncate: true,
    });
    logger.info(`Cron: deleted ${sessions} gaming sessions older than 30 days`);
  } catch (error) {
    logger.error(`Cron: deleteGamingSession job failed with error: ${error.message}`);
  }
};

// delete logs older than 3 months
export const deleteLogs = async () => {
  try {
    logger.info("Cron: Starting deleteLogs job");
    const logs = await db.Log.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(new Date() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      truncate: true,
    });
    logger.info(`Cron: deleted logs older than 3 months`);
  } catch (error) {
    logger.error(`Cron: deleteLogs job failed with error: ${error.message}`);
  }
};

// delete expired OTP's after 7 days
export const deleteOTP = async () => {
  try {
    logger.info("Cron: Starting deleteOTP job");
    const otps = await db.Otp.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      truncate: true,
    });
    logger.info(`Cron: deleted OTP's older than 7 days`);
  } catch (error) {
    logger.error(`Cron: deleteOTP job failed with error: ${error.message}`);
  }
};

export const voidOpenFawkBets = async () => {
  try {
    logger.info("Cron: Starting voidOpenFawkBets job");
    // find all bets where category is fawk and status is open and createdAt is older than 30 minutes, set the bet status to void and update the user balance by adding the bet.stake to user.credit
    const bets = await db.Bet.findAll({
      where: {
        category: "fawk",
        status: "OPEN",
        createdAt: {
          [Op.lt]: new Date(new Date() - 30 * 60 * 1000),
        },
      },
      include: ["user"],
    });

    if (!bets.length) {
      logger.info("Cron: voidOpenFawkBets: no data found for voiding");
      return;
    }

    // for loop with promise
    for (let i = 0; i < bets.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));// make sure we dont update user balance simultaneously as multiple bets can have same user
      const bet = bets[i];
      logger.info(`Cron: voiding bet ${JSON.stringify(bet)}`);
      // void the bet
      await bet.update({
        status: "VOID",
      });
      // update the user balance
      const user = await db.User.findByPk(bet.user.id);
      await user.update({
        credit: user.credit + bet.stake,
      });
      // send telegram message
      // await sendTelegramMessageAdmin(
      //   `Voided bet: ${bet.id} for user ${user.username} with stake ${bet.stake}`
      // );
    }

  } catch (error) {
    logger.error(`Cron: voidOpenFawkBets job failed with error: ${error.message}`);
  }
};

// Disabled as we're deleting bank accounts when user is deleted
// delete bank accounts of deleted/non-existing users
// export const deleteBankAccount = async () => {
//   try {
//     logger.info("Cron: Starting deleteBankAccount job");
//     const bankAccounts = await db.BankAccount.findAll({
//       where: {
//         "$user.is_deleted$": true,
//       },
//       include: ["user"],
//     });
//     if (!bankAccounts.length)
//       logger.info("Cron: deleteBankAccount: no data found for deleting");

//     for (const bankAccount of bankAccounts) {
//       logger.info(`Cron: deleting bank account ${JSON.stringify(bankAccount)}`);
//       await bankAccount.destroy();
//     }
//   } catch (error) {
//     logger.error(`Cron: deleteBankAccount job failed with error: ${error.message}`);
//   }
// };

// Disabled as we're deleting withdraw accounts when user is deleted
// export const deleteWithdrawAccount = async () => {
//   try {
//     // delete withdraw accounts of deleted/non-existing users
//     logger.info("Cron: Starting deleteWithdrawAccount job");
//     const withdrawalAccounts = await db.WithdrawAccounts.findAll({
//       where: {
//         "$user.is_deleted$": true,
//       },
//       include: ["user"],
//     });

//     if (!withdrawalAccounts.length)
//       logger.info("deleteWithdrawAccount: no data found for deleting");

//     for (const withdrawalAccount of withdrawalAccounts) {
//       logger.info(
//         `deleting withdraw account ${JSON.stringify(withdrawalAccount)}`
//       );
//       await withdrawalAccount.destroy();
//     }
//   } catch (error) {
//     logger.error(
//       `deleteWithdrawAccount job failed with error: ${error.message}`
//     );
//   }
// };

export const finalizeBetSlip = async () => {
  try {
    // finalizing open bet slip
    logger.info("Cron: Starting finalizeBetSlip job");
    // get all bets where status open and category sports
    const openBetSlips = await db.Bet.findAll({
      where: {
        status: "OPEN",
        category: "sports",
      },
      include: ["user"],
    });

    // bail ifnobet slip
    if (!openBetSlips.length) {
      logger.info("Cron: No open bets found");
      return;
    }
    for (let i = 0; i < openBetSlips.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));// make for loop synchronous to avoid api rate limit and settlement of multiple bets by same user (in async, when multiple bets are settled by same user, it creates credit issues)

      let winner;
      const obs = openBetSlips[i];

      if (obs.sport_id.includes("soccer")) {
        const resData = await axios.get(`${config.oddsAPI}/sports/${obs.sport_id}/scores/?apiKey=${config.oddsAPIKey}&dateFormat=iso&daysFrom=${3}`);
        if (!resData) {
          logger.info("finalize bet slip: not response from score api");
          continue;
        }

        // finding event result from the score api
        const eventResult = resData.data.find(
          (obj) => obj.id == obs.event_id
        );

        // skip the loop if not found
        if (!eventResult) {
          logger.info(`Cron: event result not available for ${obs.event_id}`);
          continue;
        }

        // skip if event not yet completed
        if (eventResult.completed == false) {
          logger.info(`Cron: event not completed for ${obs.event_id}`);
          continue;
        }
        if (!eventResult.score) {
          logger.error(
            "Cron: finalizing betslip warning: score for the event is not available"
          );
          sendTelegramMessageAdmin(
            `Cron: score for event Id: ${obs.event_id} of sport ${obs.sport_id} is not available`
          );
          continue;
        }

        // sorting the result descending order according to score
        await eventResult.scores.sort(
          (a, b) => parseInt(b.score) - parseInt(a.score)
        );

        // check if event is a draw
        if (eventResult.scores[0].score === eventResult.scores[1].score) winner = "draw";
        else winner = eventResult.scores[0].name; // assigning winner name
      } else if (obs.sport_id.includes("cricket")) {
        logger.info(
          `fetching info of the match ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}`
        );
        const eventScore = await getCricketScoreFromCrawl(
          [obs.homeTeam, obs.awayTeam],
          obs.commence_time
        );
        // Check if match is completed
        if (!eventScore.completed) {
          logger.info(`event not completed for ${obs.event_id}`);
          continue;
        }
        // Check if match got abandoned (due to weather or any other reason). If completed, but still one of the score is 0 or, then match is abandoned
        // if (eventScore.scores.find((score) => score.score == 0) || eventScore.scores.find((score) => !score.score)) {
        if (eventScore.abandoned) { // if abandoned is true from crawler
          logger.info(`Bet void due to no result. Match was abandoned for ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}`);
          const tx = {
            user_id: obs.user.id,
            type: "credit",
            amount: parseInt(obs.liability),
            game_data: {
              game: "oddsBet",
              eventId: obs.event_id,
              sportId: obs.sport_id,
              type: obs.bet_type,
            },
            status: "success",
            remark: `Bet void due to no result. Match was abandoned for ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}`,
            reference: obs.id,
          };
          await db.Bet.update({ status: "VOID", }, { where: { id: obs.id, }, });
          await db.User.increment({ credit: parseInt(obs.liability) }, { where: { id: obs.user.id } });
          await db.Transaction.create(tx);
          continue; // skip the loop
        }
        winner = eventScore.result.type === "win" ? eventScore.result.winner : "draw";
      } else if (obs.sport_id.includes("tennis")) {
        sendTelegramMessageAdmin("Tennis score not available");
      }
      if (!winner) {
        logger.info("winner not found");
        continue;
      }

      // tx object
      let tx = {
        user_id: obs.user.id,
        type: "",
        amount: 0,
        game_data: {
          game: "oddsBet",
          eventId: obs.event_id,
          sportId: obs.sport_id,
          type: obs.bet_type,
        },
        status: "success",
        remark: "",
        reference: obs.id,
      };

      // verifying back bet
      if (obs.bet_type == "back") {
        // if won
        if (obs.selectedTeam.toLowerCase() === winner.toLowerCase()) {
          logger.info(`userId: ${obs.user.id} won back betId: ${obs.id}`);
          const creditAmount = parseInt(obs.pnl) + parseInt(obs.liability);
          const credit = obs.user.credit + creditAmount; // calculating credit. add current user credit + stake (deducted while placing bet) + pnl
          // updating tx object
          tx.type = "credit";
          tx.amount = creditAmount; // stake already deducted
          tx.remark = `Won sports ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.selectedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "WON",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.User.update({ credit }, { where: { id: obs.user.id } }); // updating user balance
          await db.Transaction.create(tx); // creating tx; tx event not used since txid required as settlement_id
        } else {
          // if lost
          logger.info(`userId: ${obs.user.id} lost back betId: ${obs.id}`);
          tx.type = "debit"; // if stake > pnl, then credit else debit
          tx.amount = 0;
          tx.remark = `Lost sports ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.selectedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "LOST",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.Transaction.create(tx);
        }
      } else {
        // lay bet
        if (obs.selectedTeam.toLowerCase() != winner.toLowerCase()) {
          // if won
          logger.info(
            `userId: ${obs.user.id} won lay betId: ${obs.id}`
          );
          const creditAmount = parseInt(obs.pnl) + parseInt(obs.liability);
          const credit = obs.user.credit + creditAmount;
          tx.type = "credit";
          tx.amount = creditAmount;
          tx.remark = `Won sports ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.selectedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "WON",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.User.update({ credit }, { where: { id: obs.user.id } }); // updating credit
          await db.Transaction.create(tx); // creating new tx
        } else {
          // if lose
          logger.info(
            `userId: ${obs.user.id} lost lay betId: ${obs.id}`
          );
          tx.type = "debit";
          tx.remark = `Lost sports ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.selectedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          tx.amount = 0;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "LOST",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.Transaction.create(tx);
        }
      }
    }
    logger.info("Cron: Finishing finalizeBetSlip job");
  } catch (error) {
    logger.error(`finalizing bet job failed with error: ${error.message}`);
  }
};

export const finalizeFancyBetSlip = async () => {
  try {
    // finalizing open fancy bet slip
    logger.info("Cron: Starting finalizeFancyBetSlip job");
    // get all bets where status open and category sports_fancy
    const openBetSlips = await db.Bet.findAll({
      where: {
        status: "OPEN",
        category: "sports_fancy",
      },
      include: ["user"],
    });
    // bail if no bet slip
    if (!openBetSlips.length) {
      logger.info("No open bets found");
      return;
    }

    for (let i = 0; i < openBetSlips.length; i++) {
      const obs = openBetSlips[i];
      const selectedOutcome = obs.market;
      if (new Date(obs.market.commence_time) > new Date()) {
        logger.info(`eventId: ${obs.event_id} not yet started`);
        continue;
      }
      const eventScore = await getCricketScoreFromCrawl(
        selectedOutcome.teams,
        obs.commence_time
      );
      if (!eventScore) {
        logger.info(`finalize fancy bet slip: no response from score api for the event: ${obs.event_id}`);
        continue;
      }
      if (!eventScore.toss.winner) {
        logger.info(`finalize fancy bet slip: toss not finished for event: ${obs.event_id}`);
        continue;
      }
      // tx object
      let tx = {
        user_id: obs.user.id,
        type: "",
        amount: 0,
        game_data: {
          game: "oddsBet",
          eventId: obs.event_id,
          sportId: obs.sport_id,
          type: obs.bet_type,
        },
        status: "success",
        remark: "",
        reference: obs.id,
      };
      if (selectedOutcome.secondaryKey == "toss") {
        const tossWinner = eventScore.toss.winner.toLowerCase();
        const pickedTeam = selectedOutcome.primaryKey.toLowerCase();
        if (tossWinner == pickedTeam) {
          logger.info(`userId: ${obs.user.id} won toss betId: ${obs.id}`);
          const winAmount = parseInt(obs.pnl) + parseInt(obs.liability);
          const credit = obs.user.credit + winAmount; // calculating credit
          // updating tx object
          tx.type = "credit";
          tx.amount = winAmount; // stake already deducted
          tx.remark = `Won sports toss ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.pickedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          //updating bet slip
          await db.Bet.update(
            {
              status: "WON",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.User.update(
            { credit },
            { where: { id: obs.user.id } }
          ); // updating user balance
          await db.Transaction.create(tx); // creating tx; tx event not used since txid required as settlement_id
        } else {
          // if lost
          logger.info(
            `userId: ${obs.user.id} lost toss betId: ${obs.id}`
          );
          tx.type = "debit"; // if stake > pnl, then credit else debit
          tx.amount = 0;
          tx.remark = `Lost sports toss ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.pickedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "LOST",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.Transaction.create(tx);
        }
      } else if (
        selectedOutcome.secondaryKey == "firstOverRun" ||
        selectedOutcome.secondaryKey == "fiveOverRun" ||
        selectedOutcome.secondaryKey == "tenOverRun"
      ) {
        let won;
        let actualScore;
        const pickedTeam = selectedOutcome.primaryKey;
        const selectedTeamScore = await eventScore.scores.find(
          (score) => score.name.toLowerCase() == pickedTeam.toLowerCase()
        );
        if (!selectedTeamScore) {
          logger.info(`finalize fancy bet slip: scores of ${pickedTeam} for the eventId: ${obs.event_id} is not available yet.`);
          continue;
        }
        if (selectedOutcome.secondaryKey == "firstOverRun") {
          const firstOver = await selectedTeamScore.over_by_over.find(
            (obj) => obj.over == 1
          );
          if (!firstOver) {
            logger.info(`finalize fancy bet slip: first over scores of ${pickedTeam} for the eventId: ${obs.event_id} is not available yet.`);
            continue;
          }
          actualScore = firstOver.score;
        } else if (selectedOutcome.secondaryKey == "fiveOverRun") {
          const fifthOver = await selectedTeamScore.over_by_over.find(
            (obj) => obj.over == 5
          );
          if (!fifthOver) {
            logger.info(`finalize fancy bet slip: fifth over scores of ${pickedTeam} for the eventId: ${obs.event_id} is not available yet.`);
            continue;
          }
          actualScore = fifthOver.score;
        } else {
          const tenthOver = await selectedTeamScore.over_by_over.find(
            (obj) => obj.over == 10
          );
          if (!tenthOver) {
            logger.info(`finalize fancy bet slip: tenth over scores of ${pickedTeam} for the eventId: ${obs.event_id} is not available yet.`);
            continue;
          }
          actualScore = tenthOver.score;
        }

        const predictedScore =
          obs.bet_type == "back"
            ? selectedOutcome.backScore
            : selectedOutcome.layScore;
        //win
        won =
          obs.bet_type == "back"
            ? predictedScore < actualScore
            : predictedScore > actualScore;
        if (won) {
          logger.info(
            `userId: ${obs.user.id} won fancy betId: ${obs.id}`
          );
          const winAmount = parseInt(obs.pnl) + parseInt(obs.liability);
          const credit = obs.user.credit + winAmount; // calculating credit
          // updating tx object
          tx.type = "credit";
          tx.amount = winAmount; // stake already deducted
          tx.remark = `Won sports fancy toss ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.pickedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          //updating bet slip
          await db.Bet.update(
            {
              status: "WON",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.User.update(
            { credit },
            { where: { id: obs.user.id } }
          ); // updating user balance
          await db.Transaction.create(tx); // creating tx; tx event not used since txid required as settlement_id
        } else {
          logger.info(`userId: ${obs.user.id} lost fancy bet slip: ${obs.id}`);
          tx.type = "debit";
          tx.amount = 0;
          tx.remark = `Lost sports fancy toss ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.pickedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "LOST",
              // settlement_id: transaction.id,
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.Transaction.create(tx);
        }
      } else if (selectedOutcome.secondaryKey == "playerOfTheMatch") {
        const playerOfTheMatchTeam =
          eventScore.players_of_match[0]?.team.toLowerCase();
        const pickedTeam = selectedOutcome.primaryKey.toLowerCase();
        if (playerOfTheMatchTeam == pickedTeam) {
          logger.info(`userId: ${obs.user.id} won toss betId: ${obs.id}`);
          const winAmount = parseInt(obs.pnl) + parseInt(obs.liability);
          const credit = obs.user.credit + winAmount; // calculating credit
          // updating tx object
          tx.type = "credit";
          tx.amount = winAmount; // stake already deducted
          tx.remark = `Won sports fancy playerOfTheMatch ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.pickedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          //updating bet slip
          await db.Bet.update(
            {
              status: "WON",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.User.update(
            { credit },
            { where: { id: obs.user.id } }
          ); // updating user balance
          await db.Transaction.create(tx); // creating tx; tx event not used since txid required as settlement_id
        } else {
          // if lost
          logger.info(`userId: ${obs.user.id} lost fancy betId: ${obs.id}`);
          tx.type = "debit";
          tx.amount = 0;
          tx.remark = `Lost sports fancy ${obs.bet_type} bet with pnl: ₹ ${obs.pnl} and stake: ₹ ${obs.stake} and liability: ₹ ${obs.liability} with selection: ${obs.pickedTeam} on game: ${obs.homeTeam} vs ${obs.awayTeam} on ${obs.commence_time}. Bet ID: ${obs.id}`;
          // Always update in order. First Bet, then user, then transaction
          await db.Bet.update(
            {
              status: "LOST",
            },
            {
              where: {
                id: obs.id,
              },
            }
          );
          await db.Transaction.create(tx);
        }
      }
    }
    logger.info("Cron: Finishing finalizeFancyBetSlip job");
  } catch (error) {
    logger.error(`Cron: finalizing fancy bet job failed with error: ${error.message}`);
  }
};
