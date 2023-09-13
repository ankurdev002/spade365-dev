"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Bet extends Model {
    static associate(models) {
      // define association here
      Bet.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Bet.init(
    {
      user_id: DataTypes.INTEGER,
      category: {
        type: DataTypes.STRING,
        values: ["sports", "sports_fancy", "wacs", "fawk"],
      }, // sports & sports_fancy for sportsbook, wacs and fawk for casino api
      status: { type: DataTypes.STRING, defaultValue: "OPEN" }, // OPEN, VOID, WON, LOST
      pnl: DataTypes.INTEGER, // profit/loss
      bet_type: { type: DataTypes.STRING, values: ["back", "lay"] },
      user_balance: { type: DataTypes.INTEGER, defaultValue: 0 }, // user balance before/at the time bet is placed
      user_balance_after: { type: DataTypes.INTEGER, defaultValue: 0 }, // user balance after bet result is decalared. won, loss, void
      bonus_used: { type: DataTypes.INTEGER, defaultValue: 0 }, // bonus amount used in this bet
      stake: DataTypes.INTEGER,
      liability: DataTypes.INTEGER,
      event_id: DataTypes.STRING,
      sport_id: DataTypes.STRING,
      bookmaker: DataTypes.STRING,
      region: DataTypes.STRING,
      market: DataTypes.STRING,
      commence_time: DataTypes.DATE,
      selectedTeam: DataTypes.STRING,
      selectedOdd: DataTypes.STRING,
      settlement_id: DataTypes.INTEGER, // unique reference to settlement of market of user's profit loss,. given at the time of results
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // Soft deleting bets
      homeTeam: DataTypes.STRING,
      awayTeam: DataTypes.STRING,
      // Fawk: These are the fields that are required by Fawk/Aura game provider
      matchName: DataTypes.STRING, // Fawk
      gameId: DataTypes.STRING, // Fawk
      marketId: DataTypes.STRING, // Fawk
      marketType: DataTypes.STRING, // Fawk
      remoteUpdate: { type: DataTypes.BOOLEAN, defaultValue: false }, // Fawk
      runnerName: DataTypes.STRING, // Fawk
      market: DataTypes.JSON, // Fawk
      requestedOdds: DataTypes.STRING, // Fawk
      gameType: DataTypes.STRING, // Fawk: given at the time of results
      gameSubType: DataTypes.STRING, // Fawk: given at the time of results
      roundId: DataTypes.STRING, // Fawk
      orderId: DataTypes.STRING, // Fawk
      betExposure: DataTypes.FLOAT, // update betExposure from calculateExposure sent by game provider sent in /api/poker/exposure endpoint
      exposureTime: { type: DataTypes.DATE, defaultValue: null }, // last exposure time. Required by provider: Fawk Poker
    },
    {
      // hooks to update bet.user_balance and bet.user_balance_after
      hooks: {
        beforeCreate: async (bet, options) => {
          await new Promise(async (resolve, reject) => {
            const user = await sequelize.models.User.findOne({
              where: { id: bet.user_id },
            });
            const isSportsBet = bet.category === "sports" || bet.category === "sports_fancy" ? true : false;
            if (bet.status === "OPEN") {
              bet.user_balance = parseInt(user.credit);
              if (isSportsBet) {
                if (bet.stake >= 0) bet.user_balance_after = parseInt(user.credit) - Math.abs(parseInt(bet.liability));
              } else {
                if (bet.stake >= 0) bet.user_balance_after = parseInt(user.credit) - Math.abs(parseInt(bet.stake));
              }
              user.wagering = parseInt(user.wagering) + parseInt(bet.stake); // add bet.stake to user.wagering. wagering resets to 0 when user deposits
              await user.save();
            }
            resolve();
          });
        },
        beforeUpdate: async (bet, options) => {
          await new Promise(async (resolve, reject) => {
            const user = await sequelize.models.User.findOne({
              where: { id: bet.user_id },
            });
            const isSportsBet = bet.category === "sports" || bet.category === "sports_fancy" ? true : false;
            // in case of sportsbook, liability is deducted from user's credit, in case of casino, stake is deducted from user's credit
            if (isSportsBet) {
              const user_balance = parseInt(user.credit) + parseInt(bet.liability);
              bet.user_balance = user_balance;
              if (bet.status === "VOID") {
                bet.user_balance_after = user_balance;
              } else if (bet.status === "LOST") {
                bet.user_balance_after = parseInt(user_balance - bet.liability);
              } else if (bet.status === "WON") {
                bet.user_balance_after = user_balance + Math.abs(parseInt(bet.pnl));
              }
            } else {
              const user_balance = parseInt(user.credit) + parseInt(bet.stake);
              bet.user_balance = user_balance;
              if (bet.status === "VOID") {
                bet.user_balance_after = user_balance;
              } else if (bet.status === "LOST") {
                bet.user_balance_after = user_balance - Math.abs(parseInt(bet.pnl));
              } else if (bet.status === "WON") {
                bet.user_balance_after = user_balance + Math.abs(parseInt(bet.pnl));
              }
            }
            resolve();
          });
        }
      },
      sequelize,
      modelName: "Bet",
    }
  );
  return Bet;
};
