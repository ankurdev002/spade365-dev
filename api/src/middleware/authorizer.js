import { findUserByToken } from "../utils/jwt";
import { logger } from "../utils/logger";

export default async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers["x-access-token"];
    if (!token) return res.sendStatus(400);
    const user = await findUserByToken(token);
    if (!user) {
      res.clearCookie("token"); // fix for when user logs in from different device/browser
      return res.status(401).send("authentication error");
    }

    // check if user is banned
    if (user.is_banned || user.is_deleted) {
      logger.warn(`user is banned: ${user.id}`);
      res.clearCookie("token"); // clear token cookie from user browser
      return res.status(403).send("user is banned");
    };

    const user_agent = user.role ? "" : req.headers["user-agent"] || ""; // dont save user-agent for admins
    const ip = user.role ? "" : req.headers["x-forwarded-for"]?.split(",")[0] || req.headers["x-forwarded-for"] || req.ip; // dont save ip for admins
    // update user.lastActive to current time
    await user.update({
      lastActive: new Date(),
      user_agent,
      ip,
    });
    // add user to request
    req.user = user;
    // next
    next();
  } catch (error) {
    logger.error("authorizer failed", error.message);
    logger.verbose(error);
    next("authentication failed");
  }
};
