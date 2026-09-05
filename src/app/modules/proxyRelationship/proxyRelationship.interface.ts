import mongoose, { Schema, Types, Model } from "mongoose";

export interface IRelease {
  status: "active" | "pending-release" | "released" | "rejected";
  requestedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: Types.ObjectId | null;
  reason: string;
  evidenceNote: string;
  releasedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export interface IPermissions {
  medical: boolean;
  financial: boolean;
  homeAuto: boolean;
  social: boolean;
}

export interface IProxyRelationship {
  relationshipLabel: string;
  email: string;
  phoneNumber: string;
  status: "active" | "inactive" | "pending" | "disabled";
  emergencyAccessEnabled: boolean;
  release: IRelease;
  permissions: IPermissions;
  notes: string;
  lastActivityAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const releaseSchema = new Schema<IRelease>(
  {
    status: {
      type: String,
      enum: ["active", "pending-release", "released", "rejected"],
      default: "active",
    },
    requestedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reason: { type: String, default: "", trim: true },
    evidenceNote: { type: String, default: "", trim: true },
    releasedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
  },
  { _id: false }
);

const permissionsSchema = new Schema<IPermissions>(
  {
    medical: { type: Boolean, default: false },
    financial: { type: Boolean, default: false },
    homeAuto: { type: Boolean, default: false },
    social: { type: Boolean, default: false },
  },
  { _id: false }
);

const proxyRelationshipSchema = new Schema<IProxyRelationship>(
  {
    relationshipLabel: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "disabled"],
      default: "active",
    },
    emergencyAccessEnabled: { type: Boolean, default: false },
    release: { type: releaseSchema, default: () => ({}) },
    permissions: { type: permissionsSchema, default: () => ({}) },
    notes: { type: String, default: "", trim: true },
    lastActivityAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ProxyRelationship: Model<IProxyRelationship> =
  mongoose.models.ProxyRelationship ||
  mongoose.model<IProxyRelationship>("ProxyRelationship", proxyRelationshipSchema);

export default ProxyRelationship;