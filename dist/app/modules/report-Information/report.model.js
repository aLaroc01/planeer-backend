"use strict";
// for mongoose model
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModel = void 0;
const mongoose_1 = require("mongoose");
const financialSchema = new mongoose_1.Schema({
    problemtitle: { type: String, required: true },
    desdetails: { type: String, required: true },
    status: {
        type: String,
        enum: ["Progress", "Completed"],
        default: "Progress"
    },
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
exports.ReportModel = (0, mongoose_1.model)("report", financialSchema);
