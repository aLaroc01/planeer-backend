"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAuditHistoryService = void 0;
const auditLog_model_1 = require("./auditLog.model");
const user_interface_1 = require("../auth/user.interface");
const getUserAuditHistoryService = async (userId, requesterRole) => {
    if (requesterRole !== user_interface_1.Role.SUPER_ADMIN) {
        return {
            status: "failed",
            message: "Only a super admin can view audit history",
        };
    }
    const logs = await auditLog_model_1.AuditLog.find({
        targetUserId: userId,
    })
        .sort({ createdAt: -1 })
        .limit(25)
        .populate({
        path: "actorId",
        select: "email role",
    })
        .select("action changedFields before after actorId createdAt")
        .lean();
    return {
        status: "success",
        data: logs,
    };
};
exports.getUserAuditHistoryService = getUserAuditHistoryService;
