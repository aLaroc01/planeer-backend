import { model, Schema } from "mongoose";
import {
  IHomeVehicle,
  IHomeAutoItem,
  HomeAutoItemType,
  POWER_TOYS,
} from "./homeauto.interface";

const homeAutoItemTypes: HomeAutoItemType[] = [
  "vehicle",
  "home",
  "powerToy",
];

const homeAutoItemSchema = new Schema<IHomeAutoItem>(
  {
    itemType: {
      type: String,
      enum: homeAutoItemTypes,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },

    vehicleOwnership: { type: String, trim: true },
    vehicleMakeModel: { type: String, trim: true },
    hasCarInsurance: { type: String, trim: true },
    carInsuranceProvider: { type: String, trim: true },
    carTitle: { type: String, trim: true },
    carRegisteredIn: { type: String, trim: true },

    homeOccupancy: { type: String, trim: true },
    homeLocation: { type: String, trim: true },
    homeInsuranceType: { type: String, trim: true },

    powerToyType: {
      type: String,
      enum: POWER_TOYS,
    },
  },
  { timestamps: true }
);

const homeautoSchema = new Schema<IHomeVehicle>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [homeAutoItemSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

export const HomeAutoModel = model<IHomeVehicle>(
  "homeauto",
  homeautoSchema
);