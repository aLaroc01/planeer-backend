import { Request, Response } from "express";
import { HomeautoGetService, HomeAutoService } from "./homeauto.service";



 export const HomeAutoUpdate=async (req:Request,res:Response) => {
    let result = await HomeAutoService(req);
    res.json(result);
}



export const GetHomeautoData = async (req: Request, res: Response) => {
      const result = await HomeautoGetService(req);
      return res.status(200).json(result);
};
    