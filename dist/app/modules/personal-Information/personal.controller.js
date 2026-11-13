"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPersonalData = exports.UpdatePersonal = exports.GetPersonalForProxy = void 0;
const personal_service_1 = require("./personal.service");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const GetPersonalForProxy = async (req, res) => {
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
        const personal = await (0, personal_service_1.getPersonalForProxy)(proxyUserId, grantorId);
        return res.status(200).json(personal);
    }
    catch (error) {
        const statusCode = error?.statusCode || 500;
        if (statusCode >= 500) {
            console.error("Unable to get proxy personal information:", error);
        }
        return res.status(statusCode).json({
            status: "failed",
            message: error?.message ||
                "Unable to load personal information",
        });
    }
};
exports.GetPersonalForProxy = GetPersonalForProxy;
const UpdatePersonal = async (req, res) => {
    try {
        const result = await (0, personal_service_1.PersonalUpdateService)(req);
        return res.status(result.status === "success" ? 200 : 400).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.UpdatePersonal = UpdatePersonal;
const GetPersonalData = async (req, res) => {
    try {
        const result = await (0, personal_service_1.PersonalGetService)(req);
        return res.status(result.status === "success" ? 200 : 400).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.GetPersonalData = GetPersonalData;
