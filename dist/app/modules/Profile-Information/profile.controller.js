"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileController = exports.updateSuggestionStatus = exports.GetProfileData = exports.UpdateProfile = exports.createProfile = void 0;
const profile_service_1 = require("./profile.service");
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const profile_model_1 = require("./profile.model");
const createProfile = async (req, res) => {
    const result = await (0, profile_service_1.ProfileCreateService)(req);
    return res.status(200).json(result);
};
exports.createProfile = createProfile;
const UpdateProfile = async (req, res) => {
    const result = await (0, profile_service_1.ProfileUpdateService)(req);
    return res.status(200).json(result);
};
exports.UpdateProfile = UpdateProfile;
const GetProfileData = async (req, res) => {
    try {
        const result = await (0, profile_service_1.ProfileGetService)(req);
        console.log("here's medical info calls", result);
        return res.status(result.status === "success" ? 200 : 400).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.GetProfileData = GetProfileData;
exports.updateSuggestionStatus = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?._id;
    const key = req.params.key?.trim();
    const { completed, dismissed } = req.body;
    if (!userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Unauthorized");
    }
    if (!key || key.length > 100) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "A valid suggestion key is required.");
    }
    if (typeof completed !== "boolean" && typeof dismissed !== "boolean") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Provide completed or dismissed as a boolean.");
    }
    if (completed === true && dismissed === true) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "A suggestion cannot be completed and dismissed at the same time.");
    }
    const now = new Date();
    const updateFields = {};
    if (typeof completed === "boolean") {
        updateFields["suggestions.$.completed"] = completed;
        updateFields["suggestions.$.completedAt"] = completed ? now : null;
    }
    if (typeof dismissed === "boolean") {
        updateFields["suggestions.$.dismissed"] = dismissed;
        updateFields["suggestions.$.dismissedAt"] = dismissed ? now : null;
    }
    // Completing a suggestion restores it if it had previously been dismissed.
    if (completed === true) {
        updateFields["suggestions.$.dismissed"] = false;
        updateFields["suggestions.$.dismissedAt"] = null;
    }
    // Dismissing a suggestion marks it as not completed.
    if (dismissed === true) {
        updateFields["suggestions.$.completed"] = false;
        updateFields["suggestions.$.completedAt"] = null;
    }
    let profile = await profile_model_1.ProfileModel.findOneAndUpdate({
        userID: userId,
        "suggestions.key": key,
    }, {
        $set: updateFields,
    }, {
        new: true,
        runValidators: true,
    });
    if (!profile) {
        const newSuggestion = {
            key,
            completed: completed === true,
            completedAt: completed === true ? now : null,
            dismissed: dismissed === true,
            dismissedAt: dismissed === true ? now : null,
        };
        profile = await profile_model_1.ProfileModel.findOneAndUpdate({
            userID: userId,
            "suggestions.key": { $ne: key },
        }, {
            $push: {
                suggestions: newSuggestion,
            },
        }, {
            new: true,
            runValidators: true,
        });
    }
    if (!profile) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Profile not found");
    }
    const suggestion = profile.suggestions.find((item) => item.key === key);
    return (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Suggestion status saved successfully",
        data: suggestion,
    });
});
exports.ProfileController = {
    createProfile: exports.createProfile,
    UpdateProfile: exports.UpdateProfile,
    GetProfileData: exports.GetProfileData,
};
