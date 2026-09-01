"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../../helpers/logger"));
// const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error';
//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message,
//         err: err,
//         stack: err.stack
//     })
// }
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    // 🔹 Winston log
    logger_1.default.error(err.message, {
        statusCode: err.statusCode,
        status: err.status,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl
    });
    // 🔹 Response API (stack trace only in development)
    const responseStack = process.env.NODE_ENV === "production" ? undefined : err.stack;
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: responseStack
    });
};
exports.default = errorHandler;
