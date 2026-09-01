import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { checkActiveSubscription } from "../modules/subscriptions-information/subscriptions.service";
import { NextFunction, Request, Response } from "express";

export const subscriptionGuard = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const userId = req.user?._id; // auth middleware থেকে

    if (!userId) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }

    const isActive = await checkActiveSubscription(userId);

    if (!isActive) {
        throw new AppError(
            StatusCodes.FORBIDDEN,
            'Subscription expired or inactive'
        );
    }

    next();
};