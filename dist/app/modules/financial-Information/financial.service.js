"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialGetService = exports.FinancialUpdateService = exports.getFinancialForProxy = void 0;
const financial_model_1 = require("./financial.model");
const mongoose_1 = require("mongoose");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const getFinancialForProxy = async (proxyUserId, grantorId) => {
    const access = await (0, proxyAccess_service_1.requireActiveProxyConnection)({
        proxyUserId,
        grantorId,
    });
    if (!access.ok) {
        const error = new Error(access.message);
        /*
         * Lets your controller map this to the appropriate
         * HTTP status without losing the authorization result.
         */
        Object.assign(error, {
            statusCode: access.statusCode,
        });
        throw error;
    }
    const financialData = await financial_model_1.FinancialModel.findOne({
        userID: new mongoose_1.Types.ObjectId(grantorId),
    })
        .select("userID items")
        .lean();
    return {
        status: "success",
        data: financialData || {
            userID: grantorId,
            items: [],
        },
    };
};
exports.getFinancialForProxy = getFinancialForProxy;
const FinancialUpdateService = async (req) => {
    try {
        const user_id = req.user?.id;
        const requestBody = req.body;
        requestBody.userID = user_id;
        const token = req.headers.authorization?.split(" ")[1] || null;
        if (Array.isArray(req.body?.items)) {
            const allowedTypes = new Set([
                "account",
                "retirementAccount",
                "asset",
                "debt",
            ]);
            const items = req.body.items.map((item) => {
                if (!item ||
                    typeof item !== "object" ||
                    !allowedTypes.has(item.itemType)) {
                    throw new Error("Invalid financial item type.");
                }
                if (item._id !== undefined &&
                    !mongoose_1.Types.ObjectId.isValid(item._id)) {
                    throw new Error("Invalid financial item ID.");
                }
                if (item.amountCents !== undefined &&
                    (!Number.isSafeInteger(item.amountCents) ||
                        item.amountCents < 0)) {
                    throw new Error("Invalid financial item amount.");
                }
                const cleaned = {
                    itemType: item.itemType,
                    details: typeof item.details === "string"
                        ? item.details.trim()
                        : "",
                    institution: typeof item.institution === "string"
                        ? item.institution.trim()
                        : "",
                    accountType: typeof item.accountType === "string"
                        ? item.accountType.trim()
                        : "",
                    assetType: typeof item.assetType === "string"
                        ? item.assetType.trim()
                        : "",
                    debtType: typeof item.debtType === "string"
                        ? item.debtType.trim()
                        : "",
                };
                if (item._id !== undefined) {
                    cleaned._id = item._id;
                }
                if (item.amountCents !== undefined) {
                    cleaned.amountCents = item.amountCents;
                }
                return cleaned;
            });
            const updatedFinancialData = await financial_model_1.FinancialModel.findOneAndUpdate({ userID: user_id }, { $set: { items } }, {
                upsert: true,
                new: true,
                runValidators: true,
            });
            return {
                status: "success",
                message: "Financial items updated successfully",
                data: updatedFinancialData,
            };
        }
        const allFields = [
            requestBody.bankAccount,
            requestBody.retirementAccount,
            requestBody.currentAssets,
            requestBody.debt,
        ];
        const filledFields = allFields.filter((field) => typeof field === "string" && field.trim() !== "").length;
        const totalFields = allFields.length;
        const completenessPercentage = (filledFields / totalFields) * 100;
        const updatedFinancialData = await financial_model_1.FinancialModel.findOneAndUpdate({ userID: user_id }, {
            ...requestBody,
            financialPercentage: completenessPercentage
        }, { upsert: true, new: true });
        return {
            status: "success",
            message: `Financial data updated successfully (${completenessPercentage.toFixed(2)}%)`,
            financialPercentage: completenessPercentage.toFixed(2),
            updatedFinancialData,
            token: token
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.FinancialUpdateService = FinancialUpdateService;
const FinancialGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return { status: "failed", message: "Unauthorized" };
        }
        const financialData = await financial_model_1.FinancialModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
        if (!financialData) {
            return { status: "failed", message: "No financial data found" };
        }
        return {
            status: "success",
            data: financialData,
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.FinancialGetService = FinancialGetService;
