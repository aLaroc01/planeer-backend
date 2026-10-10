import { NextFunction, Request, Response } from "express";
import { User } from "../modules/auth/user.model";
import { PlanStatus } from "../modules/auth/user.interface";

export const planAccessGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await User.findById(userId)
      .select("planStatus")
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (
      user.planStatus === PlanStatus.FROZEN ||
      user.planStatus === PlanStatus.ARCHIVED
    ) {
      res.status(403).json({
        success: false,
        code: "ACCOUNT_RESTRICTED",
        message:
          user.planStatus === PlanStatus.FROZEN
            ? "Your plan is currently frozen."
            : "Your plan is currently archived.",
        data: {
          planStatus: user.planStatus,
        },
      });
      return;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};