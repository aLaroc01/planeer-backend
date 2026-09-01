import { Request, Response } from "express";
import {  FinancialGetService, FinancialUpdateService } from "./financial.service";






 export const UpdateFinancial=async (req:Request,res:Response) => {
    let result = await FinancialUpdateService(req);
    res.json(result);

  }


export const GetFinancialData = async (req: Request, res: Response) => {
  const result = await FinancialGetService(req);
  return res.status(200).json(result);
};







 



