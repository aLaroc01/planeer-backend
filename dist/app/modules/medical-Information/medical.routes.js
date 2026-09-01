"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const medical_controller_1 = require("./medical.controller");
const router = express_1.default.Router();
// create Financial Information 
router.post("/CreateMedical", auth_middleware_1.auth, medical_controller_1.UpdateMedical);
//update Medical Information
router.post("/UpdateMedical", auth_middleware_1.auth, medical_controller_1.UpdateMedical);
router.get("/GetMedicalData", auth_middleware_1.auth, medical_controller_1.GetMedicalData);
exports.medicalRoutes = router;
