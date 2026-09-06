"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectionSchema = new mongoose_1.default.Schema({
    grantorId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    proxyEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    proxyUserId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
    },
    inviteToken: {
        type: String,
        default: null,
        index: true,
    },
    acceptedAt: {
        type: Date,
        default: null,
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpiresAt: {
        type: Date,
        default: null,
    },
    otpPurpose: {
        type: String,
        enum: ["proxy-verification", "proxy-release", "proxy-emergency-release"],
        default: "proxy-verification",
    },
    preauthorizedReleaseEnabled: {
        type: Boolean,
        default: false
    },
    preauthorizedReleaseCategories: {
        type: [
            {
                type: String,
                enum: [
                    "medical",
                    "financial",
                    "home-auto",
                    "social",
                    "personal",
                ],
            },
        ],
        default: [],
    },
    preauthorizedReleaseType: {
        type: String,
        enum: ["emergency", "manual", "death", "inactivity"],
        default: "manual",
    },
    preauthorizedReleaseGrantedAt: {
        type: Date,
        default: null
    },
    preauthorizedReleaseGrantedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    preauthorizedReleaseNote: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["invited", "pending", "active", "disabled", "rejected", "cancelled"],
        default: "invited",
    },
    releaseStatus: {
        type: String,
        enum: ["established", "pending-release", "released", "rejected"],
        default: "established",
    },
    releaseReason: {
        type: String,
        enum: ["manual", "proxy-request", "inactivity", "verified-death"],
        default: "manual",
    },
    releaseRequestedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    releaseRequestedAt: {
        type: Date,
        default: null,
    },
    releaseVerifiedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    releaseVerifiedAt: {
        type: Date,
        default: null,
    },
    evidenceNote: {
        type: String,
        default: "",
    },
}, { timestamps: true });
connectionSchema.index({ inviteToken: 1, status: 1 });
connectionSchema.index({ grantorId: 1, proxyEmail: 1, status: 1 });
const Connection = mongoose_1.default.models.Connection || mongoose_1.default.model("Connection", connectionSchema);
exports.default = Connection;
