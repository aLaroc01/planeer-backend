"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFinancialForProxy = exports.GetFinancialData = exports.UpdateFinancial = void 0;
const financial_service_1 = require("./financial.service");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const UpdateFinancial = async (req, res) => {
    let result = await (0, financial_service_1.FinancialUpdateService)(req);
    res.json(result);
};
exports.UpdateFinancial = UpdateFinancial;
const GetFinancialData = async (req, res) => {
    const result = await (0, financial_service_1.FinancialGetService)(req);
    return res.status(200).json(result);
};
exports.GetFinancialData = GetFinancialData;
const GetFinancialForProxy = async (req, res) => {
    const proxyUserId = (0, proxyAccess_service_1.getAuthenticatedUserId)(req.user);
    const grantorId = String(req.params.grantorId || "").trim();
    if (!proxyUserId) {
        return res.status(401).json({
            status: "failed",
            message: "Unauthorized access",
        });
    }
    if (!grantorId) {
        return res.status(400).json({
            status: "failed",
            message: "Grantor ID is required",
        });
    }
    try {
        const financial = await (0, financial_service_1.getFinancialForProxy)(proxyUserId, grantorId);
        return res.status(200).json(financial);
    }
    catch (error) {
        const statusCode = error?.statusCode || 500;
        if (statusCode >= 500) {
            console.error("Unable to get proxy financial information:", error);
        }
        return res.status(statusCode).json({
            status: "failed",
            message: error?.message ||
                "Unable to load financial information",
        });
    }
};
exports.GetFinancialForProxy = GetFinancialForProxy;
