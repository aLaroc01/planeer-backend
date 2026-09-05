import { Request, Response } from "express";
import { ProfileGetService, ProfileCreateService, ProfileUpdateService } from './profile.service';
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import AppError from "../../../errors/AppError";
import { ProfileModel } from './profile.model';

export const createProfile = async (req: Request, res: Response) => {
  const result = await ProfileCreateService(req);
  return res.status(200).json(result);
};

export const UpdateProfile = async (req: Request, res: Response) => {
  const result = await ProfileUpdateService(req);
  return res.status(200).json(result);
};

export const GetProfileData = async (req: Request, res: Response) => {
  try {  
        const result = await ProfileGetService(req);
        console.log("here's medical info calls", result);

        return res.status(result.status === "success" ? 200 : 400).json(result);
    } catch (error: any) {
        return res.status(500).json({
        status: "failed",
        message: error.message || "Something went wrong",
        });
    }
};

export const updateSuggestionStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const key = req.params.key?.trim();

  const { completed, dismissed } = req.body as {
    completed?: unknown;
    dismissed?: unknown;
  };

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  if (!key || key.length > 100) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A valid suggestion key is required.",
    );
  }

  if (typeof completed !== "boolean" && typeof dismissed !== "boolean") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Provide completed or dismissed as a boolean.",
    );
  }

  if (completed === true && dismissed === true) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "A suggestion cannot be completed and dismissed at the same time.",
    );
  }

  const now = new Date();

  const updateFields: Record<string, unknown> = {};

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

  let profile = await ProfileModel.findOneAndUpdate(
    {
      userID: userId,
      "suggestions.key": key,
    },
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!profile) {
    const newSuggestion = {
      key,
      completed: completed === true,
      completedAt: completed === true ? now : null,
      dismissed: dismissed === true,
      dismissedAt: dismissed === true ? now : null,
    };

    profile = await ProfileModel.findOneAndUpdate(
      {
        userID: userId,
        "suggestions.key": { $ne: key },
      },
      {
        $push: {
          suggestions: newSuggestion,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );
  }

  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  const suggestion = profile.suggestions.find(
    (item) => item.key === key,
  );

  return sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Suggestion status saved successfully",
    data: suggestion,
  });
});

export const ProfileController = {
  createProfile,
  UpdateProfile,
  GetProfileData,

}