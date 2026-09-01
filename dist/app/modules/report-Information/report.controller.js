"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportController = exports.getReportStatusCount = exports.GetAllReportsController = exports.ReportController = void 0;
const report_service_1 = require("./report.service");
const ReportController = async (req, res) => {
    let result = await (0, report_service_1.ReportService)(req, res);
    res.json(result);
};
exports.ReportController = ReportController;
const GetAllReportsController = async (req, res) => {
    const result = await (0, report_service_1.GetAllReportsService)();
    res.json(result);
};
exports.GetAllReportsController = GetAllReportsController;
const getReportStatusCount = async (req, res) => {
    try {
        const result = await (0, report_service_1.getReportStatusCountService)();
        if (result.status) {
            res.status(200).json({ status: "success", data: result.data });
        }
        else {
            res.status(500).json({ status: "error", message: "Failed to fetch report counts", error: result.data });
        }
    }
    catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
exports.getReportStatusCount = getReportStatusCount;
const updateReportController = async (req, res) => {
    try {
        const result = await (0, report_service_1.updateReportService)(req);
        if (result.status) {
            res.status(200).json({ status: "success", message: result.message });
        }
        else {
            res.status(404).json({ status: "error", message: result.message || "Failed to update report", error: result.data });
        }
    }
    catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
exports.updateReportController = updateReportController;
