import { Schema, model } from "mongoose";

const MedicalInfoSchema = new Schema(
  {
    healthInsurance: { type: String, trim: true, default: "" },
    supplementalInsuranceProvider: { type: String, trim: true, default: "" },
    emergencyContact: { type: String, trim: true, default: "" },
    allergies: { type: String, default: "" },
    medications: { type: String, default: "" },
    hospitalPreference: { type: String, trim: true, default: "" },
    hospitalLocation: { type: String, default: "" },
    knownAilments: { type: String, default: "" },

    userID: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  },
  { timestamps: true, versionKey: false }
);

export const MedicalInfoModel = model("MedicalInfo", MedicalInfoSchema);