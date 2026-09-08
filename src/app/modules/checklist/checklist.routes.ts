import express from "express";
import {
  createChecklist,
  getChecklistByCurrentUser,
  updateChecklist,
  deleteChecklist,
} from "./checklist.controller";
import { auth } from './../../middleware/auth.middleware';

const router = express.Router();

router.post("/createChecklist", auth, createChecklist);
router.get("/getChecklist", auth, getChecklistByCurrentUser);
router.patch("/checklistUpdate", auth, updateChecklist);
router.delete("/checklistDelete", auth, deleteChecklist);

export const ChecklistRoutes = router;