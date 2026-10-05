import { Request, Response } from "express";
import { PersonalGetService, PersonalUpdateService, getPersonalForProxy } from "./personal.service";
import {
  getAuthenticatedUserId,
} from "../services/proxyAccess.service";


export const GetPersonalForProxy = async (
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
    const personal = await getPersonalForProxy(
      proxyUserId,
      grantorId
    );

    return res.status(200).json(personal);
  } catch (error: any) {
    const statusCode =
      error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(
        "Unable to get proxy personal information:",
        error
      );
    }

    return res.status(statusCode).json({
      status: "failed",
      message:
        error?.message ||
        "Unable to load personal information",
    });
  }
};
  

export const UpdatePersonal = async (req: Request, res: Response) => {
  try {
  const result = await PersonalUpdateService(req);
  
   return res.status(result.status === "success" ? 200 : 400).json(result);
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};

export const GetPersonalData = async (req: Request, res: Response) => {
  try {
      const result = await PersonalGetService(req);

      return res.status(result.status === "success" ? 200 : 400).json(result);
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};