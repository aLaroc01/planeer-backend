import { Document, Types } from "mongoose";

export enum AuditAction {
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",

  USER_STATUS_CHANGE_REQUESTED = "USER_STATUS_CHANGE_REQUESTED",
  USER_STATUS_REQUEST_APPROVED = "USER_STATUS_REQUEST_APPROVED",
  USER_STATUS_REQUEST_REJECTED = "USER_STATUS_REQUEST_REJECTED",
}

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  targetUserId: Types.ObjectId;

  action: AuditAction;
  changedFields: string[];

  before: {
    role?: string;
    accountStatus?: string;
    phoneNumber?: string;
  };

  after: {
    role?: string;
    accountStatus?: string;
    phoneNumber?: string;
  };

  reason?: string;
  statusChangeRequestId?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}