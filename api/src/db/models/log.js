"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
    class Log extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    Log.init(
        {
            type: DataTypes.STRING, // type of log: error, info, warning, etc
            message: DataTypes.TEXT('long'), // log message
        },
        {
            sequelize,
            modelName: "Log",
        }
    );
    return Log;
};
