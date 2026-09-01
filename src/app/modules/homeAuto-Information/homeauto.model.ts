


// for mongoose model

import { model, Schema, Types } from 'mongoose'

import { string } from 'zod';
import { IHomeVehicle } from './homeauto.interface';




const homeautoSchema =  new Schema<IHomeVehicle>({
     // Vehicle
    vehicleOwnership: {
      type: String,
      default: undefined,
    },
    vehicleMakeModel: {
      type: String,
      trim: true,
      default: undefined,
    },
    hasCarInsurance: {
      type: String,
      default: undefined,
    },
    carInsuranceProvider: {
      type: String,
      trim: true,
      default: undefined,
    },

    // ATV / Boat / Motorcycle
    hasPowerToys: {
      type: String,
      default: undefined,
    },
    powerToyTypes: {
      type: String,
      default: undefined,
    },

    // Home
    homeOccupancy: {
      type: String,
      default: undefined,
    },
    hasHomeInsurance: {
      type: String,
      default: undefined,
    },
    homeInsuranceType: {
      type: String,
      default: undefined,
    },
  
    homeautoPercentage: { type: Number },
    userID: { type: Types.ObjectId,   ref: 'User', required: true},

    },{
    timestamps: true, versionKey: false
})

export const HomeAutoModel = model<IHomeVehicle>("homeauto", homeautoSchema);