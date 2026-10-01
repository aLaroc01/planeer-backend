import { model, Schema } from "mongoose";
import {
  IDigitalInfo,
  IDigitalItem,
  DigitalQuestionKey,
} from "./digital.interface";

const digitalQuestionKeys: DigitalQuestionKey[] = [
  "digitalMedia",
  "website",
  "streamingService",
];

const digitalItemSchema = new Schema<IDigitalItem>(
  {
    questionKey: {
      type: String,
      enum: digitalQuestionKeys,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

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