"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEntitledGrantor = void 0;
const http_status_codes_1 = require("http-status-codes");
const subscriptionAccess_service_1 = require("../modules/subscriptions-information/subscriptionAccess.service");
const accountRestriction_1 = require("../../helpers/accountRestriction");
const requireEntitledGrantor = async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication is required.",
        });
    }
    const restriction = await (0, accountRestriction_1.assertUserNotRestricted)(userId);
    if (!restriction.allowed) {
        return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
            success: false,
            code: "ACCOUNT_RESTRICTED",
            message: restriction.message,
        });
    }
    const access = await (0, subscriptionAccess_service_1.getSubscriptionAccess)(userId);
    if (!access.isEntitledGrantor) {
        return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
            success: false,
            code: "SUBSCRIPTION_REQUIRED",
            message: "An active subscription or trial is required to manage account information.",
        });
    }
    return next();
};
exports.requireEntitledGrantor = requireEntitledGrantor;
