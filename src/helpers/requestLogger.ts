import { Request, Response, NextFunction } from "express";
import logger from "./logger";


/**
 * Request Logger Middleware
 * - সব incoming API request log করবে
 * - route, method, body, query log হবে
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query
  });

  next();
};