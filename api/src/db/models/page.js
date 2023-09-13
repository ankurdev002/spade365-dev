"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Page extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Page.init(
    {
      name: DataTypes.STRING,
      slug: DataTypes.STRING,
      description: DataTypes.TEXT,
      keywords: DataTypes.TEXT,
      page_content: DataTypes.TEXT,
      is_visible: DataTypes.BOOLEAN,
      is_deleted: DataTypes.BOOLEAN, // soft delete
    },
    {
      sequelize,
      modelName: "Page",
    }
  );
  return Page;
};
