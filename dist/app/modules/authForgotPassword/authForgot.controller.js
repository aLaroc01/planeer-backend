"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authForgotController = void 0;
const authForgot_service_1 = require("./authForgot.service");
exports.authForgotController = {
    async forgotPassword(req, res) {
        try {
            const result = await (0, authForgot_service_1.forgotPasswordService)(req.body);
            return res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            console.error("forgotPassword error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Unable to send reset code",
            });
        }
    },
    async verifyOtp(req, res) {
        try {
            const result = await (0, authForgot_service_1.verifyOtpService)(req.body);
            return res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            console.error("verifyOtp error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "OTP verification failed",
            });
        }
    },
    async resetPassword(req, res) {
        try {
            const result = await (0, authForgot_service_1.resetPasswordService)(req.body);
            return res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            console.error("resetPassword error:", error);
            return res.status(400).json({
                success: false,
                message: error.message || "Password reset failed",
            });
        }
    },
};
