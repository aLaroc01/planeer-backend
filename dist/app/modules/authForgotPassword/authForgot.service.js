"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordService = exports.verifyOtpService = exports.forgotPasswordService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../auth/user.model");
const emailHelper_1 = require("../../../helpers/emailHelper");
const forgotPasswordService = async ({ email }) => {
    if (!email) {
        throw new Error("Email is required");
    }
    const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new Error("User not found");
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = code;
    // user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // user.otpVerified = false;
    await user.save();
    const subject = "Planeer Password Reset Code";
    const text = `Your Planeer password reset code is: ${code}`;
    await (0, emailHelper_1.SendEmail)(user.email, subject, text);
    return { message: "6 digit code sent successfully" };
};
exports.forgotPasswordService = forgotPasswordService;
const verifyOtpService = async ({ email, code }) => {
    if (!email || !code) {
        throw new Error("Email and code are required");
    }
    const user = await user_model_1.User.findOne({
        email: email.toLowerCase(),
        otp: code,
    });
    if (!user) {
        throw new Error("Invalid code or email");
    }
    // if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
    //   throw new Error("Code has expired");
    // }
    // user.otpVerified = true;
    await user.save();
    return { message: "Code verified successfully" };
};
exports.verifyOtpService = verifyOtpService;
const resetPasswordService = async ({ email, password, }) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }
    const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
    if (!user) {
        throw new Error("User not found");
    }
    // if (!user.otpVerified) {
    //   throw new Error("OTP not verified");
    // }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    user.password = hashedPassword;
    // user.otp = undefined;
    // user.otpExpiresAt = undefined;
    // user.otpVerified = false;
    await user.save();
    return { message: "Password updated successfully" };
};
exports.resetPasswordService = resetPasswordService;
