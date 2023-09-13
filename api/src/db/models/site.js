"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Site extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Site.init(
    {
      key: DataTypes.STRING,
      value: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Site",
    }
  );
  return Site;
};
