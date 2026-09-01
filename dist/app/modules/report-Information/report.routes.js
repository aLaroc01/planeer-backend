"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const report_controller_1 = require("./report.controller");
const router = express_1.default.Router();
// create Financial Information 
router.post("/create-report", auth_middleware_1.auth, report_controller_1.ReportController);
router.get("/total-reports", auth_middleware_1.auth, auth_middleware_1.isAdmin, report_controller_1.getReportStatusCount);
router.get("/all-reports", auth_middleware_1.auth, auth_middleware_1.isAdmin, report_controller_1.GetAllReportsController);
// Only admins can update reports
router.put("/reports/:id", auth_middleware_1.auth, auth_middleware_1.isAdmin, report_controller_1.updateReportController);
exports.ReportRoutes = router;
