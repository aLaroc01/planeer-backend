import { Request, Response } from "express";
import { SocialGetService, SocialInformationService } from "./social.service";



export const SocialInformation=async (req:Request,res:Response) => {
let result = await SocialInformationService(req);
res.json(result);
}



 export const GetSocialData = async (req: Request, res: Response) => {
   const result = await SocialGetService(req);
   return res.status(200).json(result);
};
        