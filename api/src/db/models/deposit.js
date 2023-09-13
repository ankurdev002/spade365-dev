"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Deposit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Deposit belongs to User
      Deposit.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      // Deposit is related to Offer
      Deposit.belongsTo(models.Offer, {
        foreignKey: "offer_id",
        as: "offer",
      });

      // Deposit is related to BankAccount (Admin owned)
      Deposit.belongsTo(models.BankAccount, {
        foreignKey: "bank_id",
        as: "deposit_account",
      });
    }
  }
  Deposit.init(
    {
      user_id: DataTypes.INTEGER,
      amount: DataTypes.FLOAT,
      utr: { type: DataTypes.STRING, allowNull: true },
      bank_id: { type: DataTypes.INTEGER, allowNull: true },
      offer_id: { type: DataTypes.INTEGER, allowNull: true },
      bonus: { type: DataTypes.FLOAT, allowNull: true }, // bonus amount, calculate at backend from offer_id (if present) at the time of adding deposit request
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        values: ["pending", "rejected", "approved"],
      },
      remark: DataTypes.TEXT("long"), // admin remark in case of rejection
    },
    {
      sequelize,
      modelName: "Deposit",
    }
  );
  return Deposit;
};
