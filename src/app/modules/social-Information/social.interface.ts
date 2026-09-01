import { Types } from "mongoose";
import { IUser } from "../auth/user.interface";



export interface ISocialInfo extends Document {
  userID: IUser | Types.ObjectId;
  socialMedia?: string;       
  website?: string;   
  socialInfoPercentage:number; 
  streamingService?: string;  
}