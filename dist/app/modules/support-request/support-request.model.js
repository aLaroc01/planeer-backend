"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportRequest = exports.SUPPORT_ISSUES = void 0;
const mongoose_1 = require("mongoose");
exports.SUPPORT_ISSUES = [
    "General Inquiry",
    "Feedback",
    "Account Access",
    "Other",
];
const supportRequestSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        maxlength: 254,
    },
    phone: {
        type: String,
        trim: true,
        maxlength: 40,
        default: "",
    },
    issue: {
        type: String,
        enum: exports.SUPPORT_ISSUES,
        required: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10000,
    },
    status: {
        type: String,
        enum: ["Open", "Completed"],
        default: "Open",
    },
    completedAt: {
        type: Date,
        default: null,
    },
    completedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, { timestamps: true });
supportRequestSchema.index({ status: 1, createdAt: -1 });
exports.SupportRequest = mongoose_1.models.SupportRequest ||
    (0, mongoose_1.model)("SupportRequest", supportRequestSchema);
