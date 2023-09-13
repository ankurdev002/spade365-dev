import { logger } from "../utils/logger";

export default async (req, res, next) => {
  logger.verbose(`new request: ${req.url} from ${req.ip}`);
  //logger.info(res);
  next();
};
