"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTicket = void 0;
const mongoose_1 = require("mongoose");
const supportTicketSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 150,
    },
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 5000,
    },
    status: {
        type: String,
        enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
        default: "OPEN",
        index: true,
    },
    priority: {
        type: String,
        enum: ["LOW", "NORMAL", "HIGH"],
        default: "NORMAL",
    },
    adminReply: {
        type: String,
        trim: true,
        default: "",
    },
    resolvedAt: {
        type: Date,
        default: null,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    updatedByAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, updatedAt: -1 });
exports.SupportTicket = (0, mongoose_1.model)("SupportTicket", supportTicketSchema);
