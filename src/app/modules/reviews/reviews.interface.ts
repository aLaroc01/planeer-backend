import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export interface Review extends Document{
  comment: string;
  rating: number;
  userID: IUser | Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}
// export interface ServiceResponse<T = any> {
//   status: boolean;
//   message: string;
//   data?: T;
// }