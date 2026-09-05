import { PersonalModel } from "./personal.model";
import { Request } from "express";

export const PersonalUpdateService = async (req: Request) => {
  try {
    let user_id = req.user?.id;
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
      message: `Financial data updated successfully`,
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
      return { status: "failed", message: "No financial data found" };
    }
    console.log("ProfileGetService called. Retrieved profile data:", personalData);  
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