import { Request, Response } from "express";
import {   MedicalGetService, MedicalUpdateService } from "./medical.service";


export const UpdateMedical=async (req:Request,res:Response) => {
    let result = await MedicalUpdateService(req);
    res.json(result);

}




    export const GetMedicalData = async (req: Request, res: Response) => {
          const result = await MedicalGetService(req);
          return res.status(200).json(result);
    };
        