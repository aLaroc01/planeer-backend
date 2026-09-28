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

  // Fields for itemType === "account"
  institution?: string;
  accountType?: string;
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