import { PersonalModel } from "./personal.model";
import { Request } from "express";
import { Types } from "mongoose";

export const PersonalUpdateService = async (req: Request) => {
  try {
    let user_id = req.user?.id;
    if (!user_id) {
      return {
        status: "failed",
        message: "Unauthorized",
      };
    }

    if (Array.isArray(req.body?.items)) {
      const allowedTypes = new Set([
        "valuable",
        "collectible",
        "sentimental",
        "generalInstructions",
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
            throw new Error("Invalid personal item.");
          }

          const item = rawItem as Record<string, unknown>;

          if (
            typeof item.itemType !== "string" ||
            !allowedTypes.has(item.itemType)
          ) {
            throw new Error("Invalid personal item type.");
          }

          const name = text(item, "name");

          if (
            item.itemType !== "generalInstructions" &&
            !name
          ) {
            throw new Error(
              "Each personal item needs a name."
            );
          }

          const cleaned: Record<string, unknown> = {
            itemType: item.itemType,
            name,
            description: text(item, "description"),
            location: text(item, "location"),
            wishes: text(item, "wishes"),
            instructions: text(item, "instructions"),
          };

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
                "Invalid estimated value."
              );
            }

            cleaned.estimatedValueCents =
              item.estimatedValueCents;
          }

          if (item._id !== undefined) {
            if (
              typeof item._id !== "string" ||
              !/^[a-f\d]{24}$/i.test(item._id) ||
              !Types.ObjectId.isValid(item._id)
            ) {
              throw new Error(
                "Invalid personal item ID."
              );
            }

            cleaned._id = item._id;
          }

          return cleaned;
        }
      );

      let document = await PersonalModel.findOne({
        userID: user_id,
      });

      if (!document) {
        document = new PersonalModel({
          userID: user_id,
        });
      }

      document.set("items", items);
      await document.save();

      return {
        status: "success",
        message: "Personal items updated successfully.",
        data: document,
      };
    }

    const token = req.headers.authorization?.split(" ")[1] || null;

    const answers = req.body.answers || [];

    const updateData = {
      userID: user_id,
      ...Object.fromEntries(
        answers.map((item: { key: string; answer: any }) => [item.key, item.answer])
      ),
    };

    const updatedPersonalData = await PersonalModel.findOneAndUpdate(
      { userID: user_id },
      { $set: updateData },
      { upsert: true, new: true }
    );


    return {
      status: "success",
      message: `Personal data updated successfully`,
      updatedPersonalData,
      token: token
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};

export const PersonalGetService = async (req: Request) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }


    const personalData = await PersonalModel.findOne(
      { userID: user_id },
      "-createdAt -updatedAt"
    );

    if (!personalData) {
      return { status: "failed", message: "No personal data found" };
    } 
    return {
      status: "success",
      data: personalData,
    };
    // const user_id = req.user?.id;

    // if (!user_id) {
    //   return { status: "failed", message: "Unauthorized" };
    // }

    // const personalData = await PersonalModel.findOne(
    //   { userID: user_id },
    //   "-createdAt -updatedAt"
    // );

    // if (!personalData) {
    //   return { status: "failed", message: "No personal data found" };
    // }

    // return {
    //   status: "success",
    //   data: personalData,
    // };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};