"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportService = exports.getReportStatusCountService = exports.GetAllReportsService = exports.ReportService = void 0;
const report_model_1 = require("./report.model");
const ReportService = async (req, res) => {
    try {
        let userID = req.user?.id;
        const { problemtitle, desdetails, status, } = req.body;
        const newReport = await report_model_1.ReportModel.create({
            problemtitle,
            desdetails,
            status,
            userID: userID,
        });
        return {
            status: true,
            message: "Report created successfully",
            data: newReport,
        };
    }
    catch (error) {
        return {
            status: false,
            message: "Failed to create report",
            data: error,
        };
    }
};
exports.ReportService = ReportService;
const GetAllReportsService = async () => {
    try {
        const reports = await report_model_1.ReportModel.find().populate("userID", "firstName lastName email imgUrl  ");
        return {
            status: true,
            message: "All reports fetched successfully",
            data: reports
        };
    }
    catch (error) {
        return {
            status: false,
            message: "Failed to fetch reports",
            data: error
        };
    }
};
exports.GetAllReportsService = GetAllReportsService;
const getReportStatusCountService = async () => {
    try {
        const [progressCount, completedCount, totalCount] = await Promise.all([
            report_model_1.ReportModel.countDocuments({ status: "Progress" }),
            report_model_1.ReportModel.countDocuments({ status: "Completed" }),
            report_model_1.ReportModel.countDocuments() // total reports
        ]);
        return {
            status: true,
            data: {
                progress: progressCount,
                completed: completedCount,
                totalReports: totalCount
            }
        };
    }
    catch (error) {
        return { status: false, data: error };
    }
};
exports.getReportStatusCountService = getReportStatusCountService;
const updateReportService = async (req) => {
    try {
        const reportId = req.params.id;
        const requestBody = req.body;
        const report = await report_model_1.ReportModel.findById(reportId);
        if (!report) {
            return { status: false, message: "Report not found" };
        }
        report.problemtitle = requestBody.problemtitle ?? report.problemtitle;
        report.desdetails = requestBody.desdetails ?? report.desdetails;
        report.status = requestBody.status ?? report.status;
        await report.save();
        return { status: true, message: "Report updated successfully" };
    }
    catch (error) {
        return { status: false, data: error };
    }
};
exports.updateReportService = updateReportService;
