import { Router, Request, Response } from "express";
import {
  forgotPasswordService,
  verifyOtpService,
  resetPasswordService,
} from "../authForgotPassword/authForgot.service";

const router = Router();

router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const result = await forgotPasswordService(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("forgot-password error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Unable to send reset code",
    });
  }
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const result = await verifyOtpService(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("verify-otp error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "OTP verification failed",
    });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const result = await resetPasswordService(req.body);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("reset-password error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Password reset failed",
    });
  }
});

export default router;