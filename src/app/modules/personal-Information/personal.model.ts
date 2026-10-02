import { model, Schema } from "mongoose";
import {
  PERSONAL,
  IPersonalItem,
  PersonalItemType,
} from "./personal.interface";

const personalItemTypes: PersonalItemType[] = [
  "valuable",
  "collectible",
  "sentimental",
  "generalInstructions",
];

const personalItemSchema = new Schema<IPersonalItem>(
  {
    itemType: {
      type: String,
      enum: personalItemTypes,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    estimatedValueCents: {
      type: Number,
      min: 0,
      default: undefined,
      validate: {
        validator: (value: number | undefined) =>
          value == null || Number.isSafeInteger(value),
        message:
          "Estimated value must be a whole number of cents.",
      },
    },

    wishes: {
      type: String,
      trim: true,
      default: "",
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

personalItemSchema.pre("validate", function (next) {
  if (
    this.itemType !== "generalInstructions" &&
    !this.name?.trim()
  ) {
    return next(
      new Error(
        "Each personal item requires a name."
      )
    );
  }

  next();
});

const personalSchema = new Schema<PERSONAL>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [personalItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const PersonalModel = model<PERSONAL>(
  "personal",
  personalSchema
);