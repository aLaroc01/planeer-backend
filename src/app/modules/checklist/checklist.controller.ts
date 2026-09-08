import { Request, Response } from "express";
import mongoose from "mongoose";
import ChecklistService from "./checklist.service";
import Connection from "../connections/connection.model";
import Checklist  from "./checklist.model";

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

export const getChecklistByCurrentUser = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        status: "failed",
        message: "Invalid authenticated user ID",
      });
    }

    const result = await checklistService.getChecklistByUserService(userId);

    if (!result) {
      return res.status(404).json({
        status: "failed",
        message: "Checklist not found",
        data: null,
      });
    }


    const ownerId = String(result?.userId);
    const primaryProxyId = result?.primaryProxyId ? String(result?.primaryProxyId) : null;
    const secondaryProxyId = result?.secondaryProxyId ? String(result?.secondaryProxyId) : null;
    const requesterIdStr = String(userId);

    const isOwner = ownerId === requesterIdStr;
    const isPrimaryProxy = primaryProxyId === requesterIdStr;
    const isSecondaryProxy = secondaryProxyId === requesterIdStr;

    if (!isOwner && !isPrimaryProxy && !isSecondaryProxy) {
      return res.status(403).json({
        status: "failed",
        message: "You do not have permission to view this checklist",
      });
    }


    // Optional sanity check
    if (String(result.userId) !== String(userId)) {
      return res.status(403).json({
        status: "failed",
        message: "You do not have permission to view this checklist",
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



export const updateChecklistProxy = async (
  req: Request,
  res: Response
) => {
  try {
    const ownerId = req.user?.id;
    const { proxyId } = req.body;

    if (!ownerId) {
      return res.status(401).json({
        status: "failed",
        message: "Unauthorized",
      });
    }

    if (proxyId !== undefined && proxyId !== null) {
      if (!mongoose.Types.ObjectId.isValid(proxyId)) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid proxyId",
        });
      }
    }

    const checklist = await Checklist.findOneAndUpdate(
      { userId: ownerId },
      { proxyId: proxyId ?? null }
    );

    if (!checklist) {
      return res.status(404).json({
        status: "failed",
        message: "Checklist not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Proxy updated",
      data: checklist,
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