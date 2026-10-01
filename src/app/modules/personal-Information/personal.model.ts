import { model, Schema } from "mongoose";
import {
  PERSONAL,
  IPersonalItem,
  PersonalQuestionKey,
} from "./personal.interface";

const personalQuestionKeys: PersonalQuestionKey[] = [
  "personalItems",
  "collectables",
  "personalValues",
  "specialInstructions",
  "sentimentalItems",
];

const personalItemSchema = new Schema<IPersonalItem>(
  {
    questionKey: {
      type: String,
      enum: personalQuestionKeys,
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