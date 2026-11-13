"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionAccess = void 0;
// app/modules/subscriptions-information/subscriptionAccess.service.ts
const mongoose_1 = require("mongoose");
const subscriptions_model_1 = require("./subscriptions.model");
const connection_model_1 = __importDefault(require("../connections/connection.model"));
const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
    "trialing",
    "active",
]);
const getSubscriptionAccess = async (userId) => {
    const objectId = new mongoose_1.Types.ObjectId(userId);
    const now = new Date();
    const entitledSubscription = await subscriptions_model_1.Subscription.exists({
        userId: objectId,
        stripeStatus: {
            $in: [...ENTITLED_SUBSCRIPTION_STATUSES],
        },
        currentPeriodEnd: { $gt: now },
    });
    const acceptedProxyConnections = await connection_model_1.default.countDocuments({
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
exports.getSubscriptionAccess = getSubscriptionAccess;
