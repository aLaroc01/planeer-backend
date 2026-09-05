import { Router } from "express";
import {
  createProxyRelationship,
  deleteProxyRelationship,
  getProxyRelationshipById,
  getProxyRelationships,
  requestEmergencyRelease,
  reviewEmergencyRelease,
  revokeEmergencyRelease,
  updateProxyRelationship,
} from "./proxyRelationship.controller";

const router = Router();

router.post("/", createProxyRelationship);
router.get("/", getProxyRelationships);
router.get("/:id", getProxyRelationshipById);
router.put("/:id", updateProxyRelationship);
router.delete("/:id", deleteProxyRelationship);
router.post("/:id/request-release", requestEmergencyRelease);
router.post("/:id/review-release", reviewEmergencyRelease);
router.post("/:id/revoke-release", revokeEmergencyRelease);

export default router;