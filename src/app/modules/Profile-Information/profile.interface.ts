import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export interface ISuggestionProgress {
  key: string;
  completed: boolean;
  completedAt?: Date | null;
  dismissed: boolean;
  dismissedAt?: Date | null;
}

export type ProfileMainRole = "GRANTOR" | "PROXY";

export interface PROFILE extends Document {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  phoneNumber: string;
  mainRole: ProfileMainRole;
  imgUrl?: string | null;

  suggestions: ISuggestionProgress[];

  userID: IUser | Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}