import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export const POWER_TOYS = ["ATV", "Boat", "Motorcycle"] as const;
export type TPowerToy = (typeof POWER_TOYS)[number];

export type HomeAutoItemType = "vehicle" | "home" | "powerToy";

export interface IHomeAutoItem {
  _id?: Types.ObjectId;
  itemType: HomeAutoItemType;
  title: string;

  // Vehicle entry
  vehicleOwnership?: string;
  vehicleMakeModel?: string;
  hasCarInsurance?: string;
  carInsuranceProvider?: string;
  carTitle?: string;
  carRegisteredIn?: string;

  // Home entry
  homeOccupancy?: string;
  homeLocation?: string;
  homeInsuranceType?: string;

  // ATV, boat, or motorcycle entry
  powerToyType?: TPowerToy;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IHomeVehicle extends Document {
  userID: IUser | Types.ObjectId;
  items: IHomeAutoItem[];
  createdAt: Date;
  updatedAt: Date;
}