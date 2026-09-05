import { Router } from "express";
import { auth, isAdminOrSuperAdmin } from './../../middleware/auth.middleware';
import {
  createSupportTicket,
  getAllSupportTickets,
  getMySupportTickets,
  updateSupportTicketAsAdmin,
} from "./support.controller";
// import { isAdminOrSuperAdmin } from "../../middleware/auth.middleware";

const router = Router();

// Logged-in users: create tickets and view only their own.
router.post("/support", auth, createSupportTicket);
router.get("/support/my", auth, getMySupportTickets);

// Dashboard admins: view and update every ticket.
router.get(
  "/support/admin",
  auth,
  isAdminOrSuperAdmin,
  getAllSupportTickets
);

router.patch(
  "/support/admin/:ticketId",
  auth,
  isAdminOrSuperAdmin,
  updateSupportTicketAsAdmin
);

export const SupportRoutes = router;