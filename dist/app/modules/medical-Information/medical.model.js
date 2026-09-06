"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalInfoModel = void 0;
const mongoose_1 = require("mongoose");
const MedicalInfoSchema = new mongoose_1.Schema({
    healthInsurance: { type: String, trim: true, default: "" },
    supplementalInsuranceProvider: { type: String, trim: true, default: "" },
    emergencyContact: { type: String, trim: true, default: "" },
    allergies: { type: String, default: "" },
    medications: { type: String, default: "" },
    hospitalPreference: { type: String, trim: true, default: "" },
    hospitalLocation: { type: String, default: "" },
    knownAilments: { type: String, default: "" },
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
}, { timestamps: true, versionKey: false });
exports.MedicalInfoModel = (0, mongoose_1.model)("MedicalInfo", MedicalInfoSchema);
