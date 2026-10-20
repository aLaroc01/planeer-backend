import {
  Schema,
  model,
  Types,
} from "mongoose";

export enum ArchiveRequestReason {
  INCAPACITY = "INCAPACITY",
  DEATH = "DEATH",
}

export enum ArchiveRequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export interface IArchiveRequest {
  grantorId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  connectionId: Types.ObjectId;

  reason: ArchiveRequestReason;
  status: ArchiveRequestStatus;

  requesterNote: string;

  archiveType: "temporary" | "permanent" | null;
  archiveExpiresAt: Date | null;
  archiveEndedAt: Date | null;
  archiveEndReason: ArchiveEndReason | null;

  archiveEndedBy: Types.ObjectId | null;
  archiveEndNote: string;

  // References to verified private uploads,
  // not public URLs or arbitrary client-supplied paths.
  evidenceFileIds: Types.ObjectId[];

  reviewedBy: Types.ObjectId | null;
  reviewedAt: Date | null;
  reviewNote: string;

  createdAt: Date;
  updatedAt: Date;
}

export enum ArchiveEndReason {
  EXPIRED = "EXPIRED",
  ADMIN_RESTORED = "ADMIN_RESTORED",
}

const archiveRequestSchema = new Schema<IArchiveRequest>(
  {
    grantorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    connectionId: {
      type: Schema.Types.ObjectId,
      ref: "Connection",
      required: true,
    },

    reason: {
      type: String,
      enum: Object.values(ArchiveRequestReason),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(ArchiveRequestStatus),
      default: ArchiveRequestStatus.PENDING,
      required: true,
    },

    requesterNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    evidenceFileIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },

    archiveType: {
      type: String,
      enum: ["temporary", "permanent"],
      default: null,
    },

    archiveExpiresAt: {
      type: Date,
      default: null,
    },

    archiveEndedAt: {
      type: Date,
      default: null,
    },

    archiveEndReason: {
      type: String,
      enum: Object.values(ArchiveEndReason),
      default: null,
    },

    archiveEndedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archiveEndNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Only one pending request per grantor.
// Approved/rejected requests remain as history.
archiveRequestSchema.index(
  { grantorId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: ArchiveRequestStatus.PENDING,
    },
  },
);

export const ArchiveRequest = model<IArchiveRequest>(
  "ArchiveRequest",
  archiveRequestSchema,
);