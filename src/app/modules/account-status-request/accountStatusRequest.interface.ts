import { Document, Types } from "mongoose";
import { AccountStatus } from "../auth/user.interface";

export enum AccountStatusRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type RequestedAccountStatus =
  | AccountStatus.ACTIVE
  | AccountStatus.SUSPENDED
  | AccountStatus.DEACTIVATED;

export interface IAccountStatusRequest extends Document {
  targetUserId: Types.ObjectId;
  requestedBy: Types.ObjectId;

  fromStatus: AccountStatus;
  requestedStatus: RequestedAccountStatus;

  internalNote: string;
  status: AccountStatusRequestStatus;

  reviewedBy: Types.ObjectId | null;
  reviewNote: string | null;
  reviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}