import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export interface ISuggestionProgress {
  key: string;
  completed: boolean;
  completedAt?: Date | null;
  dismissed: boolean;
  dismissedAt?: Date | null;
}

export interface PROFILE extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phoneNumber: string;
  mainRole: string;
  imgUrl: string;

  profilePercentage: number;

  suggestions: ISuggestionProgress[];

  userID: IUser | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}