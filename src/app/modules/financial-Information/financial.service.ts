
import { User } from "../auth/user.model";
import { HomeAutoModel } from "../homeAuto-Information/homeauto.model";
import { MedicalInfoModel } from "../medical-Information/medical.model";
import { DigitalInfoModel } from "../digital-Information/digital.model";
import { FinancialModel } from "./financial.model";
import { Request } from "express";
import Connection from "../connections/connection.model";
import { Types } from "mongoose";


export const getFinancialForProxy = async (
  proxyUserId: string,
  grantorId: string
) => {
  const connection = await Connection.findOne({
    proxyUserId,
    grantorId,
    status: "active",
    releaseStatus: "released",
    preauthorizedReleaseEnabled: true,
    preauthorizedReleaseCategories: "financial",
  });

  if (!connection) {
    throw new Error("Financial information is not available to this proxy.");
  }

  return FinancialModel.findOne({ userID: grantorId })
    .select("userID items")
    .lean();
};



export const FinancialUpdateService = async (req: Request) => {
  try {
    const user_id = req.user?.id;
    const requestBody = req.body;
    requestBody.userID = user_id;
     
    const token = req.headers.authorization?.split(" ")[1] || null;

    if (Array.isArray(req.body?.items)) {
      const allowedTypes = new Set([
        "account",
        "retirementAccount",
        "asset",
        "debt",
      ]);

      const items = req.body.items.map((item: any) => {
        if (
          !item ||
          typeof item !== "object" ||
          !allowedTypes.has(item.itemType)
        ) {
          throw new Error("Invalid financial item type.");
        }

        if (
          item._id !== undefined &&
          !Types.ObjectId.isValid(item._id)
        ) {
          throw new Error("Invalid financial item ID.");
        }

        if (
          item.amountCents !== undefined &&
          (!Number.isSafeInteger(item.amountCents) ||
            item.amountCents < 0)
        ) {
          throw new Error("Invalid financial item amount.");
        }

        const cleaned: Record<string, unknown> = {
          itemType: item.itemType,
          details:
            typeof item.details === "string"
              ? item.details.trim()
              : "",
          institution:
            typeof item.institution === "string"
              ? item.institution.trim()
              : "",
          accountType:
            typeof item.accountType === "string"
              ? item.accountType.trim()
              : "",
          assetType:
            typeof item.assetType === "string"
              ? item.assetType.trim()
              : "",
          debtType:
            typeof item.debtType === "string"
              ? item.debtType.trim()
              : "",
        };

        if (item._id !== undefined) {
          cleaned._id = item._id;
        }

        if (item.amountCents !== undefined) {
          cleaned.amountCents = item.amountCents;
        }

        return cleaned;
      });

      const updatedFinancialData =
        await FinancialModel.findOneAndUpdate(
          { userID: user_id },
          { $set: { items } },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

      return {
        status: "success",
        message: "Financial items updated successfully",
        data: updatedFinancialData,
      };
    }
 
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


