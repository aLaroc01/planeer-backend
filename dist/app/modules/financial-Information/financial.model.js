"use strict";
// for mongoose model
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialModel = void 0;
const mongoose_1 = require("mongoose");
const financialSchema = new mongoose_1.Schema({
    bankAccount: { type: String, required: true },
    retirementAccount: { type: String, required: true },
    currentAssets: { type: String, required: true },
    debt: { type: String, required: true },
    financialPercentage: { type: Number },
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
exports.FinancialModel = (0, mongoose_1.model)("financial", financialSchema);
