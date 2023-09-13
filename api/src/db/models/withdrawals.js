"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Withdrawals extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Withdrawals belongs to User
      Withdrawals.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      Withdrawals.belongsTo(models.WithdrawAccounts, {
        foreignKey: "account_id",
        as: "bank_account",
      });

      Withdrawals.belongsTo(models.User, {
        foreignKey: "action_by",
        as: "updated_by",
      });
    }
  }
  Withdrawals.init(
    {
      user_id: DataTypes.INTEGER,
      account_id: DataTypes.INTEGER,
      amount: DataTypes.FLOAT,
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        values: ["pending", "rejected", "approved"],
      },
      action_by: DataTypes.INTEGER,
      reference: { type: DataTypes.STRING, defaultValue: null },
      remark: DataTypes.TEXT("long"), // admin remark in case of rejection
    },
    {
      sequelize,
      modelName: "Withdrawals",
    }
  );
  return Withdrawals;
};
