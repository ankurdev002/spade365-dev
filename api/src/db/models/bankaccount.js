"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class BankAccount extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // BankAccount belongs to User
      BankAccount.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });

      BankAccount.hasMany(models.WithdrawAccounts);
      BankAccount.hasMany(models.Deposit);
    }
  }
  BankAccount.init(
    {
      user_id: DataTypes.INTEGER,
      type: DataTypes.STRING, // savings, current, upi etc
      method: DataTypes.STRING, // imps, neft, upi etc
      ifsc: DataTypes.STRING,
      name: DataTypes.STRING, // name of the bank
      account: DataTypes.STRING, // account number
      account_name: DataTypes.STRING, // name of the account holder
      min_amount: DataTypes.INTEGER, // minimum amount that this account accepts
      max_amount: DataTypes.INTEGER, // maximum amount that this account accepts
      image: { type: DataTypes.TEXT, defaultValue: null }, // base64 img. used for upi qr code
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // Soft deleting bank accounts for record keeping. Admins can see deleted accounts too. We'll not be allowing anyone to edit the bank account after adding it as it will be used for transactions, deposits & withdrawals. Deleting will create a mess.
      for_admin: { type: DataTypes.BOOLEAN, defaultValue: false }, // if true, this account is for admin use only, like showing it on user deposit page for sending money to admin. for_admin accounts will be used for deposit, so they are shown to users too
    },
    {
      sequelize,
      modelName: "BankAccount",
    }
  );
  return BankAccount;
};
