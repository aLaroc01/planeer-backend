"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authForgot_service_1 = require("../authForgotPassword/authForgot.service");
const router = (0, express_1.Router)();
router.post("/forgot-password", async (req, res) => {
    try {
        const result = await (0, authForgot_service_1.forgotPasswordService)(req.body);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("forgot-password error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Unable to send reset code",
        });
    }
});
router.post("/verify-otp", async (req, res) => {
    try {
        const result = await (0, authForgot_service_1.verifyOtpService)(req.body);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("verify-otp error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "OTP verification failed",
        });
    }
});
router.post("/reset-password", async (req, res) => {
    try {
        const result = await (0, authForgot_service_1.resetPasswordService)(req.body);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("reset-password error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Password reset failed",
        });
    }
});
exports.default = router;
