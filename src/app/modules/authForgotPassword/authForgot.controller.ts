import { Request, Response } from "express";
import {
  forgotPasswordService,
  verifyOtpService,
  resetPasswordService,
} from "./authForgot.service";

export const authForgotController = {
  async forgotPassword(req: Request, res: Response) {
    try {
      const result = await forgotPasswordService(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("forgotPassword error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to send reset code",
      });
    }
  },

  async verifyOtp(req: Request, res: Response) {
    try {
      const result = await verifyOtpService(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("verifyOtp error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "OTP verification failed",
      });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const result = await resetPasswordService(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("resetPassword error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Password reset failed",
      });
    }
  },
};