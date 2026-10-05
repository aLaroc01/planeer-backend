import { Request, Response } from "express";
import { HomeautoGetService, HomeAutoService, getHomeAutoForProxy } from "./homeauto.service";
import {
  getAuthenticatedUserId,
} from "../services/proxyAccess.service";


export const GetHomeAutoForProxy = async (
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
    const homeAuto = await getHomeAutoForProxy(
      proxyUserId,
      grantorId
    );

    return res.status(200).json(homeAuto);
  } catch (error: any) {
    const statusCode =
      error?.statusCode || 500;

    if (statusCode >= 500) {
      console.error(
        "Unable to get proxy home and auto information:",
        error
      );
    }

    return res.status(statusCode).json({
      status: "failed",
      message:
        error?.message ||
        "Unable to load home and auto information",
    });
  }
};



 export const HomeAutoUpdate=async (req:Request,res:Response) => {
    let result = await HomeAutoService(req);
    res.json(result);
}



export const GetHomeautoData = async (req: Request, res: Response) => {
      const result = await HomeautoGetService(req);
      return res.status(200).json(result);
};
    