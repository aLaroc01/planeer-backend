import { Request, Response } from "express";
import {   MedicalGetService, MedicalUpdateService, getMedicalForProxy } from "./medical.service";
import {
  getAuthenticatedUserId,
} from "../services/proxyAccess.service";


export const GetMedicalForProxy = async (
  req: Request,
  res: Response
) => {
  const proxyUserId = getAuthenticatedUserId(
    req.user
  );

  const grantorId = String(
    req.params.grantorId || ""
  ).trim();

  if (!proxyUserId) {
    return res.status(401).json({
      status: "failed",
      message: "Unauthorized access",
    });
  }

  if (!grantorId) {
    return res.status(400).json({
      status: "failed",
      message: "Grantor ID is required",
    });
  }

  try {
    const medical = await getMedicalForProxy(
      proxyUserId,
      grantorId
    );

    return res.status(200).json(medical);
  } catch (error: any) {
    const statusCode =
      error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(
        "Unable to get proxy medical information:",
        error
      );
    }

    return res.status(statusCode).json({
      status: "failed",
      message:
        error?.message ||
        "Unable to load medical information",
    });
  }
};


export const UpdateMedical=async (req:Request,res:Response) => {
    let result = await MedicalUpdateService(req);
    res.json(result);

}


 export const GetMedicalData = async (req: Request, res: Response) => {
        const result = await MedicalGetService(req);
        return res.status(200).json(result);
 };
        