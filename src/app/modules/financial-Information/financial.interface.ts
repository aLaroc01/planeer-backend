import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type FinancialItemType =
  | "account"
  | "retirementAccount"
  | "asset"
  | "debt";

export interface IFinancialItem {
  _id?: Types.ObjectId;
  itemType: FinancialItemType;
  details?: string;

  // Account or retirement account
  institution?: string;
  accountType?: string;

  // Optional classifications
  assetType?: string;
  debtType?: string;

  // Account balance, estimated asset value, or amount owed,
  // depending on itemType. Never use 0 to mean unanswered.
  amountCents?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface FINANCIAL extends Document {
  userID: IUser | Types.ObjectId;
  items: IFinancialItem[];
  createdAt: Date;
  updatedAt: Date;
}