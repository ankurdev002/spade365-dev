"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class GamingSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      GamingSession.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
      GamingSession.belongsTo(models.GameProvider, {
        foreignKey: "provider_id",
        as: "provider",
      });
    }
  }
  GamingSession.init(
    {
      user_id: DataTypes.INTEGER,
      provider_id: DataTypes.INTEGER,
      session_id: DataTypes.STRING,
      launch_url: DataTypes.STRING,
      timestamp: {
        type: "TIMESTAMP",
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      sequelize,
      modelName: "GamingSession",
    }
  );
  return GamingSession;
};
