import { Router } from "express";
import { getUserAuditHistory } from "./auditLog.controller";
import { auth } from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/user/:userId",
  auth,
  getUserAuditHistory
);

export const AuditLogRoutes = router;