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
  title: string;
  answer: string;
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