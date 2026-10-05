import { Request, Response } from "express";
import { DigitalGetService, DigitalInformationService, getDigitalForProxy } from "./digital.service";
import {
  getAuthenticatedUserId,
} from "../services/proxyAccess.service";


export const GetDigitalForProxy = async (req: Request, res: Response) => {
  
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
    const digital = await getDigitalForProxy(
      proxyUserId,
      grantorId
    );

    return res.status(200).json(digital);
  } catch (error: any) {
    const statusCode =
      error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(
        "Unable to get proxy digital information:",
        error
      );
    }

    return res.status(statusCode).json({
      status: "failed",
      message:
        error?.message ||
        "Unable to load digital information",
    });
  }
};



export const DigitalInformation = async (req:Request,res:Response) => {
let result = await DigitalInformationService(req);
res.json(result);
}



 export const GetDigitalData = async (req: Request, res: Response) => {
   const result = await DigitalGetService(req);
   return res.status(200).json(result);
};
        