import { Router } from "express";
import { auth, isAdminOrSuperAdmin, } from "../../middleware/auth.middleware";
import { createSupportRequest, listSupportRequests, completeSupportRequest, } from "./support-request.controller";

const router = Router();

// Public: users must be able to report account-access problems
// even when they cannot sign in.
router.post(
  "/support-requests",
  createSupportRequest,
);

// Dashboard admins: view all support requests.
router.get(
  "/support-requests",
  auth,
  isAdminOrSuperAdmin,
  listSupportRequests,
);

// Dashboard admins: mark a support request completed.
// Keep :id because the controller reads req.params.id.
router.patch(
  "/support-requests/:id/status",
  auth,
  isAdminOrSuperAdmin,
  completeSupportRequest,
);

export const SupportRequestRoutes = router;