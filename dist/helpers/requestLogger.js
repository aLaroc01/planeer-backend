"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * Request Logger Middleware
 * - সব incoming API request log করবে
 * - route, method, body, query log হবে
 */
const requestLogger = (req, res, next) => {
    logger_1.default.info("Incoming request", {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query
    });
    next();
};
exports.requestLogger = requestLogger;
