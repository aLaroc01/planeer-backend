import app from "../../../app";
import { User } from "../auth/user.model";
import { ProfileModel } from './profile.model';
import express, { Request } from "express";
import path from "path";
import fs from "fs";


export const ProfileCreateService = async (req: Request) => {
  const user_id = req.user?.id; 
  const requestBody = req.body;  
  const mainRole = "PROXY"; 
try {
    
    console.log("ProfileCreateService called with requestBody:", requestBody.data, user_id);

    const activeProxy = await ProfileModel.findOne({
          userID: user_id, // check if profile already exists for this user
        });

        if (!activeProxy) {
          const profileCreate = await ProfileModel.create({
            ...requestBody.data,
            userID: user_id,
            mainRole: mainRole,
          });
          return {
            status: "success",
            message: `Profile created successfully`,
            data: profileCreate,
          };
        } else {
          return {
            status: "failed",
            message: "Profile already exists for this user",
          };
        }
  } catch (error: any) {
    return { status: "failed", message: error.message || "Failed to create profile data" };
  }
};



export const ProfileUpdateService = async (req: Request) => {
  // console.log("BODY RAW:", req.body);
  console.log("FILES RAW:", (req as any).files);
  try {
    const { firstName, lastName, dateOfBirth, address, city, state, imgUrl } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return {
        status: "failed",
        message: "Unauthorized",
      };
    }

    const updateData: any = {};

    if (firstName?.trim()) updateData.firstName = firstName.trim();
    if (lastName?.trim()) updateData.lastName = lastName.trim();
    if (address?.trim()) updateData.address = address.trim();
    if (city?.trim()) updateData.city = city.trim();
    if (state?.trim()) updateData.state = state.trim();
    if (dateOfBirth?.trim()) updateData.dateOfBirth = dateOfBirth.trim();

    let finalImageUrl = imgUrl || null;

    const files = (req as any).files;
    if (files?.image) {
      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      const uploadsDir = path.join(process.cwd(), "uploads");

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

    const profileData = await ProfileModel.findOne(
      { userID: user_id },
      "-createdAt -updatedAt"
    );

    if (!profileData) {
      return { status: "failed", message: "No profile data found" };
    }

    // console.log("ProfileGetService called. Retrieved profile data:", profileData);  
    return {
      status: "success",
      message: "Profile data retrieved successfully",
      data: profileData,
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};

