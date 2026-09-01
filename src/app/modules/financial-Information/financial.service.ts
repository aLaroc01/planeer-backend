
import { User } from "../auth/user.model";
import { HomeAutoModel } from "../homeAuto-Information/homeauto.model";
import { MedicalModel } from "../medical-Information/medical.model";
import { SocialInfoModel } from "../social-Information/social.model";
import { FinancialModel } from "./financial.model";
import { Request } from "express";









export const FinancialUpdateService = async (req: Request) => {
  try {
    const user_id = req.user?.id;
    const requestBody = req.body;
    requestBody.userID = user_id;
     
    const token = req.headers.authorization?.split(" ")[1] || null;
 
    const allFields = [
      requestBody.bankAccount,
      requestBody.retirementAccount,
      requestBody.currentAssets,
      requestBody.debt,
    ];

  
    const filledFields = allFields.filter(
      (field) => typeof field === "string" && field.trim() !== ""
    ).length;

    const totalFields = allFields.length;
    const completenessPercentage = (filledFields / totalFields) * 100;

    const updatedFinancialData = await FinancialModel.findOneAndUpdate(
      { userID: user_id },
      { 
        ...requestBody, 
        financialPercentage: completenessPercentage  
      },
      { upsert: true, new: true }
    );

    return {
      status: "success",
      message: `Financial data updated successfully (${completenessPercentage.toFixed(2)}%)`,
      financialPercentage: completenessPercentage.toFixed(2),
      updatedFinancialData,
      token: token
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};






export const FinancialGetService = async (req: Request) => {
  try {

    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }


    const financialData = await FinancialModel.findOne(
      { userID: user_id },
      "-createdAt -updatedAt"
    );

    if (!financialData) {
      return { status: "failed", message: "No financial data found" };
    }

    return {
      status: "success",
      data: financialData,
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};































