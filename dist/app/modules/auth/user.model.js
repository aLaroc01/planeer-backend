"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("../auth/user.interface");
const userSchema = new mongoose_1.Schema({
    yearStarted: { type: Date },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    phoneNumber: { type: String },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    otpVerified: { type: Boolean, default: false },
    // New: admin account status
    accountStatus: {
        type: String,
        enum: Object.values(user_interface_1.AccountStatus),
        default: user_interface_1.AccountStatus.PENDING_VERIFICATION,
        index: true,
    },
    // New: set after a successful login
    lastLoginAt: {
        type: Date,
        default: null,
    },
    // New: MFA state only; actual MFA implementation comes later
    mfa: {
        enabled: { type: Boolean, default: false },
        method: {
            type: String,
            enum: ["TOTP", null],
            default: null,
        },
        enabledAt: { type: Date, default: null },
    },
    // Original fields preserved
    proxysetId: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    stripeCustomerId: {
        type: String,
        default: "",
        index: true,
    },
    isSubscribed: {
        type: Boolean,
        default: false,
        index: true,
    },
    hasUsedFreeTrial: {
        type: Boolean,
        default: false,
    },
    freeTrialUsedAt: {
        type: Date,
        default: null,
    },
    imgUrl: { type: String },
    role: {
        type: String,
        enum: Object.values(user_interface_1.Role),
        default: user_interface_1.Role.USER,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.User = (0, mongoose_1.model)("User", userSchema);
