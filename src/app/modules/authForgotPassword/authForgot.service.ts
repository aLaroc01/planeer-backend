import bcrypt from "bcryptjs";
import { User } from "../auth/user.model";
import { SendEmail } from "../../../helpers/emailHelper";

type ForgotPasswordInput = {
  email: string;
};

type VerifyOtpInput = {
  email: string;
  code: string;
};

type ResetPasswordInput = {
  email: string;
  password: string;
};

export const forgotPasswordService = async ({ email }: ForgotPasswordInput) => {
  if (!email) {
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
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

  await SendEmail(user.email, subject, text);

  return { message: "6 digit code sent successfully" };
};

export const verifyOtpService = async ({ email, code }: VerifyOtpInput) => {
  if (!email || !code) {
    throw new Error("Email and code are required");
  }

  const user = await User.findOne({
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

export const resetPasswordService = async ({
  email,
  password,
}: ResetPasswordInput) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error("User not found");
  }

  // if (!user.otpVerified) {
  //   throw new Error("OTP not verified");
  // }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  // user.otp = undefined;
  // user.otpExpiresAt = undefined;
  // user.otpVerified = false;
  await user.save();

  return { message: "Password updated successfully" };
};