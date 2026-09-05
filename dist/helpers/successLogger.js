"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSuccess = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * Success Logging Helper
 * - Controller এ API success হলে call করবে
 * - Combined log এ save হবে
 */
const logSuccess = (req, message, extra = {}) => {
    logger_1.default.info(message, {
        route: req.originalUrl,
        method: req.method,
        ...extra
    });
};
exports.logSuccess = logSuccess;
