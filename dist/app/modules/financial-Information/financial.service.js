"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialGetService = exports.FinancialUpdateService = void 0;
const financial_model_1 = require("./financial.model");
const FinancialUpdateService = async (req) => {
    try {
        const user_id = req.user?.id;
        const requestBody = req.body;
        requestBody.userID = user_id;
        const token = req.headers.authorization?.split(" ")[1] || null;
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
