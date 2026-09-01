"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeautoGetService = exports.HomeAutoService = void 0;
const homeauto_model_1 = require("./homeauto.model");
const HomeAutoService = async (req) => {
    try {
        let user_id = req.user?.id;
        let requestBody = req.body;
        requestBody.userID = user_id;
        // Token middleware থেকে আসে
        const token = req.headers.authorization?.split(" ")[1] || null;
        const allFields = [
            requestBody.vehicleOwnership,
            requestBody.vehicleMakeModel,
            requestBody.hasCarInsurance,
            requestBody.carInsuranceProvider,
            requestBody.hasPowerToys,
            requestBody.powerToyTypes,
            requestBody.homeOccupancy,
            requestBody.hasHomeInsurance,
            requestBody.homeInsuranceType
        ];
        const filledFields = allFields.filter(field => {
            if (typeof field === 'string') {
                return field.trim() !== "";
            }
            else {
                return field !== undefined && field !== null && field !== "";
            }
        }).length;
        const totalFields = allFields.length;
        const completenessPercentage = (filledFields / totalFields) * 100;
        const updatedMedicalData = await homeauto_model_1.HomeAutoModel.findOneAndUpdate({ userID: user_id }, {
            ...requestBody,
            homeautoPercentage: completenessPercentage // ✅ fixed
        }, { upsert: true, new: true });
        return {
            status: "success",
            message: `HomeAuto data updated successfully ${completenessPercentage.toFixed(2)}%`,
            homeautoPercentage: completenessPercentage.toFixed(2), // Percentage result
            updatedMedicalData,
            token: token
        };
    }
    catch (error) {
        console.error('Error:', error); // Log the error to debug
        return { status: 'failed', data: error };
    }
};
exports.HomeAutoService = HomeAutoService;
const HomeautoGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return { status: "failed", message: "Unauthorized" };
        }
        const financialData = await homeauto_model_1.HomeAutoModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
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
exports.HomeautoGetService = HomeautoGetService;
