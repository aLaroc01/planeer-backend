import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type HomeAutoItemType = "property" | "vehicle";

export interface IHomeAutoItem {
  _id?: Types.ObjectId;
  itemType: HomeAutoItemType;

  // Optional user-friendly identifier.
  name?: string;

  // Applies to either type.
  details?: string;

  // Property fields.
  propertyType?: string;
  address?: string;
  propertyOwnership?: string;
  estimatedValueCents?: number;
  deedStatus?: string;
  mortgageStatus?: string;
  propertyInsurance?: string;
  otherPropertyInsurance?: string;

  // Vehicle fields.
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: string;
  vehicleOwnership?: string;
  titleStatus?: string;
  vehicleInsurance?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHomeVehicle extends Document {
  userID: IUser | Types.ObjectId;
  items: IHomeAutoItem[];
  createdAt: Date;
  updatedAt: Date;
}