import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type DigitalItemType =
  | "subscription"
  | "emailAccount"
  | "website"
  | "digitalAsset";

export interface IDigitalItem {
  _id?: Types.ObjectId;
  itemType: DigitalItemType;

  // Subscription, website, or digital-asset name.
  name?: string;

  // Subscription only.
  category?: string;

  // Email account, or optional subscription account email.
  email?: string;

  // Email-account provider only.
  provider?: string;

  // Website only.
  url?: string;

  // Other-digital-asset classification.
  assetType?: string;

  // General optional notes.
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDigitalInfo extends Document {
  userID: IUser | Types.ObjectId;
  items: IDigitalItem[];
  createdAt: Date;
  updatedAt: Date;
}