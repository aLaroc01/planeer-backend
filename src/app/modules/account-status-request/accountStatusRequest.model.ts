import { model, Schema } from "mongoose";
import { AccountStatus } from "../auth/user.interface";
import {
  AccountStatusRequestStatus,
  IAccountStatusRequest,
} from "./accountStatusRequest.interface";

const accountStatusRequestSchema =
  new Schema<IAccountStatusRequest>(
    {
      targetUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      requestedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      fromStatus: {
        type: String,
        enum: Object.values(AccountStatus),
        required: true,
      },

      requestedStatus: {
        type: String,
        enum: [
          AccountStatus.ACTIVE,
          AccountStatus.SUSPENDED,
          AccountStatus.DEACTIVATED,
        ],
        required: true,
      },

      internalNote: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 2000,
      },

      status: {
        type: String,
        enum: Object.values(AccountStatusRequestStatus),
        default: AccountStatusRequestStatus.PENDING,
        required: true,
      },

      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewNote: {
        type: String,
        trim: true,
        minlength: 10,
        maxlength: 2000,
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

accountStatusRequestSchema.index(
  { targetUserId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: AccountStatusRequestStatus.PENDING,
    },
    name: "one_pending_status_request_per_user",
  },
);

accountStatusRequestSchema.index({
  status: 1,
  createdAt: -1,
});

accountStatusRequestSchema.index({
  requestedBy: 1,
  createdAt: -1,
});

export const AccountStatusRequest =
  model<IAccountStatusRequest>(
    "AccountStatusRequest",
    accountStatusRequestSchema,
  );