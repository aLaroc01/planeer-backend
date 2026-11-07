"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveRequest = exports.ArchiveEndReason = exports.ArchiveRequestStatus = exports.ArchiveRequestReason = void 0;
const mongoose_1 = require("mongoose");
var ArchiveRequestReason;
(function (ArchiveRequestReason) {
    ArchiveRequestReason["INCAPACITY"] = "INCAPACITY";
    ArchiveRequestReason["DEATH"] = "DEATH";
})(ArchiveRequestReason || (exports.ArchiveRequestReason = ArchiveRequestReason = {}));
var ArchiveRequestStatus;
(function (ArchiveRequestStatus) {
    ArchiveRequestStatus["PENDING"] = "PENDING";
    ArchiveRequestStatus["APPROVED"] = "APPROVED";
    ArchiveRequestStatus["REJECTED"] = "REJECTED";
    ArchiveRequestStatus["WITHDRAWN"] = "WITHDRAWN";
})(ArchiveRequestStatus || (exports.ArchiveRequestStatus = ArchiveRequestStatus = {}));
var ArchiveEndReason;
(function (ArchiveEndReason) {
    ArchiveEndReason["EXPIRED"] = "EXPIRED";
    ArchiveEndReason["ADMIN_RESTORED"] = "ADMIN_RESTORED";
})(ArchiveEndReason || (exports.ArchiveEndReason = ArchiveEndReason = {}));
const archiveRequestSchema = new mongoose_1.Schema({
    grantorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    requestedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    connectionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Connection",
        required: true,
    },
    reason: {
        type: String,
        enum: Object.values(ArchiveRequestReason),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(ArchiveRequestStatus),
        default: ArchiveRequestStatus.PENDING,
        required: true,
    },
    requesterNote: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
    },
    evidenceFileIds: {
        type: [mongoose_1.Schema.Types.ObjectId],
        default: [],
    },
    archiveType: {
        type: String,
        enum: ["temporary", "permanent"],
        default: null,
    },
    archiveExpiresAt: {
        type: Date,
        default: null,
    },
    archiveEndedAt: {
        type: Date,
        default: null,
    },
    archiveEndReason: {
        type: String,
        enum: Object.values(ArchiveEndReason),
        default: null,
    },
    archiveEndedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    archiveEndNote: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
    },
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    reviewNote: {
        type: String,
        trim: true,
        maxlength: 2000,
        default: "",
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Only one pending request per grantor.
// Approved/rejected requests remain as history.
archiveRequestSchema.index({ grantorId: 1 }, {
    unique: true,
    partialFilterExpression: {
        status: ArchiveRequestStatus.PENDING,
    },
});
exports.ArchiveRequest = (0, mongoose_1.model)("ArchiveRequest", archiveRequestSchema);
