import jwt from "jsonwebtoken";
import config from "../config/index.js";
import db from "../db/models/index.js";
import { logger } from "./logger.js";
const USER = db.User;

export const generateToken = async (user) => {
  try {
    const token = jwt.sign(
      {
        // username: user.username,
        id: user.id,
        // role: user.role,
        // phone: user.phone,
      },
      config.sessionSecret,
      { expiresIn: "7d" } // 7 days
    );
    await user.update({ token }); // disable this line to allow login from multiple devices
    return token;
  } catch (error) {
    logger.error(error);
    throw new Error("generate token failed:", error.message);
  }
};

export const findUserByToken = async (token) => {
  try {
    const jwtData = jwt.verify(token, config.sessionSecret);
    if (!jwtData.id) return null;
    // find user, select all except password and token
    const user = await USER.findOne({
      where: {
        id: jwtData.id,
        token: token, // disable this line to allow login from multiple devices
      },
    });
    return user;
  } catch (error) {
    logger.error(error);
    throw new Error("findUserByToken failed");
  }
};

export const deleteToken = async (user) => {
  // remove this function when we remove the token saving in database. We will only delete the token from user browser on logout.
  try {
    await user.update({ token: null });
    return true;
  } catch (error) {
    throw new Error("delete token failed:", error.message);
  }
};
