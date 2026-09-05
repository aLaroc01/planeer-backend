import { Request, Response } from "express";
import mongoose from "mongoose";
import ChecklistService from "./checklist.service";
import Connection from "../connections/connection.model";

const checklistService = new ChecklistService();

const getAuthenticatedUserId = (req: Request) => {
  return req.user?.id;
};

const validateItems = (items: unknown) => {
  return Array.isArray(items);
};

export const createChecklist = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid authenticated user ID",
      });
    }

    if (!validateItems(req.body.items)) {
      return res.status(400).json({
        status: "failed",
        message: "Checklist items must be an array",
      });
    }

    const result = await checklistService.createChecklist(
      userId,
      {
        items: req.body.items,
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Checklist saved successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};

export const getChecklistByUser = async (
  req: Request,
  res: Response
) => {
  try {
    const requesterId = req.user?.id;
    const checklistOwnerId = req.params.id;

    if (!requesterId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid authenticated user ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(checklistOwnerId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid checklist owner ID",
      });
    }

    const isOwner = requesterId === checklistOwnerId;

    if (!isOwner) {
      const activeConnection = await Connection.exists({
        grantorId: checklistOwnerId,
        proxyUserId: requesterId,
        status: "active",
      });

      if (!activeConnection) {
        return res.status(403).json({
          status: "failed",
          message:
            "You do not have permission to view this checklist",
        });
      }
    }

    const result = await checklistService.getChecklistByUser(
      checklistOwnerId
    );

    if (!result) {
      return res.status(404).json({
        status: "failed",
        message: "Checklist not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Checklist fetched successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};

export const updateChecklist = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        status: "failed",
        message: "Invalid authenticated user ID",
      });
    }

    if (!validateItems(req.body.items)) {
      return res.status(400).json({
        status: "failed",
        message: "Checklist items must be an array",
      });
    }

    const result = await checklistService.updateChecklistByUser(
      userId,
      {
        items: req.body.items,
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Checklist updated successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};

export const deleteChecklist = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized",
      });
    }

    const result = await checklistService.deleteChecklistByUser(userId);

    if (!result) {
      return res.status(404).json({
        status: "failed",
        message: "Checklist not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Checklist deleted successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};