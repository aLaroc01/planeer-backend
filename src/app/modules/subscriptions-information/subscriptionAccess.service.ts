// app/modules/subscriptions-information/subscriptionAccess.service.ts
import { Types } from "mongoose";
import { Subscription } from "./subscriptions.model";
import Connection from "../connections/connection.model";

const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
  "trialing",
  "active",
]);

export const getSubscriptionAccess = async (userId: string) => {
  const objectId = new Types.ObjectId(userId);
  const now = new Date();

  const entitledSubscription = await Subscription.exists({
    userId: objectId,
    stripeStatus: {
      $in: [...ENTITLED_SUBSCRIPTION_STATUSES],
    },
    currentPeriodEnd: { $gt: now },
  });

  const acceptedProxyConnections = await Connection.countDocuments({
    proxyUserId: objectId,
    status: "active", // Change this if your accepted status is named differently.
  });

  return {
    isEntitledGrantor: Boolean(entitledSubscription),
    isProxy: acceptedProxyConnections > 0,

    canManageOwnContent: Boolean(entitledSubscription),
    canAddProxyConnections: Boolean(entitledSubscription),

    canViewAccountStatus: true,
    canEditOwnProfile: true,
    canViewSharedGrantorContent: acceptedProxyConnections > 0,
  };
};