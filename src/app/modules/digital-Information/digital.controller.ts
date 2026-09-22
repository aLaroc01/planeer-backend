import { Request, Response } from "express";
import { DigitalGetService, DigitalInformationService } from "./digital.service";



export const DigitalInformation=async (req:Request,res:Response) => {
let result = await DigitalInformationService(req);
res.json(result);
}



 export const GetDigitalData = async (req: Request, res: Response) => {
   const result = await DigitalGetService(req);
   return res.status(200).json(result);
};
        