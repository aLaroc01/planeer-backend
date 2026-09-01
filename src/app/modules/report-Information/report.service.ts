import { Request, Response } from "express";
import { ReportModel } from "./report.model";








export const ReportService = async (req: Request, res: Response) => {
  try {
    let userID = req.user?.id;
    const {
      problemtitle,
      desdetails,
      status, 
      } = req.body;

    const newReport = await ReportModel.create({
      problemtitle,
      desdetails,
      status, 
      userID: userID,
    });

    return {
      status: true,
      message: "Report created successfully",
      data: newReport,
    };
  } catch (error: any) {
    return {
      status: false,
      message: "Failed to create report",
      data: error,
    };
  }
};





  



export const GetAllReportsService = async () => {
  try {

    const reports = await ReportModel.find().populate("userID", "firstName lastName email imgUrl  ");

    return {
      status: true,
      message: "All reports fetched successfully",
      data: reports
    };

  } catch (error: any) {

    return {
      status: false,
      message: "Failed to fetch reports",
      data: error
    };
  }
};






export const getReportStatusCountService = async () => {
  try {
    const [progressCount, completedCount, totalCount] = await Promise.all([
      ReportModel.countDocuments({ status: "Progress" }),
      ReportModel.countDocuments({ status: "Completed" }),
      ReportModel.countDocuments() // total reports
    ]);

    return {
      status: true,
      data: {
        progress: progressCount,
        completed: completedCount,
        totalReports: totalCount
      }
    };
  } catch (error) {
    return { status: false, data: error };
  }
};





export const updateReportService = async (req: Request) => {
  try {
    const reportId = req.params.id;
    const requestBody = req.body;

    const report = await ReportModel.findById(reportId);
    if (!report) {
      return { status: false, message: "Report not found" };
    }

 

    report.problemtitle = requestBody.problemtitle ?? report.problemtitle;
    report.desdetails = requestBody.desdetails ?? report.desdetails;
    report.status = requestBody.status ?? report.status;

    await report.save();

    return { status: true, message: "Report updated successfully" };
  } catch (error) {
    return { status: false, data: error };
  }
};