import { Document, Types } from "mongoose";

export enum AuditAction {
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_STATUS_CHANGED = "USER_STATUS_CHANGED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
}

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  targetUserId: Types.ObjectId;

  action: AuditAction;
  changedFields: string[];

  before: {
    role?: string;
    accountStatus?: string;
  };

  after: {
    role?: string;
    accountStatus?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}