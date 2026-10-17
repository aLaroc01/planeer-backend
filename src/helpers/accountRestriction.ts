import { restoreExpiredArchive } from "./restoreExpiredArchive";
import { User } from "../app/modules/auth/user.model";
import { PlanStatus } from "../app/modules/auth/user.interface";

interface RestrictionResult {
  allowed: boolean;
  message: string;
}

export const assertUserNotRestricted = async (
  userId: string | undefined,
): Promise<RestrictionResult> => {
  if (!userId) {
    return {
      allowed: false,
      message: "Unauthorized",
    };
  }

  await restoreExpiredArchive(userId);

  const user = await User.findById(userId)
    .select("planStatus");

  if (!user) {
    return {
      allowed: false,
      message: "User not found",
    };
  }

  if (
    user.planStatus === PlanStatus.ARCHIVED ||
    user.planStatus === PlanStatus.FROZEN
  ) {
    return {
      allowed: false,
      message:
        "This account is restricted. Please contact support to request a review.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
};