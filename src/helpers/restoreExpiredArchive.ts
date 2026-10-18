import mongoose from "mongoose";
import { User } from "../app/modules/auth/user.model";
import { PlanStatus } from "../app/modules/auth/user.interface";
import {
  ArchiveRequest,
  ArchiveRequestStatus,
  ArchiveEndReason,
} from "../app/modules/archive-request/archive-request.model";
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
        "_id connectionId grantorId reason status " +
            "requesterNote createdAt reviewedAt " +
            "archiveType archiveExpiresAt archiveEndedAt archiveEndReason",
        )
      .session(session);

    if (!user) return false;

    if (!user.activeArchiveRequestId) {
      throw new Error(
        "Expired archive is missing its request link. Reconciliation is required.",
      );
    }

    const archiveRequest = await ArchiveRequest.findOne({
      _id: user.activeArchiveRequestId,
      grantorId: user._id,
      status: ArchiveRequestStatus.APPROVED,
      archiveType: "temporary",
      archiveExpiresAt: user.archiveExpiresAt,
      archiveEndedAt: null,
      archiveEndReason: null,
    }).session(session);

    if (!archiveRequest) {
      throw new Error(
        "Expired archive does not match its approved request. Reconciliation is required.",
      );
    }

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
        activeArchiveRequestId: archiveRequest._id,
      },
      {
        $set: {
          planStatus: restoredStatus,
          archiveExpiresAt: null,
          activeArchiveRequestId: null,
          planStatusChangedAt: now,
          planStatusChangedBy: null,
        },
      },
      {
        session,
        runValidators: true,
      },
    );

    if (result.modifiedCount !== 1) {
      throw new Error(
        "Archive state changed during restoration.",
      );
    }

    archiveRequest.archiveEndedAt = now;
    archiveRequest.archiveEndReason = ArchiveEndReason.EXPIRED;

    await archiveRequest.save({ session });

    // Add your system audit-log write here using the same session.

    return true;
  });
};