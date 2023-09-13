"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class WithdrawAccounts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.fo
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // WithdrawAccounts belongs to User
      WithdrawAccounts.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      // WithdrawAccounts is related to BankAccount
      WithdrawAccounts.belongsTo(models.BankAccount, {
        foreignKey: "id",
        as: "bank_id",
      });

      WithdrawAccounts.hasMany(models.Withdrawals);
    }
  }
  WithdrawAccounts.init(
    {
      user_id: DataTypes.INTEGER,
      ifsc: DataTypes.STRING,
      bank_name: DataTypes.STRING,
      name: DataTypes.STRING,
      account: DataTypes.STRING,
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // soft delete
      last_used: { type: DataTypes.DATE, defaultValue: Date.now() },
    },
    {
      sequelize,
      modelName: "WithdrawAccounts",
    }
  );
  return WithdrawAccounts;
};
