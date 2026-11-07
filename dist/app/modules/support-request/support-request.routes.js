"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequestRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const support_request_controller_1 = require("./support-request.controller");
const router = (0, express_1.Router)();
// Public: users must be able to report account-access problems
// even when they cannot sign in.
router.post("/support-requests", support_request_controller_1.createSupportRequest);
// Dashboard admins: view all support requests.
router.get("/support-requests", auth_middleware_1.auth, auth_middleware_1.isAdminOrSuperAdmin, support_request_controller_1.listSupportRequests);
// Dashboard admins: mark a support request completed.
// Keep :id because the controller reads req.params.id.
router.patch("/support-requests/:id/status", auth_middleware_1.auth, auth_middleware_1.isAdminOrSuperAdmin, support_request_controller_1.completeSupportRequest);
exports.SupportRequestRoutes = router;
