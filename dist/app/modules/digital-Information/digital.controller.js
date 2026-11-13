"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDigitalData = exports.DigitalInformation = exports.GetDigitalForProxy = void 0;
const digital_service_1 = require("./digital.service");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const GetDigitalForProxy = async (req, res) => {
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
        const digital = await (0, digital_service_1.getDigitalForProxy)(proxyUserId, grantorId);
        return res.status(200).json(digital);
    }
    catch (error) {
        const statusCode = error?.statusCode || 500;
        if (statusCode >= 500) {
            console.error("Unable to get proxy digital information:", error);
        }
        return res.status(statusCode).json({
            status: "failed",
            message: error?.message ||
                "Unable to load digital information",
        });
    }
};
exports.GetDigitalForProxy = GetDigitalForProxy;
const DigitalInformation = async (req, res) => {
    let result = await (0, digital_service_1.DigitalInformationService)(req);
    res.json(result);
};
exports.DigitalInformation = DigitalInformation;
const GetDigitalData = async (req, res) => {
    const result = await (0, digital_service_1.DigitalGetService)(req);
    return res.status(200).json(result);
};
exports.GetDigitalData = GetDigitalData;
