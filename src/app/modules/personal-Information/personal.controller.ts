import { Request, Response } from "express";
import { PersonalGetService, PersonalUpdateService } from "./personal.service";

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