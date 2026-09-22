import { Types } from "mongoose";
import { IUser } from "../auth/user.interface";



export interface IDigitalInfo extends Document {
  userID: IUser | Types.ObjectId;
  digitalMedia?: string;       
  website?: string;   
  digitalInfoPercentage:number; 
  streamingService?: string;  
}