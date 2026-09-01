import { Request } from "express";
import { ReviewModel } from "./reviews.model";





export const ReviewService = async (req: Request) => {
  try {
    let user_id = req.user?.id;

    if (!user_id) {
      throw new Error("User not found in request");
    }

    const { comment, rating } = req.body;

    const newReport = await ReviewModel.create({
      comment,
      rating,
      userID: user_id
    });

    return {
      status: true,
      message: "Report created successfully",
      data: newReport
    };
  } catch (error: any) {
    console.log("Error creating report:", error);
    return {
      status: false,
      message: "Failed to create report",
      data: error
    };
  }
};


  



export const GetAllReviewsService = async (
  req: Request
) => {
  try {
    const reports = await ReviewModel.find()
      .populate("userID", "firstName lastName email imgUrl");

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









export const updateReviewService = async (req: Request) => {
  try {
    const reportId = req.params.id; // Admin updates any report
    const requestBody = req.body;

    const report = await ReviewModel.findById(reportId);
    if (!report) return { status: false, message: "Report not found" };

    report.comment = requestBody.comment ?? report.comment;
    report.rating = requestBody.rating ?? report.rating;

    await report.save();

    return { status: true, message: "Report updated successfully", data: report };
  } catch (error: any) {
    return { status: false, message: "Something went wrong", data: error };
  }
};