import { model, Schema } from "mongoose";
import {
  FINANCIAL,
  IFinancialItem,
  FinancialItemType,
} from "./financial.interface";

const financialItemTypes: FinancialItemType[] = [
  "account",
  "retirementAccount",
  "asset",
  "debt",
];

const financialItemSchema = new Schema<IFinancialItem>(
  {
    itemType: {
      type: String,
      enum: financialItemTypes,
      required: true,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
    institution: {
      type: String,
      trim: true,
      default: "",
    },
    accountType: {
      type: String,
      trim: true,
      default: "",
    },
    assetType: {
      type: String,
      trim: true,
      default: "",
    },
    debtType: {
      type: String,
      trim: true,
      default: "",
    },
    amountCents: {
      type: Number,
      min: 0,
      default: undefined,
      validate: {
        validator: (value: number | undefined) =>
          value == null || Number.isSafeInteger(value),
        message: "Amount must be a whole number of cents.",
      },
    },
  },
  { timestamps: true }
);

const financialSchema = new Schema<FINANCIAL>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [financialItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const FinancialModel = model<FINANCIAL>(
  "financial",
  financialSchema
);