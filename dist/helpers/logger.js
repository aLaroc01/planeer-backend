"use strict";
// import winston from "winston";
// import path from "path";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const logDir = path.join(process.cwd(), "logs");
// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
//     winston.format.errors({ stack: true }),
//     winston.format.json()
//   ),
//   transports: [
//     // error log
//     new winston.transports.File({
//       filename: `${logDir}/error.log`,
//       level: "error",
//     }),
//     // success + info log
//     new winston.transports.File({
//       filename: `${logDir}/combined.log`,
//     }),
//   ],
// });
// // development এ console এ দেখানোর জন্য
// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.simple(),
//     })
//   );
// }
// export default logger;
// logger.ts
// helpers/logger.ts
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const isProd = process.env.NODE_ENV === "production";
// Transports array
const transports = [
    // Always log to console
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }),
];
// Local file logging only in development
if (!isProd) {
    const logDir = path_1.default.join(process.cwd(), "logs");
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, "error.log"),
        level: "error",
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.json()),
    }));
    transports.push(new winston_1.default.transports.File({
        filename: path_1.default.join(logDir, "combined.log"),
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.json()),
    }));
}
// Create logger
const logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
    transports,
});
exports.default = logger;
