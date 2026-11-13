"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveProxyConnection = exports.getAuthenticatedUserId = void 0;
const mongoose_1 = require("mongoose");
const connection_model_1 = __importDefault(require("../connections/connection.model"));
const getAuthenticatedUserId = (user) => {
    const id = user?.id ||
        user?.userId ||
        user?._id ||
        "";
    return String(id).trim();
};
exports.getAuthenticatedUserId = getAuthenticatedUserId;
const requireActiveProxyConnection = async ({ proxyUserId, grantorId, }) => {
    const normalizedProxyUserId = String(proxyUserId || "").trim();
    const normalizedGrantorId = String(grantorId || "").trim();
    if (!normalizedProxyUserId) {
        return {
            ok: false,
            statusCode: 401,
            message: "Unauthorized",
        };
    }
    if (!mongoose_1.Types.ObjectId.isValid(normalizedProxyUserId)) {
        return {
            ok: false,
            statusCode: 401,
            message: "Invalid authenticated user.",
        };
    }
    if (!mongoose_1.Types.ObjectId.isValid(normalizedGrantorId)) {
        return {
            ok: false,
            statusCode: 400,
            message: "Invalid grantor ID.",
        };
    }
    const connection = await connection_model_1.default.findOne({
        proxyUserId: new mongoose_1.Types.ObjectId(normalizedProxyUserId),
        grantorId: new mongoose_1.Types.ObjectId(normalizedGrantorId),
        status: "active",
    })
        .select("_id")
        .lean();
    if (!connection) {
        return {
            ok: false,
            statusCode: 403,
            message: "You do not have an active connection to this grantor.",
        };
    }
    return {
        ok: true,
    };
};
exports.requireActiveProxyConnection = requireActiveProxyConnection;
