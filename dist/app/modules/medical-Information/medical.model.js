"use strict";
// for mongoose model
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalModel = void 0;
const mongoose_1 = require("mongoose");
const medicalSchema = new mongoose_1.Schema({
    healthInsurance: {
        type: String,
    },
    supplementalInsurance: {
        type: String,
    },
    medications: {
        type: String,
    },
    knownAilments: {
        type: String,
    },
    medicalsPercentage: { type: Number },
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
exports.MedicalModel = (0, mongoose_1.model)("medicals", medicalSchema);
