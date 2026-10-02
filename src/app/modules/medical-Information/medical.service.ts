import { Request, Response } from "express";
import { MedicalInfoModel } from "./medical.model";
import { Types } from "mongoose";


export const MedicalUpdateService = async (req: Request) => {
  try {
    let user_id = req.user?.id;
    let requestBody = req.body;
    requestBody.userID = user_id;
 
    const token = req.headers.authorization?.split(" ")[1] || null;


    const allFields = [
      requestBody.healthInsurance,
      requestBody.supplementalInsurance,
      requestBody.medications,
      requestBody.knownAilments
    ];

    
    const filledFields = allFields.filter(field => field && field.trim() !== "").length;

  
    const totalFields = allFields.length;
    const completenessPercentage = (filledFields / totalFields) * 100;

 
    const updatedMedicalData = await MedicalInfoModel.findOneAndUpdate(
      { userID: user_id },
       { 
        ...requestBody, 
        medicalsPercentage: completenessPercentage 
      },
      { upsert: true, new: true }
    );

    return {
      status: "success",
      message: `Medical data updated successfully ${completenessPercentage.toFixed(2)}%`,
      medicalsPercentage: completenessPercentage.toFixed(2),  
      updatedMedicalData,
       token: token
    };
  } catch (error) {
    return { status: 'failed', data: error };
  }
};

export const MedicalGetService = async (req: Request) => {
  try {

    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }


    const medicalData = await MedicalInfoModel.findOne(
      { userID: user_id },
      "-createdAt -updatedAt"
    );

    if (!medicalData) {
      return { status: "failed", message: "No medical data found" };
    }

    return {
      status: "success",
      data: medicalData,
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};

