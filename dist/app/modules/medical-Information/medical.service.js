"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalGetService = exports.MedicalUpdateService = exports.getMedicalForProxy = void 0;
const medical_model_1 = require("./medical.model");
const mongoose_1 = require("mongoose");
const proxyAccess_service_1 = require("../services/proxyAccess.service");
const getMedicalForProxy = async (proxyUserId, grantorId) => {
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
    const medicalData = await medical_model_1.MedicalInfoModel.findOne({
        userID: new mongoose_1.Types.ObjectId(grantorId),
    })
        .select("userID items")
        .lean();
    return {
        status: "success",
        data: medicalData || {
            userID: grantorId,
            items: [],
        },
    };
};
exports.getMedicalForProxy = getMedicalForProxy;
const MedicalUpdateService = async (req) => {
    try {
        let user_id = req.user?.id;
        let requestBody = req.body;
        requestBody.userID = user_id;
        const token = req.headers.authorization?.split(" ")[1] || null;
        const allFields = [
            requestBody.healthInsurance,
            requestBody.supplementalInsurance,
            requestBody.medications,
            requestBody.knownAilments
        ];
        const filledFields = allFields.filter(field => field && field.trim() !== "").length;
        const totalFields = allFields.length;
        const completenessPercentage = (filledFields / totalFields) * 100;
        const updatedMedicalData = await medical_model_1.MedicalInfoModel.findOneAndUpdate({ userID: user_id }, {
            ...requestBody,
            medicalsPercentage: completenessPercentage
        }, { upsert: true, new: true });
        return {
            status: "success",
            message: `Medical data updated successfully ${completenessPercentage.toFixed(2)}%`,
            medicalsPercentage: completenessPercentage.toFixed(2),
            updatedMedicalData,
            token: token
        };
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.MedicalUpdateService = MedicalUpdateService;
const MedicalGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return { status: "failed", message: "Unauthorized" };
        }
        const medicalData = await medical_model_1.MedicalInfoModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
        if (!medicalData) {
            return { status: "failed", message: "No medical data found" };
        }
        return {
            status: "success",
            data: medicalData,
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.MedicalGetService = MedicalGetService;
