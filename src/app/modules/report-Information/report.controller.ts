import { Request, Response } from "express";
import {  GetAllReportsService,  getReportStatusCountService,  ReportService, updateReportService } from "./report.service";





export const ReportController=async (req:Request,res:Response) => {
    let result = await ReportService(req,res);
    res.json(result);

}





export const GetAllReportsController = async (req: Request, res: Response) => {
  const result = await GetAllReportsService();
  res.json(result);
};



export const getReportStatusCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getReportStatusCountService();

    if (result.status) {
      res.status(200).json({ status: "success", data: result.data });
    } else {
      res.status(500).json({ status: "error", message: "Failed to fetch report counts", error: result.data });
    }
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};


export const updateReportController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await updateReportService(req);

    if (result.status) {
      res.status(200).json({ status: "success", message: result.message });
    } else {
      res.status(404).json({ status: "error", message: result.message || "Failed to update report", error: result.data });
    }
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
