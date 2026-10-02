import { model, Schema } from "mongoose";
import {
  IDigitalInfo,
  IDigitalItem,
  DigitalItemType,
} from "./digital.interface";

const digitalItemTypes: DigitalItemType[] = [
  "subscription",
  "emailAccount",
  "website",
  "digitalAsset",
];

const digitalItemSchema = new Schema<IDigitalItem>(
  {
    itemType: {
      type: String,
      enum: digitalItemTypes,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    provider: {
      type: String,
      trim: true,
      default: "",
    },

    url: {
      type: String,
      trim: true,
      default: "",
    },

    assetType: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

digitalItemSchema.pre("validate", function (next) {
  if (
    this.itemType === "emailAccount" &&
    !this.email?.trim()
  ) {
    return next(
      new Error(
        "An email account requires an email address."
      )
    );
  }

  if (
    this.itemType !== "emailAccount" &&
    !this.name?.trim()
  ) {
    return next(
      new Error(
        "This digital item requires a name."
      )
    );
  }

  next();
});

const DigitalInfoSchema = new Schema<IDigitalInfo>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [digitalItemSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

export const DigitalInfoModel = model<IDigitalInfo>(
  "digitalInfo",
  DigitalInfoSchema
);