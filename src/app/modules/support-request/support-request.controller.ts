import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  SupportRequest,
  SUPPORT_ISSUES,
} from "./support-request.model";

export const createSupportRequest = async (
  req: Request,
  res: Response,
) => {
  try {
    const body = req.body ?? {};

    if (
      typeof body.email !== "string" ||
      typeof body.issue !== "string" ||
      typeof body.message !== "string" ||
      (body.phone !== undefined &&
        typeof body.phone !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request.",
      });
    }

    const email = body.email.trim().toLowerCase();
    const phone = (body.phone ?? "").trim();
    const issue = body.issue.trim();
    const message = body.message.trim();

    const validIssue = SUPPORT_ISSUES.some(
      (allowed) => allowed === issue,
    );

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      phone.length > 40 ||
      !validIssue ||
      !message ||
      message.length > 10000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a valid email, issue category, and message of up to 10,000 characters.",
      });
    }

    // Explicit fields prevent callers from setting admin-only values.
    const request = await SupportRequest.create({
      email,
      phone,
      issue,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Your support request has been received.",
      data: {
        id: String(request._id),
        status: request.status,
      },
    });
  } catch (error) {
    console.error("Create support request failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save your request. Please try again.",
    });
  }
};

export const listSupportRequests = async (
  req: Request,
  res: Response,
) => {
  try {
    const pageInput = Number(req.query.page);
    const limitInput = Number(req.query.limit);

    const page =
      Number.isSafeInteger(pageInput) && pageInput > 0
        ? pageInput
        : 1;

    const limit =
      Number.isSafeInteger(limitInput) && limitInput > 0
        ? Math.min(limitInput, 100)
        : 20;

    const status = req.query.status;

    if (
      status !== undefined &&
      status !== "Open" &&
      status !== "Completed"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter.",
      });
    }

    const filter = status ? { status } : {};

    const [data, total] = await Promise.all([
      SupportRequest.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SupportRequest.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Support requests retrieved.",
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List support requests failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve support requests.",
    });
  }
};

export const completeSupportRequest = async (
  req: Request,
  res: Response,
) => {
  try {
    const id = req.params.id;
    const adminId = req.user?.id;

    if (
      typeof adminId !== "string" ||
      !Types.ObjectId.isValid(adminId)
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (
      typeof id !== "string" ||
      !Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid support request ID.",
      });
    }

    if (req.body?.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Only the Completed status is supported.",
      });
    }

    const updated = await SupportRequest.findOneAndUpdate(
      { _id: id, status: "Open" },
      {
        $set: {
          status: "Completed",
          completedAt: new Date(),
          completedBy: adminId,
        },
      },
      { new: true, runValidators: true },
    ).lean();

    // Repeated requests do not overwrite completion audit fields.
    const request =
      updated || (await SupportRequest.findById(id).lean());

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Support request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Support request completed.",
      data: request,
    });
  } catch (error) {
    console.error("Complete support request failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete the support request.",
    });
  }
};