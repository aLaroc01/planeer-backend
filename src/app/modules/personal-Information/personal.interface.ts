import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type PersonalItemType =
  | "valuable"
  | "collectible"
  | "sentimental"
  | "generalInstructions";

export interface IPersonalItem {
  _id?: Types.ObjectId;
  itemType: PersonalItemType;

  // Required for valuables, collectibles,
  // and sentimental items.
  name?: string;

  description?: string;
  location?: string;
  estimatedValueCents?: number;
  wishes?: string;

  // Used only for the single General wishes card.
  instructions?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface PERSONAL extends Document {
  userID: IUser | Types.ObjectId;
  items: IPersonalItem[];
  createdAt: Date;
  updatedAt: Date;
}