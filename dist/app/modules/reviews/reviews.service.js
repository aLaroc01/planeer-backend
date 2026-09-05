"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReviewService = exports.GetAllReviewsService = exports.ReviewService = void 0;
const reviews_model_1 = require("./reviews.model");
const ReviewService = async (req) => {
    try {
        let user_id = req.user?.id;
        if (!user_id) {
            throw new Error("User not found in request");
        }
        const { comment, rating } = req.body;
        const newReport = await reviews_model_1.ReviewModel.create({
            comment,
            rating,
            userID: user_id
        });
        return {
            status: true,
            message: "Report created successfully",
            data: newReport
        };
    }
    catch (error) {
        console.log("Error creating report:", error);
        return {
            status: false,
            message: "Failed to create report",
            data: error
        };
    }
};
exports.ReviewService = ReviewService;
const GetAllReviewsService = async (req) => {
    try {
        const reports = await reviews_model_1.ReviewModel.find()
            .populate("userID", "firstName lastName email imgUrl");
        return {
            status: true,
            message: "All reports fetched successfully",
            data: reports
        };
    }
    catch (error) {
        return {
            status: false,
            message: "Failed to fetch reports",
            data: error
        };
    }
};
exports.GetAllReviewsService = GetAllReviewsService;
const updateReviewService = async (req) => {
    try {
        const reportId = req.params.id; // Admin updates any report
        const requestBody = req.body;
        const report = await reviews_model_1.ReviewModel.findById(reportId);
        if (!report)
            return { status: false, message: "Report not found" };
        report.comment = requestBody.comment ?? report.comment;
        report.rating = requestBody.rating ?? report.rating;
        await report.save();
        return { status: true, message: "Report updated successfully", data: report };
    }
    catch (error) {
        return { status: false, message: "Something went wrong", data: error };
    }
};
exports.updateReviewService = updateReviewService;
