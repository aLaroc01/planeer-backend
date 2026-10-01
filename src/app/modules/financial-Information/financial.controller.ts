import { Request, Response } from "express";
import {  FinancialGetService, FinancialUpdateService, getFinancialForProxy } from "./financial.service";






 export const UpdateFinancial=async (req:Request,res:Response) => {
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
  const proxyUserId = req.user?.id?.toString();
  const grantorId = req.params.grantorId;

  if (!proxyUserId) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  if (!grantorId || typeof grantorId !== "string") {
    return res.status(400).json({ message: "Grantor ID is required" });
  }

  try {
    const financial = await getFinancialForProxy(proxyUserId, grantorId);

    if (!financial) {
      return res.status(404).json({ message: "Financial information not found" });
    }

    return res.status(200).json(financial);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Financial information is not available to this proxy."
    ) {
      return res.status(403).json({ message: error.message });
    }

    console.error("Unable to get proxy financial information:", error);
    return res.status(500).json({ message: "Unable to load financial information" });
  }
};






 



