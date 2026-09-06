"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const support_controller_1 = require("./support.controller");
// import { isAdminOrSuperAdmin } from "../../middleware/auth.middleware";
const router = (0, express_1.Router)();
// Logged-in users: create tickets and view only their own.
router.post("/support", auth_middleware_1.auth, support_controller_1.createSupportTicket);
router.get("/support/my", auth_middleware_1.auth, support_controller_1.getMySupportTickets);
// Dashboard admins: view and update every ticket.
router.get("/support/admin", auth_middleware_1.auth, auth_middleware_1.isAdminOrSuperAdmin, support_controller_1.getAllSupportTickets);
router.patch("/support/admin/:ticketId", auth_middleware_1.auth, auth_middleware_1.isAdminOrSuperAdmin, support_controller_1.updateSupportTicketAsAdmin);
exports.SupportRoutes = router;
