"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // User has many BankAccounts
      User.hasMany(models.BankAccount, {
        foreignKey: "user_id",
        as: "bankAccounts",
      });
      // User has many deposits
      User.hasMany(models.Deposit, {
        foreignKey: "user_id",
        as: "deposits",
      });
      // User has many withdrawal accounts
      User.hasMany(models.WithdrawAccounts, {
        foreignKey: "user_id",
        as: "withdrawals",
      });
      // User has many Withdrawals
      User.hasMany(models.Withdrawals, {
        foreignKey: "action_by",
        as: "updated_by",
      });
      // User has many bets
      User.hasMany(models.Bet, {
        foreignKey: "user_id",
        as: "bets",
      });
      // user has many transactions
      User.hasMany(models.Transaction, {
        foreignKey: "user_id",
        as: "transactions",
      });
    }
  }
  User.init(
    {
      username: { type: DataTypes.STRING, defaultValue: "" }, // client requested to add username for login in admin panel
      name: { type: DataTypes.STRING, defaultValue: "" },
      email: { type: DataTypes.STRING, defaultValue: "" },
      password: DataTypes.STRING,
      is_superuser: { type: DataTypes.BOOLEAN, defaultValue: false },
      role: { type: DataTypes.STRING, defaultValue: "" },
      phone: DataTypes.STRING,
      credit: { type: DataTypes.FLOAT, defaultValue: 0 }, // main credit, i.e wallet balance which can be withdrawn
      bonus: { type: DataTypes.FLOAT, defaultValue: 0 }, // bonus credit for promotions, cannot be withdrawn
      exposure: { type: DataTypes.FLOAT, defaultValue: 0 }, // total exposure. Will be mostly saved in negative value, i.e the total amount of money user can lose on all bets.
      exposureTime: { type: DataTypes.DATE, defaultValue: null }, // last exposure time. Required by provider: Fawk Poker
      exposureLimit: { type: DataTypes.INTEGER, defaultValue: -200000 }, // Exposure limit. How much exposure is allowed for user, i.e how much money can a user owe on bets. Default: 2 Lakhs (200000).
      wagering: { type: DataTypes.FLOAT, defaultValue: 0 }, // total wagering/rolling amount of user on all bets.stake. resets on every deposit.
      ip: DataTypes.STRING,
      user_agent: { type: DataTypes.STRING, defaultValue: "na" },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // for soft delete
      is_banned: { type: DataTypes.BOOLEAN, defaultValue: false },
      last_login: { type: DataTypes.DATE },
      token: { type: DataTypes.STRING, defaultValue: null },
      addedBy: { type: DataTypes.INTEGER, defaultValue: null }, // admin or subadmin id who added this user
      timezone: { type: DataTypes.STRING, defaultValue: "india" },
      lastActive: { type: DataTypes.DATE, defaultValue: null },
      access: {
        // page access permissions for admin panel
        type: DataTypes.JSON,
        defaultValue: {
          dashboard: false,
          users: false,
          games: false,
          team: false,
          deposits: false,
          withdrawals: false,
          bankAccounts: false,
          transactions: false,
          offers: false,
          settings: false,
          reports: false,
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      defaultScope: {
        attributes: {
          exclude: ["password", "token"],
        },
      },
    }
  );
  User.addScope("withSecret", {
    attributes: {
      include: ["password", "token"],
    },
  });
  // add scope to include all associations
  User.addScope("withAllAssociations", {
    include: [
      {
        association: "bankAccounts",
        attributes: {
          exclude: ["user_id"],
        },
      },
      {
        association: "deposits",
        attributes: {
          exclude: ["user_id"],
        },
      },
      {
        association: "withdrawals",
        attributes: {
          exclude: ["user_id"],
        },
      },
      {
        association: "updated_by",
        attributes: {
          exclude: ["user_id"],
        },
      },
      {
        association: "bets",
        attributes: {
          exclude: ["user_id"],
        },
      },
      {
        association: "transactions",
        attributes: {
          exclude: ["user_id"],
        },
      }
    ],
  });
  return User;
};
