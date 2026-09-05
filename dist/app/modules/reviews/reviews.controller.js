"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportAdminController = exports.GetAllReviewsController = exports.ReviewController = void 0;
const reviews_service_1 = require("./reviews.service");
const ReviewController = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ status: false, message: "User not authenticated" });
        }
        const result = await (0, reviews_service_1.ReviewService)(req);
        if (result.status) {
            // Always return object with message and data
            return res.status(201).json({
                status: true,
                message: result.message,
                data: result.data
            });
        }
        else {
            return res.status(500).json({
                status: false,
                message: result.message,
                error: result.data
            });
        }
    }
    catch (err) {
        return res.status(500).json({
            status: false,
            message: err.message
        });
    }
};
exports.ReviewController = ReviewController;
const GetAllReviewsController = async (req, res) => {
    try {
        const result = await (0, reviews_service_1.GetAllReviewsService)(req);
        if (result.status) {
            res.status(200).json({
                status: "success",
                message: result.message,
                data: result.data
            });
        }
        else {
            res.status(500).json({
                status: "error",
                message: result.message,
                error: result.data
            });
        }
    }
    catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};
exports.GetAllReviewsController = GetAllReviewsController;
const updateReportAdminController = async (req, res) => {
    try {
        const result = await (0, reviews_service_1.updateReviewService)(req); // service uses req.params.id
        if (result.status) {
            return res.status(200).json(result);
        }
        else {
            return res.status(404).json(result);
        }
    }
    catch (err) {
        return res.status(500).json({ status: false, message: err.message });
    }
};
exports.updateReportAdminController = updateReportAdminController;
