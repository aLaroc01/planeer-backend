import express from "express";
import {
  createChecklist,
  getChecklistByCurrentUser,
  updateChecklist,
  GetChecklistForProxy,
  deleteChecklist,
} from "./checklist.controller";
import { auth } from './../../middleware/auth.middleware';
import { requireEntitledGrantor } from './../../middleware/requireEntitledGrantor';


const router = express.Router();

router.post("/createChecklist", auth, requireEntitledGrantor, createChecklist);
router.get("/getChecklist", auth, requireEntitledGrantor, getChecklistByCurrentUser);
router.patch("/checklistUpdate", auth, requireEntitledGrantor, updateChecklist);
router.delete("/checklistDelete", auth, requireEntitledGrantor, deleteChecklist);
router.get("/GetChecklistForProxy/:grantorId", auth, GetChecklistForProxy);

export const ChecklistRoutes = router;