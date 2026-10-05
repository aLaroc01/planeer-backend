import { Request, Response } from "express";
import {  FinancialGetService, FinancialUpdateService, getFinancialForProxy } from "./financial.service";
import {
  getAuthenticatedUserId,
} from "../services/proxyAccess.service";



export const UpdateFinancial = async (req:Request,res:Response) => {
    let result = await FinancialUpdateService(req);
    res.json(result);

}


export const GetFinancialData = async (req: Request, res: Response) => {
  const result = await FinancialGetService(req);
  return res.status(200).json(result);
};


export const GetFinancialForProxy = async (
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
    const financial = await getFinancialForProxy(
      proxyUserId,
      grantorId
    );

    return res.status(200).json(financial);
  } catch (error: any) {
    const statusCode =
      error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(
        "Unable to get proxy financial information:",
        error
      );
    }

    return res.status(statusCode).json({
      status: "failed",
      message:
        error?.message ||
        "Unable to load financial information",
    });
  }
};





 



