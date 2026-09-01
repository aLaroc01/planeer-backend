import { Request } from "express";
import logger from "./logger";


/**
 * Success Logging Helper
 * - Controller এ API success হলে call করবে
 * - Combined log এ save হবে
 */
export const logSuccess = (req: Request, message: string, extra: object = {}) => {
  logger.info(message, {
    route: req.originalUrl,
    method: req.method,
    ...extra
  });
};