"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHomeautoData = exports.HomeAutoUpdate = exports.GetHomeAutoForProxy = void 0;
const homeauto_service_1 = require("./homeauto.service");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const GetHomeAutoForProxy = async (req, res) => {
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
        const homeAuto = await (0, homeauto_service_1.getHomeAutoForProxy)(proxyUserId, grantorId);
        return res.status(200).json(homeAuto);
    }
    catch (error) {
        const statusCode = error?.statusCode || 500;
        if (statusCode >= 500) {
            console.error("Unable to get proxy home and auto information:", error);
        }
        return res.status(statusCode).json({
            status: "failed",
            message: error?.message ||
                "Unable to load home and auto information",
        });
    }
};
exports.GetHomeAutoForProxy = GetHomeAutoForProxy;
const HomeAutoUpdate = async (req, res) => {
    let result = await (0, homeauto_service_1.HomeAutoService)(req);
    res.json(result);
};
exports.HomeAutoUpdate = HomeAutoUpdate;
const GetHomeautoData = async (req, res) => {
    const result = await (0, homeauto_service_1.HomeautoGetService)(req);
    return res.status(200).json(result);
};
exports.GetHomeautoData = GetHomeautoData;
