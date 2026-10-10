import { Document, Types } from "mongoose";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
  PROXY = "PROXY",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum PlanStatus {
  ACTIVE = "ACTIVE",
  FROZEN = "FROZEN",
  ARCHIVED = "ARCHIVED",
}


export enum AccountStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  DEACTIVATED = "DEACTIVATED",
}

export type MfaMethod = "TOTP" | null;

export interface IUser extends Document {
  yearStarted?: Date;

  email: string;
  password: string;
  phoneNumber?: string;
  imgUrl?: string;

  otp?: string | null;
  otpExpiresAt?: Date | null;
  otpVerified: boolean;

  role: Role;

  accountStatus: AccountStatus;
  planStatus?: PlanStatus;
  planStatusChangedAt?: Date | null;
  planStatusChangedBy?: Types.ObjectId | null;

  archiveExpiresAt?: Date | null;

  lastLoginAt?: Date | null;

  mfa: {
    enabled: boolean;
    method: "TOTP" | null;
    enabledAt?: Date | null;
  };

  proxysetId: Types.ObjectId[];
  grantorsetId?: Types.ObjectId[];

  stripeCustomerId: string;
  isSubscribed?: boolean;
  hasUsedFreeTrial?: boolean;
  freeTrialUsedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// types/proxyUser.types.ts
export type ProxyUser = {
  _id: string;
  email: string;
};

export type ProxyUserResponse = {
  status: boolean;
  data: ProxyUser[];
};