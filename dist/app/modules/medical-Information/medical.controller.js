"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalData = exports.UpdateMedical = exports.GetMedicalForProxy = void 0;
const medical_service_1 = require("./medical.service");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const GetMedicalForProxy = async (req, res) => {
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
        const medical = await (0, medical_service_1.getMedicalForProxy)(proxyUserId, grantorId);
        return res.status(200).json(medical);
    }
    catch (error) {
        const statusCode = error?.statusCode || 500;
        if (statusCode >= 500) {
            console.error("Unable to get proxy medical information:", error);
        }
        return res.status(statusCode).json({
            status: "failed",
            message: error?.message ||
                "Unable to load medical information",
        });
    }
};
exports.GetMedicalForProxy = GetMedicalForProxy;
const UpdateMedical = async (req, res) => {
    let result = await (0, medical_service_1.MedicalUpdateService)(req);
    res.json(result);
};
exports.UpdateMedical = UpdateMedical;
const GetMedicalData = async (req, res) => {
    const result = await (0, medical_service_1.MedicalGetService)(req);
    return res.status(200).json(result);
};
exports.GetMedicalData = GetMedicalData;
