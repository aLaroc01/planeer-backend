// app/middleware/requireEntitledGrantor.ts
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getSubscriptionAccess } from
  "../modules/subscriptions-information/subscriptionAccess.service";

export const requireEntitledGrantor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Authentication is required.",
    });
  }

  const access = await getSubscriptionAccess(userId);

  if (!access.isEntitledGrantor) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      code: "SUBSCRIPTION_REQUIRED",
      message:
        "An active subscription or trial is required to manage account information.",
    });
  }

  return next();
};