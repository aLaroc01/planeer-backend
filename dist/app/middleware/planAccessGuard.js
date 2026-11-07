"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planAccessGuard = void 0;
const user_model_1 = require("../modules/auth/user.model");
const user_interface_1 = require("../modules/auth/user.interface");
const planAccessGuard = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        const user = await user_model_1.User.findById(userId)
            .select("planStatus")
            .lean();
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        if (user.planStatus === user_interface_1.PlanStatus.FROZEN ||
            user.planStatus === user_interface_1.PlanStatus.ARCHIVED) {
            res.status(403).json({
                success: false,
                code: "ACCOUNT_RESTRICTED",
                message: user.planStatus === user_interface_1.PlanStatus.FROZEN
                    ? "Your plan is currently frozen."
                    : "Your plan is currently archived.",
                data: {
                    planStatus: user.planStatus,
                },
            });
            return;
        }
        return next();
    }
    catch (error) {
        return next(error);
    }
};
exports.planAccessGuard = planAccessGuard;
