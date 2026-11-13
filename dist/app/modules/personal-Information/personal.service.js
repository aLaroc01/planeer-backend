"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalGetService = exports.PersonalUpdateService = exports.getPersonalForProxy = void 0;
const personal_model_1 = require("./personal.model");
const mongoose_1 = require("mongoose");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const getPersonalForProxy = async (proxyUserId, grantorId) => {
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
    const personalData = await personal_model_1.PersonalModel.findOne({
        userID: new mongoose_1.Types.ObjectId(grantorId),
    })
        .select("userID items")
        .lean();
    return {
        status: "success",
        data: personalData || {
            userID: grantorId,
            items: [],
        },
    };
};
exports.getPersonalForProxy = getPersonalForProxy;
const PersonalUpdateService = async (req) => {
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
                "valuable",
                "collectible",
                "sentimental",
                "generalInstructions",
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
                    throw new Error("Invalid personal item.");
                }
                const item = rawItem;
                if (typeof item.itemType !== "string" ||
                    !allowedTypes.has(item.itemType)) {
                    throw new Error("Invalid personal item type.");
                }
                const name = text(item, "name");
                if (item.itemType !== "generalInstructions" &&
                    !name) {
                    throw new Error("Each personal item needs a name.");
                }
                const cleaned = {
                    itemType: item.itemType,
                    name,
                    description: text(item, "description"),
                    location: text(item, "location"),
                    wishes: text(item, "wishes"),
                    instructions: text(item, "instructions"),
                };
                if (item.estimatedValueCents !== undefined) {
                    if (!Number.isSafeInteger(item.estimatedValueCents) ||
                        item.estimatedValueCents < 0) {
                        throw new Error("Invalid estimated value.");
                    }
                    cleaned.estimatedValueCents =
                        item.estimatedValueCents;
                }
                if (item._id !== undefined) {
                    if (typeof item._id !== "string" ||
                        !/^[a-f\d]{24}$/i.test(item._id) ||
                        !mongoose_1.Types.ObjectId.isValid(item._id)) {
                        throw new Error("Invalid personal item ID.");
                    }
                    cleaned._id = item._id;
                }
                return cleaned;
            });
            let document = await personal_model_1.PersonalModel.findOne({
                userID: user_id,
            });
            if (!document) {
                document = new personal_model_1.PersonalModel({
                    userID: user_id,
                });
            }
            document.set("items", items);
            await document.save();
            return {
                status: "success",
                message: "Personal items updated successfully.",
                data: document,
            };
        }
        const token = req.headers.authorization?.split(" ")[1] || null;
        const answers = req.body.answers || [];
        const updateData = {
            userID: user_id,
            ...Object.fromEntries(answers.map((item) => [item.key, item.answer])),
        };
        const updatedPersonalData = await personal_model_1.PersonalModel.findOneAndUpdate({ userID: user_id }, { $set: updateData }, { upsert: true, new: true });
        return {
            status: "success",
            message: `Personal data updated successfully`,
            updatedPersonalData,
            token: token
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.PersonalUpdateService = PersonalUpdateService;
const PersonalGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return {
                status: "failed",
                message: "Unauthorized",
            };
        }
        const personalData = await personal_model_1.PersonalModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
        /*
         * A user who has not saved Personal information yet
         * is a normal empty state, not an API failure.
         */
        if (!personalData) {
            return {
                status: "success",
                data: {
                    userID: user_id,
                    items: [],
                },
            };
        }
        return {
            status: "success",
            data: personalData,
        };
    }
    catch (error) {
        return {
            status: "failed",
            message: error.message ||
                "Could not retrieve personal data.",
        };
    }
};
exports.PersonalGetService = PersonalGetService;
