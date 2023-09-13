import dotenv from "dotenv";
dotenv.config();
import config from "../../config/index.js";

export default {
  development: {
    username: config.dbUsername,
    password: config.dbSecret,
    database: config.dbName,
    dialect: "postgres",
    dialectOptions: {
      useUTC: false, // for reading from database
    },
    timezone: '+05:30', // for writing to database
  },
  test: {
    username: config.dbUsername,
    password: config.dbSecret,
    database: config.dbName,
    dialect: "postgres",
    dialectOptions: {
      useUTC: false, // for reading from database
    },
    timezone: '+05:30', // for writing to database
  },
  production: {
    username: config.dbUsername,
    password: config.dbSecret,
    database: config.dbName,
    dialect: "postgres",
    dialectOptions: {
      useUTC: false, // for reading from database
    },
    timezone: '+05:30', // for writing to database
  },
};
