import app from "../../../app";
import { User } from "../auth/user.model";
import { ProfileModel } from './profile.model';
import { ProfileMainRole } from './profile.interface'; 
import express, { Request } from "express";
import path from "path";
import fs from "fs";
import { assertUserNotRestricted } from "../../../helpers/accountRestriction";
import { restoreExpiredArchive } from "../../../helpers/restoreExpiredArchive";



const PROFILE_UPLOAD_DIR = path.join(
  process.cwd(),
  "uploads",
  "profile-images",
);


export const ProfileCreateService = async (req: Request) => {
  try {
    const userId = req.user?.id;

    const {
      firstName,
      lastName,
      dateOfBirth,
      address,
      city,
      state,
      zipcode,
      phoneNumber,
      onboardingType,
    } = req.body;

    if (!userId) {
      return {
        status: "failed",
        message: "Unauthorized: user ID is missing.",
      };
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return {
        status: "failed",
        message: "First name and last name are required.",
      };
    }

    const existingProfile = await ProfileModel.findOne({
      userID: userId,
    });

    if (existingProfile) {
      return {
        status: "failed",
        message: "A profile already exists for this user.",
      };
    }

    const normalizedOnboardingType =
      typeof onboardingType === "string"
        ? onboardingType.trim().toLowerCase()
        : "grantor";

    const mainRole: ProfileMainRole =
      normalizedOnboardingType === "proxy" ? "PROXY" : "GRANTOR";

    const profileData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth?.trim() || "",
      address: address?.trim() || "",
      city: city?.trim() || "",
      state: state?.trim() || "",
      zipcode: zipcode?.trim() || "",
      phoneNumber: phoneNumber?.trim() || "",
      userID: userId,
      mainRole,
    };

    let finalImageUrl = req.body.imgUrl || null;

    const files = (req as any).files;

    if (files?.image) {
      const file = Array.isArray(files.image)
        ? files.image[0]
        : files.image;

      const uploadsDir =
        process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const originalName = file.name || "image.png";

      const safeFileName = originalName
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_+/g, "_");

      const safeName = `${Date.now()}-${safeFileName}`;
      const uploadPath = path.join(uploadsDir, safeName);

      await file.mv(uploadPath);

      finalImageUrl = `/uploads/${safeName}`;
    }

    if (finalImageUrl) {
      profileData.imgUrl = finalImageUrl;
    }

    const createdProfile = await ProfileModel.create(profileData);

    return {
      status: "success",
      message: "Profile created successfully.",
      data: createdProfile,
    };
  } catch (error: any) {
    console.error("ProfileCreateService error:", error);

    return {
      status: "failed",
      message: error?.message || "Failed to create profile data.",
    };
  }
};


export const ProfileUpdateService = async (req: Request) => {
  console.log("FILES RAW:", (req as any).files);
  try {
    const { firstName, lastName, dateOfBirth, address, city, state, zipcode, phoneNumber, imgUrl } = req.body;
    const user_id = req.user?.id;

    const restriction = await assertUserNotRestricted(user_id);

    if (!restriction.allowed) {
      return {
        status: "failed",
        message: restriction.message,
      };
    }
    
    const updateData: any = {};

    if (firstName?.trim()) updateData.firstName = firstName.trim();
    if (lastName?.trim()) updateData.lastName = lastName.trim();
    if (address?.trim()) updateData.address = address.trim();
    if (city?.trim()) updateData.city = city.trim();
    if (state?.trim()) updateData.state = state.trim();
    if (dateOfBirth?.trim()) updateData.dateOfBirth = dateOfBirth.trim();
    if (phoneNumber?.trim()) updateData.phoneNumber = phoneNumber.trim();
    if (zipcode?.trim()) updateData.zipcode = zipcode.trim();

    let finalImageUrl = imgUrl || null;

    const files = (req as any).files;
    if (files?.image) {
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      const uploadsDir =
        process.env.UPLOADS_DIR ||
        path.join(process.cwd(), "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const originalName = file.name || "image.png";
      const safeFileName = originalName
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_+/g, "_");

      const safeName = `${Date.now()}-${safeFileName}`;
      const uploadPath = path.join(uploadsDir, safeName);

      await file.mv(uploadPath);
      console.log("Saved file path:", uploadPath);
      console.log("Exists:", fs.existsSync(uploadPath));
      finalImageUrl = `/uploads/${safeName}`;
    }

    if (finalImageUrl) {
      updateData.imgUrl = finalImageUrl;
    }

    const updatedProfileData = await ProfileModel.findOneAndUpdate(
      { userID: user_id },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return {
      status: "success",
      message: "Profile data updated successfully",
      updatedProfileData,
    };
  } catch (error: any) {
    console.error("ProfileUpdateService error:", error);
    return {
      status: "failed",
      message: error.message || "Failed to update profile",
    };
  }
};



export const ProfileGetService = async (req: Request) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return { status: "failed", message: "Unauthorized" };
    }

    await restoreExpiredArchive(user_id);

    const [profileData, userData] = await Promise.all([
      ProfileModel.findOne(
        { userID: user_id },
        "-createdAt -updatedAt",
      ),
      User.findById(user_id).select(
        "email phoneNumber role accountStatus planStatus archiveExpiresAt",
      ),
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
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};

