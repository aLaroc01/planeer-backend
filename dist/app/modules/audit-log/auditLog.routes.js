"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogRoutes = void 0;
const express_1 = require("express");
const auditLog_controller_1 = require("./auditLog.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/user/:userId", auth_middleware_1.auth, auditLog_controller_1.getUserAuditHistory);
exports.AuditLogRoutes = router;
