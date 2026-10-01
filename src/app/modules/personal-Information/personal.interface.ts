import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type PersonalQuestionKey =
  | "personalItems"
  | "collectables"
  | "personalValues"
  | "specialInstructions"
  | "sentimentalItems";

export interface IPersonalItem {
  _id?: Types.ObjectId;
  questionKey: PersonalQuestionKey;
  title: string;
  answer: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PERSONAL extends Document {
  userID: IUser | Types.ObjectId;
  items: IPersonalItem[];
  createdAt: Date;
  updatedAt: Date;
}