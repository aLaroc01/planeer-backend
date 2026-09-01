import { Request } from "express";
import { SocialInfoModel } from "./social.model";






export const SocialInformationService = async (req: Request) => {
  try {
    let user_id = req.user?.id;
    let requestBody = req.body;
    requestBody.userID = user_id;
    
  
    const token = req.headers.authorization?.split(" ")[1] || null;

    const allFields = [
      requestBody.socialMedia,
      requestBody.website,
      requestBody.streamingService
     
    ];

    const filledFields = allFields.filter(field => field && field.trim() !== "").length;

   
    const totalFields = allFields.length;
    const completenessPercentage = (filledFields / totalFields) * 100;

  
    const updatedMedicalData = await SocialInfoModel.findOneAndUpdate(
      { userID: user_id },
         { 
        ...requestBody, 
        socialInfoPercentage: completenessPercentage  
      },
      { upsert: true, new: true }
    );

    return {
      status: "success",
      message: `Medical data updated successfully ${completenessPercentage.toFixed(2)}%`,
      socialInfoPercentage: completenessPercentage.toFixed(2),  
      updatedMedicalData,
      token: token
     
    };
  } catch (error) {
    return { status: 'failed', data: error,};
  }
};






export const SocialGetService = async (req: Request) => {
  try {

    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }


    const financialData = await SocialInfoModel.findOne(
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
