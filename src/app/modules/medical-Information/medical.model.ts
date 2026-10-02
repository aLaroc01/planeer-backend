import { model, Schema } from "mongoose";
import {
  MEDICAL,
  IMedicalItem,
  MedicalQuestionKey,
} from "./medical.interface";

const medicalQuestionKeys: MedicalQuestionKey[] = [
  "healthInsurance",
  "supplementalInsurance",
  "emergencyContact",
  "allergies",
  "medications",
  "hospital",
  "knownAilments",
];

const medicalItemSchema = new Schema<IMedicalItem>(
  {
    questionKey: {
      type: String,
      enum: medicalQuestionKeys,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },

    answer: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: undefined,
    },

    relationship: {
      type: String,
      trim: true,
      default: undefined,
    },

    hospitalLocation: {
      type: String,
      trim: true,
      default: undefined,
    },
  },
  { timestamps: true }
);

medicalItemSchema.pre("validate", function (next) {
  if (
    this.questionKey !== "hospital" && 
    this.hospitalLocation
  ) {
    return next(
      new Error("hospitalLocation is only allowed for hospital items.")
    );
  }

  if (
    this.questionKey !== "emergencyContact" &&
    (this.phone || this.relationship)
  ) {
    return next(
      new Error(
        "Phone and relationship are only allowed for emergency contacts."
      )
    );
  }

  next();
});

const medicalSchema = new Schema<MEDICAL>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [medicalItemSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export const MedicalInfoModel = model<MEDICAL>(
  "MedicalInfo",
  medicalSchema
);