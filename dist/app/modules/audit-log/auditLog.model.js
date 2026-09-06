"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const auditLog_interface_1 = require("./auditLog.interface");
const auditLogSchema = new mongoose_1.Schema({
    actorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    targetUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    action: {
        type: String,
        enum: Object.values(auditLog_interface_1.AuditAction),
        required: true,
        index: true,
    },
    changedFields: {
        type: [String],
        default: [],
    },
    before: {
        role: { type: String },
        accountStatus: { type: String },
    },
    after: {
        role: { type: String },
        accountStatus: { type: String },
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.AuditLog = (0, mongoose_1.model)("AuditLog", auditLogSchema);
