import { model, Schema, Types } from "mongoose";
import { IUser, Role, AccountStatus, PlanStatus } from "../auth/user.interface";

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

    planStatus: {
      type: String,
      enum: Object.values(PlanStatus),
      default: PlanStatus.ACTIVE,
      index: true,
    },

    planStatusChangedAt: {
      type: Date,
      default: null,
    },

    planStatusChangedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archiveExpiresAt: {
      type: Date,
      default: null,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("profile", {
  ref: "profile",
  localField: "_id",
  foreignField: "userID",
  justOne: true,
});

userSchema.index({
  planStatus: 1,
  archiveExpiresAt: 1,
});

export const User = model<IUser>("User", userSchema);