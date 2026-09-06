"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAuditHistory = void 0;
const auditLog_service_1 = require("./auditLog.service");
const getUserAuditHistory = async (req, res) => {
    try {
        const result = await (0, auditLog_service_1.getUserAuditHistoryService)(req.params.userId, req.user?.role);
        const statusCode = result.status === "success" ? 200 : 403;
        res.status(statusCode).json(result);
    }
    catch (error) {
        res.status(500).json({
            status: "failed",
            message: error.message || "Unable to retrieve audit history",
        });
    }
};
exports.getUserAuditHistory = getUserAuditHistory;
