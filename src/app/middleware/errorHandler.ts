import { NextFunction, Request, Response } from "express";
import logger from "../../helpers/logger";

interface AppError extends Error{
    statusCode?: number;
    status?:string;
    isOperational?: boolean;
}

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


const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // 🔹 Winston log
    logger.error(err.message, {
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
}

export default errorHandler;


