"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class GameProvider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GameProvider.init(
    {
      name: { type: DataTypes.STRING, defaultValue: "" }, // GameProvidername
      key: { type: DataTypes.STRING }, // can be operator key or partner key
      ip: { type: DataTypes.STRING, defaultValue: null }, // ip address of game provider
      lastAccess: { type: DataTypes.DATE, defaultValue: null }, // last access time
    },
    {
      sequelize,
      modelName: "GameProvider",
      //   defaultScope: {
      //     attributes: {
      //       exclude: ["token"],
      //     },
      //   },
    }
  );
  //   GameProvider.addScope("withSecret", {
  //     attributes: {
  //       include: ["token"],
  //     },
  //   });
  return GameProvider;
};
