import { Schema, model, models } from "mongoose";

export const SUPPORT_ISSUES = [
  "General Inquiry",
  "Feedback",
  "Account Access",
  "Other",
] as const;

const supportRequestSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },
    issue: {
      type: String,
      enum: SUPPORT_ISSUES,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    status: {
      type: String,
      enum: ["Open", "Completed"],
      default: "Open",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

supportRequestSchema.index({ status: 1, createdAt: -1 });

export const SupportRequest =
  models.SupportRequest ||
  model("SupportRequest", supportRequestSchema);