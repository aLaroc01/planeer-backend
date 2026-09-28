import { model, Schema } from "mongoose";
import {
  FINANCIAL,
  IFinancialItem,
} from "./financial.interface";

const financialItemSchema = new Schema<IFinancialItem>(
  {
    itemType: {
      type: String,
      enum: ["account", "retirementAccount", "asset", "debt"],
      required: true,
    },

    institution: {
      type: String,
      trim: true,
      required: function (this: IFinancialItem) {
        return this.itemType === "account";
      },
    },

    accountType: {
      type: String,
      trim: true,
      required: function (this: IFinancialItem) {
        return this.itemType === "account";
      },
    },

    amountCents: {
      type: Number,
      min: 0,
      required: function (this: IFinancialItem) {
        return this.itemType === "account";
      },
      validate: {
        validator: (value: number | undefined) =>
          value == null || Number.isSafeInteger(value),
        message: "Amount must be a whole number of cents.",
      },
    },
  },
  {
    timestamps: true,
    // Leave _id enabled so each item can be edited/deleted by ID.
  }
);

const financialSchema = new Schema<FINANCIAL>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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