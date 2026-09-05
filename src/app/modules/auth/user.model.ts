import { model, Schema, Types } from "mongoose";
import { IUser, Role, AccountStatus } from "../auth/user.interface";

const userSchema = new Schema<IUser>(
  {
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
      enum: Object.values(AccountStatus),
      default: AccountStatus.PENDING_VERIFICATION,
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
    proxysetId: [{ type: Types.ObjectId, ref: "User" }],
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
      enum: Object.values(Role),
      default: Role.USER,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const User = model<IUser>("User", userSchema);