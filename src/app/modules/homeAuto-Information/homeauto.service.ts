import { Request } from "express";
import { Types } from "mongoose";
import { HomeAutoModel } from "./homeauto.model";


export const HomeAutoService = async (req: Request) => {
  try {
    let user_id = req.user?.id;
    if (!user_id) {
      return {
        status: "failed",
        message: "Unauthorized",
      };
    }

    if (Array.isArray(req.body?.items)) {
      const allowedItemTypes = new Set([
        "property",
        "vehicle",
      ]);

      const text = (
        item: Record<string, unknown>,
        field: string
      ) => {
        const value = item[field];

        if (value === undefined) {
          return "";
        }

        if (typeof value !== "string") {
          throw new Error(`Invalid ${field} value.`);
        }

        return value.trim();
      };

      const items = req.body.items.map(
        (rawItem: unknown) => {
          if (
            !rawItem ||
            typeof rawItem !== "object" ||
            Array.isArray(rawItem)
          ) {
            throw new Error("Invalid Home/Auto item.");
          }

          const item = rawItem as Record<string, unknown>;

          if (
            typeof item.itemType !== "string" ||
            !allowedItemTypes.has(item.itemType)
          ) {
            throw new Error("Invalid Home/Auto item type.");
          }

          const cleaned: Record<string, unknown> = {
            itemType: item.itemType,
            name: text(item, "name"),
            details: text(item, "details"),
          };

          if (item.itemType === "property") {
            const propertyType = text(
              item,
              "propertyType"
            );
            const address = text(item, "address");

            if (!propertyType) {
              throw new Error(
                "Each property needs a property type."
              );
            }

            if (!cleaned.name && !address) {
              throw new Error(
                "Each property needs an address or name."
              );
            }

            cleaned.propertyType = propertyType;
            cleaned.address = address;
            cleaned.propertyOwnership = text(
              item,
              "propertyOwnership"
            );
            cleaned.deedStatus = text(
              item,
              "deedStatus"
            );
            cleaned.mortgageStatus = text(
              item,
              "mortgageStatus"
            );
            cleaned.propertyInsurance = text(
              item,
              "propertyInsurance"
            );
            cleaned.otherPropertyInsurance = text(
              item,
              "otherPropertyInsurance"
            );

            if (
              item.estimatedValueCents !== undefined
            ) {
              if (
                !Number.isSafeInteger(
                  item.estimatedValueCents
                ) ||
                (item.estimatedValueCents as number) < 0
              ) {
                throw new Error(
                  "Invalid estimated property value."
                );
              }

              cleaned.estimatedValueCents =
                item.estimatedValueCents;
            }
          }

          if (item.itemType === "vehicle") {
            const vehicleType = text(
              item,
              "vehicleType"
            );

            if (!vehicleType) {
              throw new Error(
                "Each vehicle needs a vehicle type."
              );
            }

            const year = text(item, "year");

            if (year && !/^\d{4}$/.test(year)) {
              throw new Error(
                "Vehicle year must be four digits."
              );
            }

            cleaned.vehicleType = vehicleType;
            cleaned.make = text(item, "make");
            cleaned.model = text(item, "model");
            cleaned.year = year;
            cleaned.vehicleOwnership = text(
              item,
              "vehicleOwnership"
            );
            cleaned.titleStatus = text(
              item,
              "titleStatus"
            );
            cleaned.vehicleInsurance = text(
              item,
              "vehicleInsurance"
            );
          }

          if (item._id !== undefined) {
            if (
              typeof item._id !== "string" ||
              !/^[a-f\d]{24}$/i.test(item._id) ||
              !Types.ObjectId.isValid(item._id)
            ) {
              throw new Error(
                "Invalid Home/Auto item ID."
              );
            }

            cleaned._id = item._id;
          }

          return cleaned;
        }
      );

      let document = await HomeAutoModel.findOne({
        userID: user_id,
      });

      if (!document) {
        document = new HomeAutoModel({
          userID: user_id,
        });
      }

      document.set("items", items);
      await document.save();

      return {
        status: "success",
        message:
          "Home and vehicle items updated successfully.",
        data: document,
      };
    }
    let requestBody = req.body;
    requestBody.userID = user_id;
    // Token middleware থেকে আসে
    const token = req.headers.authorization?.split(" ")[1] || null;

    const allFields = [
      requestBody.vehicleOwnership,
      requestBody.vehicleMakeModel,
      requestBody.hasCarInsurance,
      requestBody.carInsuranceProvider,
      requestBody.hasPowerToys,
      requestBody.powerToyTypes,
      requestBody.homeOccupancy,
      requestBody.hasHomeInsurance,
      requestBody.homeInsuranceType
    ];

    const filledFields = allFields.filter(field => {

      if (typeof field === 'string') {
        return field.trim() !== "";  
      } else {

        return field !== undefined && field !== null && field !== "";
      }
    }).length;

   
    const totalFields = allFields.length;
    const completenessPercentage = (filledFields / totalFields) * 100;

   
    const updatedMedicalData = await HomeAutoModel.findOneAndUpdate(
      { userID: user_id },
      { 
        ...requestBody, 
        homeautoPercentage: completenessPercentage  // ✅ fixed
      },
      { upsert: true, new: true }
    );

    return {
      status: "success",
      message: `HomeAuto data updated successfully ${completenessPercentage.toFixed(2)}%`,
      homeautoPercentage: completenessPercentage.toFixed(2),  // Percentage result
      updatedMedicalData,
      token: token
    };
  } catch (error) {
    console.error('Error:', error);  // Log the error to debug
    return { status: 'failed', data: error };
  }
};


export const HomeautoGetService = async (req: Request) => {
  try {

    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }


    const financialData = await HomeAutoModel.findOne(
      { userID: user_id },
      "-createdAt -updatedAt"
    );

    if (!financialData) {
      return { status: "failed", message: "No Home/Auto data found" };
    }

    return {
      status: "success",
      data: financialData,
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};
