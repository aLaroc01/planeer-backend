"use strict";
// for mongoose model
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeAutoModel = void 0;
const mongoose_1 = require("mongoose");
const homeautoSchema = new mongoose_1.Schema({
    // Vehicle
    vehicleOwnership: {
        type: String,
        default: undefined,
    },
    vehicleMakeModel: {
        type: String,
        trim: true,
        default: undefined,
    },
    hasCarInsurance: {
        type: String,
        default: undefined,
    },
    carInsuranceProvider: {
        type: String,
        trim: true,
        default: undefined,
    },
    // ATV / Boat / Motorcycle
    hasPowerToys: {
        type: String,
        default: undefined,
    },
    powerToyTypes: {
        type: String,
        default: undefined,
    },
    // Home
    homeOccupancy: {
        type: String,
        default: undefined,
    },
    hasHomeInsurance: {
        type: String,
        default: undefined,
    },
    homeInsuranceType: {
        type: String,
        default: undefined,
    },
    homeautoPercentage: { type: Number },
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
exports.HomeAutoModel = (0, mongoose_1.model)("homeauto", homeautoSchema);
