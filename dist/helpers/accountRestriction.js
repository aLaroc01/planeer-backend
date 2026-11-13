"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertUserNotRestricted = void 0;
const restoreExpiredArchive_1 = require("./restoreExpiredArchive");
const user_model_1 = require("../app/modules/auth/user.model");
const user_interface_1 = require("../app/modules/auth/user.interface");
const assertUserNotRestricted = async (userId) => {
    if (!userId) {
        return {
            allowed: false,
            message: "Unauthorized",
        };
    }
    await (0, restoreExpiredArchive_1.restoreExpiredArchive)(userId);
    const user = await user_model_1.User.findById(userId)
        .select("planStatus");
    if (!user) {
        return {
            allowed: false,
            message: "User not found",
        };
    }
    if (user.planStatus === user_interface_1.PlanStatus.ARCHIVED ||
        user.planStatus === user_interface_1.PlanStatus.FROZEN) {
        return {
            allowed: false,
            message: "This account is restricted. Please contact support to request a review.",
        };
    }
    return {
        allowed: true,
        message: "",
    };
};
exports.assertUserNotRestricted = assertUserNotRestricted;
