import express from "express";
import {
  createChecklist,
  getChecklistByUser,
  updateChecklist,
  deleteChecklist,
} from "./checklist.controller";
import { auth } from './../../middleware/auth.middleware';

const router = express.Router();

router.post("/createChecklist", auth, createChecklist);
router.get("/getChecklist/:id", auth, getChecklistByUser);
router.patch("/checklistUpdate/:id", auth, updateChecklist);
router.delete("/checklistDelete/:id", auth, deleteChecklist);

export const ChecklistRoutes = router;