"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalData = exports.UpdateMedical = void 0;
const medical_service_1 = require("./medical.service");
const UpdateMedical = async (req, res) => {
    let result = await (0, medical_service_1.MedicalUpdateService)(req);
    res.json(result);
};
exports.UpdateMedical = UpdateMedical;
const GetMedicalData = async (req, res) => {
    const result = await (0, medical_service_1.MedicalGetService)(req);
    return res.status(200).json(result);
};
exports.GetMedicalData = GetMedicalData;
