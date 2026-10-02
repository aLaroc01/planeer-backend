import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type MedicalQuestionKey =
  | "healthInsurance"
  | "supplementalInsurance"
  | "emergencyContact"
  | "allergies"
  | "medications"
  | "hospital"
  | "knownAilments";

export interface IMedicalItem {
  _id?: Types.ObjectId;
  questionKey: MedicalQuestionKey;

  // Name of the contact, allergy, medication, condition,
  // provider, or hospital.
  title: string;

  // Optional details or notes.
  answer?: string;

  // Only used for emergency contacts.
  phone?: string;
  relationship?: string;

  // Only used for the preferred hospital.
  hospitalLocation?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface MEDICAL extends Document {
  userID: IUser | Types.ObjectId;
  items: IMedicalItem[];
  createdAt: Date;
  updatedAt: Date;
}