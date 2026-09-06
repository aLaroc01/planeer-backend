"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChecklistRoutes = void 0;
const express_1 = __importDefault(require("express"));
const checklist_controller_1 = require("./checklist.controller");
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/createChecklist", auth_middleware_1.auth, checklist_controller_1.createChecklist);
router.get("/getChecklist/:id", auth_middleware_1.auth, checklist_controller_1.getChecklistByUser);
router.patch("/checklistUpdate/:id", auth_middleware_1.auth, checklist_controller_1.updateChecklist);
router.delete("/checklistDelete/:id", auth_middleware_1.auth, checklist_controller_1.deleteChecklist);
exports.ChecklistRoutes = router;
