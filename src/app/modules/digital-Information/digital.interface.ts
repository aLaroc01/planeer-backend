import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type DigitalQuestionKey =
  | "digitalMedia"
  | "website"
  | "streamingService";

export interface IDigitalItem {
  _id?: Types.ObjectId;
  questionKey: DigitalQuestionKey;
  title: string;
  answer: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDigitalInfo extends Document {
  userID: IUser | Types.ObjectId;
  items: IDigitalItem[];
  createdAt: Date;
  updatedAt: Date;
}