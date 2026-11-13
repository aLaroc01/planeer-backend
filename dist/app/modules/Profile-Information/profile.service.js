"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileGetService = exports.ProfileUpdateService = exports.ProfileCreateService = void 0;
const user_model_1 = require("../auth/user.model");
const profile_model_1 = require("./profile.model");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const accountRestriction_1 = require("../../../helpers/accountRestriction");
const restoreExpiredArchive_1 = require("../../../helpers/restoreExpiredArchive");
const ProfileCreateService = async (req) => {
    const userId = req.user?.id;
    const { data, onboardingType } = req.body;
    try {
        if (!userId) {
            return {
                status: "failed",
                message: "Unauthorized: user ID is missing.",
            };
        }
        if (!data || typeof data !== "object") {
            return {
                status: "failed",
                message: "Profile data is required.",
            };
        }
        const existingProfile = await profile_model_1.ProfileModel.findOne({
            userID: userId,
        });
        if (existingProfile) {
            return {
                status: "failed",
                message: "A profile already exists for this user.",
            };
        }
        const normalizedOnboardingType = typeof onboardingType === "string"
            ? onboardingType.trim().toLowerCase()
            : "grantor";
        const mainRole = normalizedOnboardingType === "proxy"
            ? "PROXY"
            : "GRANTOR";
        const profileCreate = await profile_model_1.ProfileModel.create({
            ...data,
            userID: userId,
            mainRole,
        });
        return {
            status: "success",
            message: "Profile created successfully.",
            data: profileCreate,
        };
    }
    catch (error) {
        return {
            status: "failed",
            message: error?.message || "Failed to create profile data.",
        };
    }
};
exports.ProfileCreateService = ProfileCreateService;
const ProfileUpdateService = async (req) => {
    console.log("FILES RAW:", req.files);
    try {
        const { firstName, lastName, dateOfBirth, address, city, state, zipcode, phoneNumber, imgUrl } = req.body;
        const user_id = req.user?.id;
        const restriction = await (0, accountRestriction_1.assertUserNotRestricted)(user_id);
        if (!restriction.allowed) {
            return {
                status: "failed",
                message: restriction.message,
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
        if (phoneNumber?.trim())
            updateData.phoneNumber = phoneNumber.trim();
        if (zipcode?.trim())
            updateData.zipcode = zipcode.trim();
        let finalImageUrl = imgUrl || null;
        const files = req.files;
        if (files?.image) {
            const file = Array.isArray(files.image) ? files.image[0] : files.image;
            const uploadsDir = process.env.UPLOADS_DIR ||
                path_1.default.join(process.cwd(), "uploads");
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
        await (0, restoreExpiredArchive_1.restoreExpiredArchive)(user_id);
        const [profileData, userData] = await Promise.all([
            profile_model_1.ProfileModel.findOne({ userID: user_id }, "-createdAt -updatedAt"),
            user_model_1.User.findById(user_id).select("email phoneNumber role accountStatus planStatus archiveExpiresAt"),
        ]);
        if (!profileData) {
            return { status: "failed", message: "No profile data found" };
        }
        if (!userData) {
            return { status: "failed", message: "User not found" };
        }
        return {
            status: "success",
            message: "Profile data retrieved successfully",
            data: {
                profile: profileData,
                user: {
                    _id: userData._id,
                    email: userData.email,
                    phoneNumber: userData.phoneNumber,
                    role: userData.role,
                    accountStatus: userData.accountStatus,
                    planStatus: userData.planStatus,
                    archiveExpiresAt: userData.archiveExpiresAt,
                },
            },
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.ProfileGetService = ProfileGetService;
