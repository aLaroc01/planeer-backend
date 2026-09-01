import express from "express";
import { auth, isAdmin } from "../../middleware/auth.middleware";
import { GetAllReportsController, getReportStatusCount, ReportController, updateReportController } from "./report.controller";






const router = express.Router();

// create Financial Information 
router.post("/create-report",auth,ReportController)
router.get("/total-reports",auth,isAdmin, getReportStatusCount);
router.get("/all-reports", auth,isAdmin,GetAllReportsController);
// Only admins can update reports
router.put("/reports/:id", auth,isAdmin, updateReportController);

















export const ReportRoutes = router;