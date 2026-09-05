import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export interface PERSONAL extends Document{
  personalItems: string;
  collectables: string;
  personalValues: string;
  specialInstructions: string;
  sentimentalItems: string;

  userID: IUser | Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}
