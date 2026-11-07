"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreExpiredArchive = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../app/modules/auth/user.model");
const user_interface_1 = require("../app/modules/auth/user.interface");
const archive_request_model_1 = require("../app/modules/archive-request/archive-request.model");
const subscriptions_model_1 = require("../app/modules/subscriptions-information/subscriptions.model");
const restoreExpiredArchive = async (userId) => {
    return mongoose_1.default.connection.transaction(async (session) => {
        const now = new Date();
        const user = await user_model_1.User.findOne({
            _id: userId,
            planStatus: user_interface_1.PlanStatus.ARCHIVED,
            archiveExpiresAt: {
                $type: "date",
                $lte: now,
            },
        })
            .select("_id planStatus archiveExpiresAt " +
            "activeArchiveRequestId planStatusChangedAt")
            .session(session);
        if (!user)
            return false;
        if (!user.activeArchiveRequestId) {
            throw new Error("Expired archive is missing its request link. Reconciliation is required.");
        }
        const archiveRequest = await archive_request_model_1.ArchiveRequest.findOne({
            _id: user.activeArchiveRequestId,
            grantorId: user._id,
            status: archive_request_model_1.ArchiveRequestStatus.APPROVED,
            archiveType: "temporary",
            archiveExpiresAt: user.archiveExpiresAt,
            archiveEndedAt: null,
            archiveEndReason: null,
        }).session(session);
        if (!archiveRequest) {
            throw new Error("Expired archive does not match its approved request. Reconciliation is required.");
        }
        const activeSubscription = await subscriptions_model_1.Subscription.exists({
            userId: user._id,
            stripeStatus: "active",
            currentPeriodEnd: { $gt: now },
        }).session(session);
        const trialSubscription = activeSubscription
            ? null
            : await subscriptions_model_1.Subscription.exists({
                userId: user._id,
                stripeStatus: "trialing",
                currentPeriodEnd: { $gt: now },
            }).session(session);
        const restoredStatus = activeSubscription
            ? user_interface_1.PlanStatus.ACTIVE
            : trialSubscription
                ? user_interface_1.PlanStatus.TRIALING
                : user_interface_1.PlanStatus.SUBSCRIPTION_REQUIRED;
        const result = await user_model_1.User.updateOne({
            _id: user._id,
            planStatus: user_interface_1.PlanStatus.ARCHIVED,
            archiveExpiresAt: user.archiveExpiresAt,
            planStatusChangedAt: user.planStatusChangedAt ?? null,
            activeArchiveRequestId: archiveRequest._id,
        }, {
            $set: {
                planStatus: restoredStatus,
                archiveExpiresAt: null,
                activeArchiveRequestId: null,
                planStatusChangedAt: now,
                planStatusChangedBy: null,
            },
        }, {
            session,
            runValidators: true,
        });
        if (result.modifiedCount !== 1) {
            throw new Error("Archive state changed during restoration.");
        }
        archiveRequest.archiveEndedAt = now;
        archiveRequest.archiveEndReason = archive_request_model_1.ArchiveEndReason.EXPIRED;
        archiveRequest.archiveEndedBy = null;
        archiveRequest.archiveEndNote = "";
        await archiveRequest.save({ session });
        // Add your system audit-log write here using the same session.
        return true;
    });
};
exports.restoreExpiredArchive = restoreExpiredArchive;
