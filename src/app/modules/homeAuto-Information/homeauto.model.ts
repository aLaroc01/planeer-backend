import { model, Schema } from "mongoose";
import {
  IHomeVehicle,
  IHomeAutoItem,
  HomeAutoItemType,
} from "./homeauto.interface";

const homeAutoItemTypes: HomeAutoItemType[] = [
  "property",
  "vehicle",
];

const homeAutoItemSchema = new Schema<IHomeAutoItem>(
  {
    itemType: {
      type: String,
      enum: homeAutoItemTypes,
      required: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    details: {
      type: String,
      trim: true,
      default: "",
    },

    propertyType: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    propertyOwnership: {
      type: String,
      trim: true,
      default: "",
    },

    estimatedValueCents: {
      type: Number,
      min: 0,
      default: undefined,
      validate: {
        validator: (value: number | undefined) =>
          value == null || Number.isSafeInteger(value),
        message:
          "Estimated value must be a whole number of cents.",
      },
    },

    deedStatus: {
      type: String,
      trim: true,
      default: "",
    },

    mortgageStatus: {
      type: String,
      trim: true,
      default: "",
    },

    propertyInsurance: {
      type: String,
      trim: true,
      default: "",
    },

    otherPropertyInsurance: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleType: {
      type: String,
      trim: true,
      default: "",
    },

    make: {
      type: String,
      trim: true,
      default: "",
    },

    model: {
      type: String,
      trim: true,
      default: "",
    },

    year: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleOwnership: {
      type: String,
      trim: true,
      default: "",
    },

    titleStatus: {
      type: String,
      trim: true,
      default: "",
    },

    vehicleInsurance: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

homeAutoItemSchema.pre("validate", function (next) {
  if (this.itemType === "property") {
    const hasIdentifier =
      Boolean(this.name?.trim()) ||
      Boolean(this.address?.trim());

    if (!this.propertyType?.trim()) {
      return next(
        new Error(
          "A property item requires a property type."
        )
      );
    }

    if (!hasIdentifier) {
      return next(
        new Error(
          "A property item requires an address or name."
        )
      );
    }
  }

  if (
    this.itemType === "vehicle" &&
    !this.vehicleType?.trim()
  ) {
    return next(
      new Error(
        "A vehicle item requires a vehicle type."
      )
    );
  }

  next();
});

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
  {
    timestamps: true,
    versionKey: false,
  }
);

export const HomeAutoModel = model<IHomeVehicle>(
  "homeauto",
  homeautoSchema
);