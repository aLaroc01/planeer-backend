import express from "express";
import {
  createChecklist,
  getChecklistByCurrentUser,
  updateChecklist,
  GetChecklistForProxy,
  deleteChecklist,
} from "./checklist.controller";
import { auth } from './../../middleware/auth.middleware';

const router = express.Router();

router.post("/createChecklist", auth, createChecklist);
router.get("/getChecklist", auth, getChecklistByCurrentUser);
router.patch("/checklistUpdate", auth, updateChecklist);
router.delete("/checklistDelete", auth, deleteChecklist);
router.get("/GetChecklistForProxy/:grantorId", auth, GetChecklistForProxy);

export const ChecklistRoutes = router;