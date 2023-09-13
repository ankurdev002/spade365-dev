"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Offer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      Offer.hasMany(models.Deposit, {
        foreignKey: "offer_id",
        as: "deposits",
      });
    }
  }
  Offer.init(
    {
      name: DataTypes.STRING,
      description: DataTypes.TEXT,
      type: DataTypes.STRING, // deposit, withdrawal, cashback etc
      value: DataTypes.INTEGER,
      is_percentage: { type: DataTypes.BOOLEAN, defaultValue: false },
      min_deposit: { type: DataTypes.INTEGER, defaultValue: 0 },
      max_credit: { type: DataTypes.INTEGER, defaultValue: 10000 },
      games_cutoff: { type: DataTypes.INTEGER, defaultValue: 0 }, // minimum number of games/bets user needs to place to avail this offer
      code: DataTypes.STRING,
      valid_till: DataTypes.DATE,
      is_bonus: { type: DataTypes.BOOLEAN, defaultValue: false }, // if true, then offer is a bonus and will be stored in user.bonus else will be added to user.credit/wallet
      is_reusable: { type: DataTypes.BOOLEAN, defaultValue: false }, // if true, then offer can be used multiple times
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // soft delete
    },
    {
      sequelize,
      modelName: "Offer",
    }
  );
  return Offer;
};
