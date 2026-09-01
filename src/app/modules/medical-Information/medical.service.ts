import { Request, Response } from "express";
import { MedicalModel } from "./medical.model";











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

 
    const updatedMedicalData = await MedicalModel.findOneAndUpdate(
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








export const calculateMedicalDataCompleteness = async (req: Request, res: Response) => {
  try {
    const { healthInsurance, supplementalInsurance, medications, knownAilments } = req.body;

   
    const allFields = [
      healthInsurance,
      supplementalInsurance,
      medications,
      knownAilments
    ];
    
  
    const filledFields = allFields.filter(field => field && field.trim() !== "").length;

    
    const totalFields = allFields.length;
    const completenessPercentage = (filledFields / totalFields) * 100;

   
    return res.status(200).json({
      status: "success",
      message: `Data completeness: ${completenessPercentage.toFixed(2)}%`,
      completenessPercentage: completenessPercentage.toFixed(2), 
      filledFields, 
      totalFields,  
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "failed", message: "Server error", data: error });
  }
};











export const MedicalGetService = async (req: Request) => {
  try {

    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }


    const financialData = await MedicalModel.findOne(
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
