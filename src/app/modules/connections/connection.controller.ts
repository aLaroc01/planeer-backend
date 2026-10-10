import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { User } from "../auth/user.model";
import Connection from "./connection.model";
import {
  createProxyConnectionService,
  acceptProxyInviteService,
  getConnectionsForUserService,
  canAddGrantorForProxy,
  acceptProxyDirectService,
  denyProxyDirectService,
  sendConnectionRequestService,
} from "../connections/connection.service";
import { ProfileGetService } from "../Profile-Information/profile.service";
import {
  ArchiveRequest,
  ArchiveRequestReason,
  ArchiveRequestStatus,
} from "../archive-request/archive-request.model";
import { PlanStatus, Role } from "../auth/user.interface";
import mongoose from "mongoose";


const getProxyEmail = (body: any) =>
  String(body.proxyEmail || body.email || "").trim().toLowerCase();




const canAddProxy = async (grantorId: string, proxyUserId?: string | null) => {
  const currentUser = await User.findById(grantorId);
  if (!currentUser) {
    return { ok: false, message: "Current user not found" };
  }

  const currentProxyCount = Array.isArray(currentUser.proxysetId)
    ? currentUser.proxysetId.length
    : 0;

  if (currentProxyCount >= 2) {
    return { ok: false, message: "You can only have 2 proxies" };
  }

  if (proxyUserId && String(currentUser._id) === String(proxyUserId)) {
    return { ok: false, message: "You cannot add yourself as a proxy" };
  }

  return { ok: true, currentUser };
  
};

// Check if the current user can add a proxy.
export const getConnectionsForUser = async (req: Request, res: Response) => {
  try {
    const result = await getConnectionsForUserService(req);
    console.log("getConnectionsForUser result:", result.data);

    return res.status(result.status === "success" ? 200 : 400).json(result);
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};


export const connectionSearcher = async (req: Request, res: Response) => {
  try {
    const result = await canAddGrantorForProxy(req);
    const statusCode = ((result as { status?: string }).status === "success") ? 200 : 400;

    return res.status(statusCode).json(result);
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
}



// createProxyConnectionService is implemented in ../connections/connection.service
// Local implementation removed to avoid duplicate declaration with the imported symbol.

export const createProxyConnection = async (req: Request, res: Response) => {
  try{
    const result = await createProxyConnectionService(req);
    const statusCode = ((result as { status?: string }).status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
    return res.status(statusCode).json(result);
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};


// accept proxy invite call by proxy user when they click the email link and sign up to system, 
// this will update the connection with proxy user id and change status to active
export const sendConnectionRequest = async (req: Request, res: Response) => {
 try{
  const result = await sendConnectionRequestService(req);
  const statusCode = ((result as { status?: string }).status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
  return res.status(statusCode).json(result);
    } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};


// Deny proxy direct from profile ( or other ) page
export const denyProxyDirectly = async (req: Request, res: Response) => {
 try{
  const result = await denyProxyDirectService(req);
  // console.log("updated connection id:", result.data);
  const statusCode = ((result as { status?: string }).status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
  return res.status(statusCode).json(result);
    } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};


// Accept proxy direct from profile ( and other ) page
export const acceptProxyDirectly = async (req: Request, res: Response) => {
 try{
    const result = await acceptProxyDirectService(req);
    // console.log("updated connection id:", result, ",", req.body.connId);
    const statusCode = ((result as { status?: string }).status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
    return res.status(statusCode).json(result);
  } catch (error: any) {
    return res.status(500).json({
      status: "failed",
      message: error.message || "Something went wrong",
    });
  }
};



// Create a direct proxy connection for the current user.
export const createDirectProxyConnectionService = async (req: Request) => {
  try {
    const currentUserId = req.user?.id;
    const proxyEmail = getProxyEmail(req.body.proxyId);

    if (!currentUserId) {
      return { status: "failed", message: "Unauthorized" };
    }

    if (!proxyEmail) {
      return { status: "failed", message: "Proxy email is required" };
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return { status: "failed", message: "Current user not found" };
    }

    const proxyUser = await User.findOne({ email: proxyEmail });
    if (!proxyUser) {
      return { status: "failed", message: "No user found with that email" };
    }

    const canAdd = await canAddProxy(currentUserId, String(proxyUser._id));
    if (!canAdd.ok) {
      return { status: "failed", message: canAdd.message };
    }

    const alreadyAdded = Array.isArray(currentUser.proxysetId)
      ? currentUser.proxysetId.some((id) => String(id) === String(proxyUser._id))
      : false;

    if (alreadyAdded) {
      return { status: "failed", message: "This proxy is already added" };
    }

    currentUser.proxysetId = currentUser.proxysetId || [];
    currentUser.proxysetId.push(proxyUser._id);
    await currentUser.save();

    return {
      status: "success",
      message: "Proxy added successfully",
      data: currentUser,
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Something went wrong",
    };
  }
};

// validate the proxy invite
export const validateProxyInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invite token is required",
      });
    }

    const connection = await Connection.findOne({
      inviteToken: token,
      inviteExpiresAt: { $gt: new Date() },
      status: "invited",
    }).populate("grantorId", "firstName lastName email");

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired invite",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invite is valid",
      data: {
        connectionId: connection._id,
        proxyEmail: connection.proxyEmail,
        grantor: connection.grantorId,
        status: connection.status,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate proxy invite",
      error: errorMessage,
    });
  }
};

// Controller to handle requests for archiving a grantor's connection by the requester.
export const requestGrantorArchive = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requesterId = req.user?._id;
    const { connectionId } = req.params;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (
      typeof connectionId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(connectionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection ID.",
      });
    }

    const {
      reason,
      requesterNote,
      evidenceFileIds,
    } = req.body ?? {};

    if (
      reason !== ArchiveRequestReason.INCAPACITY &&
      reason !== ArchiveRequestReason.DEATH
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must be INCAPACITY or DEATH.",
      });
    }

    if (
      requesterNote !== undefined &&
      typeof requesterNote !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Requester note must be a string.",
      });
    }

    const normalizedNote =
      typeof requesterNote === "string"
        ? requesterNote.trim()
        : "";

    if (normalizedNote.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Requester note cannot exceed 2,000 characters.",
      });
    }

    /*
     * Evidence attachment validation is not wired up yet.
     * Allow omitted/empty evidence only; never accept unverified IDs.
     */
    if (
      evidenceFileIds !== undefined &&
      !Array.isArray(evidenceFileIds)
    ) {
      return res.status(400).json({
        success: false,
        message: "Evidence file IDs must be an array.",
      });
    }

    if (
      Array.isArray(evidenceFileIds) &&
      evidenceFileIds.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Evidence attachments are not enabled yet. Submit without attachments.",
      });
    }

    // Verify signup verification from the database, not the request body.
    const requester = await User.findById(requesterId)
      .select("otpVerified");

    if (!requester) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user no longer exists.",
      });
    }

    if (!requester.otpVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Complete account verification before submitting an archive request.",
      });
    }

    // An active relationship determines proxy permission.
    // Do not require Role.PROXY: a grantor can also be someone's proxy.
    const connection = await Connection.findOne({
      _id: connectionId,
      proxyUserId: requesterId,
      status: "active",
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "An active grantor connection belonging to you was not found.",
      });
    }

    if (
      connection.grantorId.toString() === requesterId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot submit a proxy archive request for your own account.",
      });
    }

    const grantor = await User.findById(connection.grantorId)
      .select("planStatus");

    if (!grantor) {
      return res.status(404).json({
        success: false,
        message: "Grantor account not found.",
      });
    }

    if (grantor.planStatus === PlanStatus.ARCHIVED) {
      return res.status(409).json({
        success: false,
        message: "The grantor account is already archived.",
      });
    }

    const pendingRequest = await ArchiveRequest.exists({
      grantorId: connection.grantorId,
      status: ArchiveRequestStatus.PENDING,
    });

    if (pendingRequest) {
      return res.status(409).json({
        success: false,
        message:
          "A pending archive request already exists for this grantor.",
      });
    }

    const archiveRequest = await ArchiveRequest.create({
      grantorId: connection.grantorId,
      requestedBy: requesterId,
      connectionId: connection._id,

      reason,
      requesterNote: normalizedNote,
      evidenceFileIds: [],

      status: ArchiveRequestStatus.PENDING,
    });

    return res.status(201).json({
      success: true,
      message: "Grantor archive request submitted for review.",
      data: {
        _id: archiveRequest._id,
        grantorId: archiveRequest.grantorId,
        connectionId: archiveRequest.connectionId,
        requestedBy: archiveRequest.requestedBy,
        reason: archiveRequest.reason,
        requesterNote: archiveRequest.requesterNote,
        status: archiveRequest.status,
        createdAt: archiveRequest.createdAt,
      },
    });
  } catch (error) {
    // Handles two proxies submitting simultaneously.
    // The database's unique partial index is the final safeguard.
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A pending archive request already exists for this grantor.",
      });
    }

    return next(error);
  }
};

// Controller to review pending grantor archive requests for admin users (accept/reject).
export const reviewGrantorArchiveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const reject = (statusCode: number, message: string): never => {
    const error = new Error(message) as Error & {
      statusCode: number;
      archiveReviewError: boolean;
    };

    error.statusCode = statusCode;
    error.archiveReviewError = true;

    throw error;
  };

  try {
    const reviewerId = req.user?._id;
    const reviewerRole = req.user?.role;
    const { requestId } = req.params;

    if (!reviewerId) {
      return reject(401, "Authentication is required.");
    }

    // Also enforced by the route middleware.
    if (
      reviewerRole !== Role.ADMIN &&
      reviewerRole !== Role.SUPER_ADMIN
    ) {
      return reject(403, "Admin access is required.");
    }

    if (
      typeof requestId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(requestId)
    ) {
      return reject(400, "Invalid archive request ID.");
    }

    const {
      decision,
      reviewNote,
      archiveType,
      archiveExpiresAt,
    } = req.body ?? {};

    if (decision !== "approve" && decision !== "reject") {
      return reject(
        400,
        "Decision must be approve or reject.",
      );
    }

    if (
      typeof reviewNote !== "string" ||
      !reviewNote.trim()
    ) {
      return reject(400, "A review note is required.");
    }

    const normalizedReviewNote = reviewNote.trim();

    if (normalizedReviewNote.length > 2000) {
      return reject(
        400,
        "Review note cannot exceed 2,000 characters.",
      );
    }

    const approving = decision === "approve";
    let approvedExpiry: Date | null = null;

    if (approving) {
      if (
        archiveType !== "temporary" &&
        archiveType !== "permanent"
      ) {
        return reject(
          400,
          "Approval requires a temporary or permanent archive type.",
        );
      }

      if (archiveType === "temporary") {
        if (typeof archiveExpiresAt !== "string") {
          return reject(
            400,
            "Temporary archiving requires an expiry date string.",
          );
        }

        approvedExpiry = new Date(archiveExpiresAt);

        if (
          Number.isNaN(approvedExpiry.getTime()) ||
          approvedExpiry.getTime() <= Date.now()
        ) {
          return reject(
            400,
            "Archive expiry must be a valid future date.",
          );
        }
      } else if (
        archiveExpiresAt !== undefined &&
        archiveExpiresAt !== null
      ) {
        return reject(
          400,
          "Permanent archiving cannot have an expiry date.",
        );
      }
    } else if (
      archiveType !== undefined ||
      archiveExpiresAt !== undefined
    ) {
      return reject(
        400,
        "Do not provide archive settings when rejecting a request.",
      );
    }

    const reviewerObjectId = new mongoose.Types.ObjectId(
      reviewerId.toString(),
    );

    const result = await mongoose.connection.transaction(
      async (session) => {
        const archiveRequest = await ArchiveRequest.findById(
          requestId,
        ).session(session);

        if (!archiveRequest) {
          return reject(404, "Archive request not found.");
        }

        if (
          archiveRequest.status !== ArchiveRequestStatus.PENDING
        ) {
          return reject(
            409,
            "This archive request is no longer pending.",
          );
        }

        // Prevent reviewing a case about yourself or one you submitted.
        if (
          archiveRequest.requestedBy.toString() ===
            reviewerObjectId.toString() ||
          archiveRequest.grantorId.toString() ===
            reviewerObjectId.toString()
        ) {
          return reject(
            403,
            "You cannot review your own archive case.",
          );
        }

        const now = new Date();

        if (approving) {
          if (
            approvedExpiry &&
            approvedExpiry.getTime() <= now.getTime()
          ) {
            return reject(
              400,
              "Archive expiry must still be in the future.",
            );
          }

          // Confirm the requester is still the connected proxy.
          const connection = await Connection.findOne({
            _id: archiveRequest.connectionId,
            grantorId: archiveRequest.grantorId,
            proxyUserId: archiveRequest.requestedBy,
            status: "active",
          }).session(session);

          if (!connection) {
            return reject(
              409,
              "The requesting proxy no longer has an active connection.",
            );
          }

          const grantor = await User.findById(
            archiveRequest.grantorId,
          ).session(session);

          if (!grantor) {
            return reject(404, "Grantor account not found.");
          }

          if (grantor.planStatus === PlanStatus.ARCHIVED) {
            return reject(
              409,
              "The grantor account is already archived.",
            );
          }

          grantor.planStatus = PlanStatus.ARCHIVED;
          grantor.planStatusChangedAt = now;
          grantor.planStatusChangedBy = reviewerObjectId;
          grantor.archiveExpiresAt = approvedExpiry;

          await grantor.save({ session });
        }

        archiveRequest.status = approving
          ? ArchiveRequestStatus.APPROVED
          : ArchiveRequestStatus.REJECTED;

        archiveRequest.reviewedBy = reviewerObjectId;
        archiveRequest.reviewedAt = now;
        archiveRequest.reviewNote = normalizedReviewNote;

        await archiveRequest.save({ session });

        return {
          requestId: archiveRequest._id,
          grantorId: archiveRequest.grantorId,
          status: archiveRequest.status,
          reviewedBy: archiveRequest.reviewedBy,
          reviewedAt: archiveRequest.reviewedAt,
          reviewNote: archiveRequest.reviewNote,
          ...(approving
            ? {
                planStatus: PlanStatus.ARCHIVED,
                archiveType,
                archiveExpiresAt: approvedExpiry,
              }
            : {}),
        };
      },
    );

    return res.status(200).json({
      success: true,
      message: approving
        ? "Archive request approved. Grantor account archived."
        : "Archive request rejected. Grantor account unchanged.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      "archiveReviewError" in error &&
      error.archiveReviewError === true &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
    ) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

// Controller to get the authenticated user's latest grantor archive request for a specific connection.
export const getMyGrantorArchiveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const requesterId = req.user?._id;
    const { connectionId } = req.params;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (
      typeof connectionId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(connectionId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid connection ID.",
      });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      proxyUserId: requesterId,
      status: "active",
    })
      .select("_id grantorId")
      .lean<{
        _id: mongoose.Types.ObjectId;
        grantorId: mongoose.Types.ObjectId;
      } | null>();

    if (!connection) {
      return res.status(404).json({
        success: false,
        message:
          "An active grantor connection belonging to you was not found.",
      });
    }

    const archiveRequest = await ArchiveRequest.findOne({
      connectionId: connection._id,
      grantorId: connection.grantorId,
      requestedBy: requesterId,
    })
      .select(
        "_id connectionId grantorId reason status " +
        "requesterNote createdAt reviewedAt",
      )
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: archiveRequest
        ? "Your latest archive request retrieved."
        : "You have not submitted an archive request for this connection.",
      data: archiveRequest ?? null,
    });
  } catch (error) {
    return next(error);
  }
};

// Controller to get pending grantor archive requests for admin users.
export const getPendingGrantorArchiveRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Keep this check as well as the route's admin middleware.
    if (
      req.user?.role !== "ADMIN" &&
      req.user?.role !== "SUPER_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access is required.",
      });
    }

    const requests = await ArchiveRequest.find({
      status: ArchiveRequestStatus.PENDING,
    })
      .select(
        "grantorId requestedBy connectionId reason status " +
        "requesterNote createdAt",
      )
      .populate({
        path: "grantorId",
        select: "email planStatus",
      })
      .populate({
        path: "requestedBy",
        select: "email",
      })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Pending archive requests retrieved.",
      data: requests,
    });
  } catch (error) {
    return next(error);
  }
};


// Duplicate acceptProxyInvite implementation removed in favor of the handler that uses
// acceptProxyInviteService imported from ../connections/connection.service to avoid
// conflicting declarations and to centralize invite acceptance logic.
