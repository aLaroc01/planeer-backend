import { model, Schema } from "mongoose";
import { IDigitalInfo } from "./digital.interface";

const DigitalInfoSchema = new Schema<IDigitalInfo>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    digitalMedia: {
      type: String,
      trim: true,
      default: undefined,
    },
    website: {
      type: String,
      trim: true,
      default: undefined,
    },
    streamingService: {
      type: String,
      trim: true,
      default: undefined,
    },
    digitalInfoPercentage: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

export const DigitalInfoModel = model<IDigitalInfo>("digitalInfo", DigitalInfoSchema);