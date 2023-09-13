"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Transaction.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }
  Transaction.init(
    {
      user_id: DataTypes.INTEGER,
      type: { type: DataTypes.STRING, values: ["credit", "debit"] },
      amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }, // this field is required
      game_data: { type: DataTypes.JSON, defaultValue: {} },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        values: ["pending", "success", "rejected", "reverted"],
      },
      remark: DataTypes.STRING,
      reference: DataTypes.STRING,
      user_balance: { type: DataTypes.INTEGER, defaultValue: 0 },
      timestamp: {
        type: "TIMESTAMP",
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      hooks: {
        beforeCreate: async (transaction, options) => {
          await new Promise(async (resolve, reject) => {
            const user = await sequelize.models.User.findOne({
              where: { id: transaction.user_id },
            });
            transaction.user_balance = parseInt(user.credit || 0);
            resolve();
          });
        },
      },
      sequelize,
      modelName: "Transaction",
    }
  );
  return Transaction;
};
