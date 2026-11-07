"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalGetService = exports.DigitalInformationService = exports.getDigitalForProxy = void 0;
const digital_model_1 = require("./digital.model");
const mongoose_1 = require("mongoose");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const getDigitalForProxy = async (proxyUserId, grantorId) => {
    const access = await (0, proxyAccess_service_1.requireActiveProxyConnection)({
        proxyUserId,
        grantorId,
    });
    if (!access.ok) {
        const error = new Error(access.message);
        Object.assign(error, {
            statusCode: access.statusCode,
        });
        throw error;
    }
    const digitalData = await digital_model_1.DigitalInfoModel.findOne({
        userID: new mongoose_1.Types.ObjectId(grantorId),
    })
        .select("userID items")
        .lean();
    return {
        status: "success",
        data: digitalData || {
            userID: grantorId,
            items: [],
        },
    };
};
exports.getDigitalForProxy = getDigitalForProxy;
const DigitalInformationService = async (req) => {
    try {
        let user_id = req.user?.id;
        if (!user_id) {
            return {
                status: "failed",
                message: "Unauthorized",
            };
        }
        if (Array.isArray(req.body?.items)) {
            const allowedTypes = new Set([
                "subscription",
                "emailAccount",
                "website",
                "digitalAsset",
            ]);
            const text = (item, field) => {
                const value = item[field];
                if (value === undefined) {
                    return "";
                }
                if (typeof value !== "string") {
                    throw new Error(`Invalid ${field} value.`);
                }
                return value.trim();
            };
            const items = req.body.items.map((rawItem) => {
                if (!rawItem ||
                    typeof rawItem !== "object" ||
                    Array.isArray(rawItem)) {
                    throw new Error("Invalid digital item.");
                }
                const item = rawItem;
                if (typeof item.itemType !== "string" ||
                    !allowedTypes.has(item.itemType)) {
                    throw new Error("Invalid digital item type.");
                }
                const name = text(item, "name");
                const email = text(item, "email");
                if (item.itemType === "emailAccount" &&
                    !email) {
                    throw new Error("Each email account needs an email address.");
                }
                if (item.itemType !== "emailAccount" &&
                    !name) {
                    throw new Error("Each digital item needs a name.");
                }
                const cleaned = {
                    itemType: item.itemType,
                    name,
                    category: text(item, "category"),
                    email,
                    provider: text(item, "provider"),
                    url: text(item, "url"),
                    assetType: text(item, "assetType"),
                    notes: text(item, "notes"),
                };
                if (item._id !== undefined) {
                    if (typeof item._id !== "string" ||
                        !/^[a-f\d]{24}$/i.test(item._id) ||
                        !mongoose_1.Types.ObjectId.isValid(item._id)) {
                        throw new Error("Invalid digital item ID.");
                    }
                    cleaned._id = item._id;
                }
                return cleaned;
            });
            let document = await digital_model_1.DigitalInfoModel.findOne({
                userID: user_id,
            });
            if (!document) {
                document = new digital_model_1.DigitalInfoModel({
                    userID: user_id,
                });
            }
            document.set("items", items);
            await document.save();
            return {
                status: "success",
                message: "Digital items updated successfully.",
                data: document,
            };
        }
        let requestBody = req.body;
        requestBody.userID = user_id;
        const token = req.headers.authorization?.split(" ")[1] || null;
        const allFields = [
            requestBody.digitalMedia,
            requestBody.website,
            requestBody.streamingService
        ];
        const filledFields = allFields.filter(field => field && field.trim() !== "").length;
        const totalFields = allFields.length;
        const completenessPercentage = (filledFields / totalFields) * 100;
        const updatedDigitalData = await digital_model_1.DigitalInfoModel.findOneAndUpdate({ userID: user_id }, {
            ...requestBody,
            digitalInfoPercentage: completenessPercentage
        }, { upsert: true, new: true });
        return {
            status: "success",
            message: `Digital data updated successfully ${completenessPercentage.toFixed(2)}%`,
            digitalInfoPercentage: completenessPercentage.toFixed(2),
            updatedDigitalData,
            token: token
        };
    }
    catch (error) {
        return { status: 'failed', data: error, };
    }
};
exports.DigitalInformationService = DigitalInformationService;
const DigitalGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return { status: "failed", message: "Unauthorized" };
        }
        const digitalData = await digital_model_1.DigitalInfoModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
        if (!digitalData) {
            return { status: "failed", message: "No digital data found" };
        }
        return {
            status: "success",
            data: digitalData,
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.DigitalGetService = DigitalGetService;
