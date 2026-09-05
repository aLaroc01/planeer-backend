import { model, Schema, Types } from "mongoose";
import {
  AuditAction,
  IAuditLog,
} from "./auditLog.interface";

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },

    changedFields: {
      type: [String],
      default: [],
    },

    before: {
      role: { type: String },
      accountStatus: { type: String },
    },

    after: {
      role: { type: String },
      accountStatus: { type: String },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);