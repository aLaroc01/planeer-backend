"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileGetService = exports.ProfileUpdateService = exports.ProfileCreateService = void 0;
const profile_model_1 = require("./profile.model");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ProfileCreateService = async (req) => {
    const user_id = req.user?.id;
    const requestBody = req.body;
    const mainRole = "PROXY";
    try {
        console.log("ProfileCreateService called with requestBody:", requestBody.data, user_id);
        const activeProxy = await profile_model_1.ProfileModel.findOne({
            userID: user_id, // check if profile already exists for this user
        });
        if (!activeProxy) {
            const profileCreate = await profile_model_1.ProfileModel.create({
                ...requestBody.data,
                userID: user_id,
                mainRole: mainRole,
            });
            return {
                status: "success",
                message: `Profile created successfully`,
                data: profileCreate,
            };
        }
        else {
            return {
                status: "failed",
                message: "Profile already exists for this user",
            };
        }
    }
    catch (error) {
        return { status: "failed", message: error.message || "Failed to create profile data" };
    }
};
exports.ProfileCreateService = ProfileCreateService;
const ProfileUpdateService = async (req) => {
    // console.log("BODY RAW:", req.body);
    console.log("FILES RAW:", req.files);
    try {
        const { firstName, lastName, dateOfBirth, address, city, state, imgUrl } = req.body;
        const user_id = req.user?.id;
        if (!user_id) {
            return {
                status: "failed",
                message: "Unauthorized",
            };
        }
        const updateData = {};
        if (firstName?.trim())
            updateData.firstName = firstName.trim();
        if (lastName?.trim())
            updateData.lastName = lastName.trim();
        if (address?.trim())
            updateData.address = address.trim();
        if (city?.trim())
            updateData.city = city.trim();
        if (state?.trim())
            updateData.state = state.trim();
        if (dateOfBirth?.trim())
            updateData.dateOfBirth = dateOfBirth.trim();
        let finalImageUrl = imgUrl || null;
        const files = req.files;
        if (files?.image) {
            const file = Array.isArray(files.image) ? files.image[0] : files.image;
            const uploadsDir = path_1.default.join(process.cwd(), "uploads");
            if (!fs_1.default.existsSync(uploadsDir)) {
                fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            }
            const originalName = file.name || "image.png";
            const safeFileName = originalName
                .replace(/[^a-zA-Z0-9.-]/g, "_")
                .replace(/_+/g, "_");
            const safeName = `${Date.now()}-${safeFileName}`;
            const uploadPath = path_1.default.join(uploadsDir, safeName);
            await file.mv(uploadPath);
            console.log("Saved file path:", uploadPath);
            console.log("Exists:", fs_1.default.existsSync(uploadPath));
            finalImageUrl = `/uploads/${safeName}`;
        }
        if (finalImageUrl) {
            updateData.imgUrl = finalImageUrl;
        }
        const updatedProfileData = await profile_model_1.ProfileModel.findOneAndUpdate({ userID: user_id }, { $set: updateData }, { upsert: true, new: true });
        return {
            status: "success",
            message: "Profile data updated successfully",
            updatedProfileData,
        };
    }
    catch (error) {
        console.error("ProfileUpdateService error:", error);
        return {
            status: "failed",
            message: error.message || "Failed to update profile",
        };
    }
};
exports.ProfileUpdateService = ProfileUpdateService;
const ProfileGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return { status: "failed", message: "Unauthorized" };
        }
        const profileData = await profile_model_1.ProfileModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
        if (!profileData) {
            return { status: "failed", message: "No profile data found" };
        }
        // console.log("ProfileGetService called. Retrieved profile data:", profileData);  
        return {
            status: "success",
            message: "Profile data retrieved successfully",
            data: profileData,
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.ProfileGetService = ProfileGetService;
