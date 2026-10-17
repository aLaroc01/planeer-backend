import mongoose from "mongoose";
import { User } from "../app/modules/auth/user.model";
import { PlanStatus } from "../app/modules/auth/user.interface";
import { Subscription } from "../app/modules/subscriptions-information/subscriptions.model";

export const restoreExpiredArchive = async (
  userId: string,
): Promise<boolean> => {
  return mongoose.connection.transaction(async (session) => {
    const now = new Date();

    const user = await User.findOne({
      _id: userId,
      planStatus: PlanStatus.ARCHIVED,
      archiveExpiresAt: {
        $type: "date",
        $lte: now,
      },
    })
      .select(
        "planStatus archiveExpiresAt planStatusChangedAt",
      )
      .session(session);

    if (!user) return false;

    // Same entitlement criteria as getSubscriptionAccess.
    // Prefer an active subscription over a trial if both exist.
    const activeSubscription = await Subscription.exists({
      userId: user._id,
      stripeStatus: "active",
      currentPeriodEnd: { $gt: now },
    }).session(session);

    const trialSubscription = activeSubscription
      ? null
      : await Subscription.exists({
          userId: user._id,
          stripeStatus: "trialing",
          currentPeriodEnd: { $gt: now },
        }).session(session);

    const restoredStatus = activeSubscription
      ? PlanStatus.ACTIVE
      : trialSubscription
        ? PlanStatus.TRIALING
        : PlanStatus.SUBSCRIPTION_REQUIRED;

    const result = await User.updateOne(
      {
        _id: user._id,
        planStatus: PlanStatus.ARCHIVED,
        archiveExpiresAt: user.archiveExpiresAt,
        planStatusChangedAt: user.planStatusChangedAt ?? null,
      },
      {
        $set: {
          planStatus: restoredStatus,
          archiveExpiresAt: null,
          planStatusChangedAt: now,
          planStatusChangedBy: null,
        },
      },
      {
        session,
        runValidators: true,
      },
    );

    return result.modifiedCount === 1;
  });
};