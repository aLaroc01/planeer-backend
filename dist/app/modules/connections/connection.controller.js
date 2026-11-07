"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingGrantorArchiveRequests = exports.restoreGrantorArchive = exports.getMyGrantorArchiveRequest = exports.reviewGrantorArchiveRequest = exports.requestGrantorArchive = exports.validateProxyInvite = exports.createDirectProxyConnectionService = exports.acceptProxyDirectly = exports.denyProxyDirectly = exports.cancelConnectionDirectly = exports.sendConnectionRequest = exports.createProxyConnection = exports.connectionSearcher = exports.getConnectionsForUser = void 0;
const user_model_1 = require("../auth/user.model");
const connection_model_1 = __importDefault(require("./connection.model"));
const connection_service_1 = require("../connections/connection.service");
const archive_request_model_1 = require("../archive-request/archive-request.model");
const user_interface_1 = require("../auth/user.interface");
const mongoose_1 = __importDefault(require("mongoose"));
const restoreExpiredArchive_1 = require("../../../helpers/restoreExpiredArchive");
const subscriptions_model_1 = require("../../modules/subscriptions-information/subscriptions.model");
const getProxyEmail = (body) => String(body.proxyEmail || body.email || "").trim().toLowerCase();
const canAddProxy = async (grantorId, proxyUserId) => {
    const currentUser = await user_model_1.User.findById(grantorId);
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
const getConnectionsForUser = async (req, res) => {
    try {
        const result = await (0, connection_service_1.getConnectionsForUserService)(req);
        console.log("getConnectionsForUser result:", result.data);
        return res.status(result.status === "success" ? 200 : 400).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.getConnectionsForUser = getConnectionsForUser;
const connectionSearcher = async (req, res) => {
    try {
        const result = await (0, connection_service_1.canAddGrantorForProxy)(req);
        const statusCode = (result.status === "success") ? 200 : 400;
        return res.status(statusCode).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.connectionSearcher = connectionSearcher;
// createProxyConnectionService is implemented in ../connections/connection.service
// Local implementation removed to avoid duplicate declaration with the imported symbol.
const createProxyConnection = async (req, res) => {
    try {
        const result = await (0, connection_service_1.createProxyConnectionService)(req);
        const statusCode = (result.status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
        return res.status(statusCode).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.createProxyConnection = createProxyConnection;
// accept proxy invite call by proxy user when they click the email link and sign up to system, 
// this will update the connection with proxy user id and change status to active
const sendConnectionRequest = async (req, res) => {
    try {
        const result = await (0, connection_service_1.sendConnectionRequestService)(req);
        const statusCode = (result.status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
        return res.status(statusCode).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.sendConnectionRequest = sendConnectionRequest;
// Remove connection controller
const cancelConnectionDirectly = async (req, res) => {
    try {
        const result = await (0, connection_service_1.cancelConnectionService)(req);
        const statusCode = result.status === "success" ? 200 : 400;
        return res.status(statusCode).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error?.message || "Failed to cancel connection",
        });
    }
};
exports.cancelConnectionDirectly = cancelConnectionDirectly;
// Deny proxy direct from profile ( or other ) page
const denyProxyDirectly = async (req, res) => {
    try {
        const result = await (0, connection_service_1.denyProxyDirectService)(req);
        // console.log("updated connection id:", result.data);
        const statusCode = (result.status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
        return res.status(statusCode).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.denyProxyDirectly = denyProxyDirectly;
// Accept proxy direct from profile ( and other ) page
const acceptProxyDirectly = async (req, res) => {
    try {
        const result = await (0, connection_service_1.acceptProxyDirectService)(req);
        // console.log("updated connection id:", result, ",", req.body.connId);
        const statusCode = (result.status === "success") ? 200 : 400; // Map "success" to 200, anything else to 400
        return res.status(statusCode).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.acceptProxyDirectly = acceptProxyDirectly;
// Create a direct proxy connection for the current user.
const createDirectProxyConnectionService = async (req) => {
    try {
        const currentUserId = req.user?.id;
        const proxyEmail = getProxyEmail(req.body.proxyId);
        if (!currentUserId) {
            return { status: "failed", message: "Unauthorized" };
        }
        if (!proxyEmail) {
            return { status: "failed", message: "Proxy email is required" };
        }
        const currentUser = await user_model_1.User.findById(currentUserId);
        if (!currentUser) {
            return { status: "failed", message: "Current user not found" };
        }
        const proxyUser = await user_model_1.User.findOne({ email: proxyEmail });
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
    }
    catch (error) {
        return {
            status: "failed",
            message: error.message || "Something went wrong",
        };
    }
};
exports.createDirectProxyConnectionService = createDirectProxyConnectionService;
// validate the proxy invite
const validateProxyInvite = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Invite token is required",
            });
        }
        const connection = await connection_model_1.default.findOne({
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            success: false,
            message: "Failed to validate proxy invite",
            error: errorMessage,
        });
    }
};
exports.validateProxyInvite = validateProxyInvite;
// Controller to handle requests for archiving a grantor's connection by the requester.
const requestGrantorArchive = async (req, res, next) => {
    try {
        const requesterId = req.user?._id;
        const { connectionId } = req.params;
        if (!requesterId) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required.",
            });
        }
        if (typeof connectionId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(connectionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid connection ID.",
            });
        }
        const { reason, requesterNote, evidenceFileIds, } = req.body ?? {};
        if (reason !== archive_request_model_1.ArchiveRequestReason.INCAPACITY &&
            reason !== archive_request_model_1.ArchiveRequestReason.DEATH) {
            return res.status(400).json({
                success: false,
                message: "Reason must be INCAPACITY or DEATH.",
            });
        }
        if (requesterNote !== undefined &&
            typeof requesterNote !== "string") {
            return res.status(400).json({
                success: false,
                message: "Requester note must be a string.",
            });
        }
        const normalizedNote = typeof requesterNote === "string"
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
        if (evidenceFileIds !== undefined &&
            !Array.isArray(evidenceFileIds)) {
            return res.status(400).json({
                success: false,
                message: "Evidence file IDs must be an array.",
            });
        }
        if (Array.isArray(evidenceFileIds) &&
            evidenceFileIds.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Evidence attachments are not enabled yet. Submit without attachments.",
            });
        }
        // Verify signup verification from the database, not the request body.
        const requester = await user_model_1.User.findById(requesterId)
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
                message: "Complete account verification before submitting an archive request.",
            });
        }
        // An active relationship determines proxy permission.
        // Do not require Role.PROXY: a grantor can also be someone's proxy.
        const connection = await connection_model_1.default.findOne({
            _id: connectionId,
            proxyUserId: requesterId,
            status: "active",
        });
        if (!connection) {
            return res.status(404).json({
                success: false,
                message: "An active grantor connection belonging to you was not found.",
            });
        }
        if (connection.grantorId.toString() === requesterId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot submit a proxy archive request for your own account.",
            });
        }
        const grantor = await user_model_1.User.findById(connection.grantorId)
            .select("planStatus");
        if (!grantor) {
            return res.status(404).json({
                success: false,
                message: "Grantor account not found.",
            });
        }
        if (grantor.planStatus === user_interface_1.PlanStatus.ARCHIVED) {
            return res.status(409).json({
                success: false,
                message: "The grantor account is already archived.",
            });
        }
        const pendingRequest = await archive_request_model_1.ArchiveRequest.exists({
            grantorId: connection.grantorId,
            status: archive_request_model_1.ArchiveRequestStatus.PENDING,
        });
        if (pendingRequest) {
            return res.status(409).json({
                success: false,
                message: "A pending archive request already exists for this grantor.",
            });
        }
        const archiveRequest = await archive_request_model_1.ArchiveRequest.create({
            grantorId: connection.grantorId,
            requestedBy: requesterId,
            connectionId: connection._id,
            reason,
            requesterNote: normalizedNote,
            evidenceFileIds: [],
            status: archive_request_model_1.ArchiveRequestStatus.PENDING,
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
    }
    catch (error) {
        // Handles two proxies submitting simultaneously.
        // The database's unique partial index is the final safeguard.
        if (error !== null &&
            typeof error === "object" &&
            "code" in error &&
            error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A pending archive request already exists for this grantor.",
            });
        }
        return next(error);
    }
};
exports.requestGrantorArchive = requestGrantorArchive;
// Controller to review pending grantor archive requests for admin users (accept/reject).
const reviewGrantorArchiveRequest = async (req, res, next) => {
    const reject = (statusCode, message) => {
        const error = new Error(message);
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
        if (reviewerRole !== user_interface_1.Role.ADMIN &&
            reviewerRole !== user_interface_1.Role.SUPER_ADMIN) {
            return reject(403, "Admin access is required.");
        }
        if (typeof requestId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(requestId)) {
            return reject(400, "Invalid archive request ID.");
        }
        const { decision, reviewNote, archiveType, archiveExpiresAt, } = req.body ?? {};
        if (decision !== "approve" && decision !== "reject") {
            return reject(400, "Decision must be approve or reject.");
        }
        if (typeof reviewNote !== "string" ||
            !reviewNote.trim()) {
            return reject(400, "A review note is required.");
        }
        const normalizedReviewNote = reviewNote.trim();
        if (normalizedReviewNote.length > 2000) {
            return reject(400, "Review note cannot exceed 2,000 characters.");
        }
        const approving = decision === "approve";
        let approvedExpiry = null;
        if (approving) {
            if (archiveType !== "temporary" &&
                archiveType !== "permanent") {
                return reject(400, "Approval requires a temporary or permanent archive type.");
            }
            if (archiveType === "temporary") {
                if (typeof archiveExpiresAt !== "string") {
                    return reject(400, "Temporary archiving requires an expiry date string.");
                }
                approvedExpiry = new Date(archiveExpiresAt);
                if (Number.isNaN(approvedExpiry.getTime()) ||
                    approvedExpiry.getTime() <= Date.now()) {
                    return reject(400, "Archive expiry must be a valid future date.");
                }
            }
            else if (archiveExpiresAt !== undefined &&
                archiveExpiresAt !== null) {
                return reject(400, "Permanent archiving cannot have an expiry date.");
            }
        }
        else if (archiveType !== undefined ||
            archiveExpiresAt !== undefined) {
            return reject(400, "Do not provide archive settings when rejecting a request.");
        }
        const reviewerObjectId = new mongoose_1.default.Types.ObjectId(reviewerId.toString());
        const result = await mongoose_1.default.connection.transaction(async (session) => {
            const archiveRequest = await archive_request_model_1.ArchiveRequest.findById(requestId).session(session);
            if (!archiveRequest) {
                return reject(404, "Archive request not found.");
            }
            if (archiveRequest.status !== archive_request_model_1.ArchiveRequestStatus.PENDING) {
                return reject(409, "This archive request is no longer pending.");
            }
            // Prevent reviewing a case about yourself or one you submitted.
            if (archiveRequest.requestedBy.toString() ===
                reviewerObjectId.toString() ||
                archiveRequest.grantorId.toString() ===
                    reviewerObjectId.toString()) {
                return reject(403, "You cannot review your own archive case.");
            }
            const now = new Date();
            if (approving) {
                if (approvedExpiry &&
                    approvedExpiry.getTime() <= now.getTime()) {
                    return reject(400, "Archive expiry must still be in the future.");
                }
                // Confirm the requester is still the connected proxy.
                const connection = await connection_model_1.default.findOne({
                    _id: archiveRequest.connectionId,
                    grantorId: archiveRequest.grantorId,
                    proxyUserId: archiveRequest.requestedBy,
                    status: "active",
                }).session(session);
                if (!connection) {
                    return reject(409, "The requesting proxy no longer has an active connection.");
                }
                const grantor = await user_model_1.User.findById(archiveRequest.grantorId).session(session);
                if (!grantor) {
                    return reject(404, "Grantor account not found.");
                }
                if (grantor.planStatus === user_interface_1.PlanStatus.ARCHIVED) {
                    return reject(409, "The grantor account is already archived.");
                }
                grantor.planStatus = user_interface_1.PlanStatus.ARCHIVED;
                grantor.planStatusChangedAt = now;
                grantor.planStatusChangedBy = reviewerObjectId;
                grantor.archiveExpiresAt = approvedExpiry;
                grantor.activeArchiveRequestId = archiveRequest._id;
                // Record the approved archive settings on this request.
                archiveRequest.archiveType =
                    archiveType === "temporary" ? "temporary" : "permanent";
                archiveRequest.archiveExpiresAt = approvedExpiry;
                archiveRequest.archiveEndedAt = null;
                archiveRequest.archiveEndReason = null;
                await grantor.save({ session });
            }
            // Preserve the admin's review decision separately
            // from the archive lifecycle.
            archiveRequest.status = approving
                ? archive_request_model_1.ArchiveRequestStatus.APPROVED
                : archive_request_model_1.ArchiveRequestStatus.REJECTED;
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
                        planStatus: user_interface_1.PlanStatus.ARCHIVED,
                        archiveType,
                        archiveExpiresAt: approvedExpiry,
                    }
                    : {}),
            };
        });
        return res.status(200).json({
            success: true,
            message: approving
                ? "Archive request approved. Grantor account archived."
                : "Archive request rejected. Grantor account unchanged.",
            data: result,
        });
    }
    catch (error) {
        if (error instanceof Error &&
            "archiveReviewError" in error &&
            error.archiveReviewError === true &&
            "statusCode" in error &&
            typeof error.statusCode === "number") {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        return next(error);
    }
};
exports.reviewGrantorArchiveRequest = reviewGrantorArchiveRequest;
const isValidObjectId = (value) => typeof value === "string" && mongoose_1.default.Types.ObjectId.isValid(value);
// Controller to get the authenticated user's latest grantor archive request for a specific connection.
const getMyGrantorArchiveRequest = async (req, res, next) => {
    try {
        const requesterId = req.user?._id;
        const { connectionId } = req.params;
        if (!requesterId) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required.",
            });
        }
        if (typeof connectionId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(connectionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid connection ID.",
            });
        }
        const connection = await connection_model_1.default.findOne({
            _id: connectionId,
            proxyUserId: requesterId,
            status: "active",
        })
            .select("_id grantorId")
            .lean();
        if (!connection) {
            return res.status(404).json({
                success: false,
                message: "An active grantor connection belonging to you was not found.",
            });
        }
        await (0, restoreExpiredArchive_1.restoreExpiredArchive)(connection.grantorId.toString());
        const archiveRequest = await archive_request_model_1.ArchiveRequest.findOne({
            connectionId: connection._id,
            grantorId: connection.grantorId,
            requestedBy: requesterId,
        })
            .select("_id connectionId grantorId reason status " +
            "requesterNote createdAt reviewedAt " +
            "archiveType archiveExpiresAt archiveEndedAt archiveEndReason")
            .sort({ createdAt: -1, _id: -1 })
            .lean();
        return res.status(200).json({
            success: true,
            message: archiveRequest
                ? "Your latest archive request retrieved."
                : "You have not submitted an archive request for this connection.",
            data: archiveRequest ?? null,
        });
    }
    catch (error) {
        return next(error);
    }
};
exports.getMyGrantorArchiveRequest = getMyGrantorArchiveRequest;
// Manually restore grantor controller
const restoreGrantorArchive = async (req, res, next) => {
    const reject = (statusCode, message) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.archiveRestoreError = true;
        throw error;
    };
    try {
        const actorId = req.user?._id;
        const { requestId } = req.params;
        if (!actorId) {
            return reject(401, "Authentication is required.");
        }
        // Defense in depth alongside the route middleware.
        if (req.user?.role !== user_interface_1.Role.SUPER_ADMIN) {
            return reject(403, "Only super admins can manually restore archived accounts.");
        }
        if (typeof requestId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(requestId)) {
            return reject(400, "Invalid archive request ID.");
        }
        const { restorationNote } = req.body ?? {};
        if (typeof restorationNote !== "string" ||
            !restorationNote.trim()) {
            return reject(400, "A restoration note is required.");
        }
        const normalizedNote = restorationNote.trim();
        if (normalizedNote.length > 2000) {
            return reject(400, "Restoration note cannot exceed 2,000 characters.");
        }
        const actorObjectId = new mongoose_1.default.Types.ObjectId(actorId.toString());
        const result = await mongoose_1.default.connection.transaction(async (session) => {
            // Recheck the current database role in this transaction.
            const authorizedActor = await user_model_1.User.exists({
                _id: actorObjectId,
                role: user_interface_1.Role.SUPER_ADMIN,
            }).session(session);
            if (!authorizedActor) {
                return reject(403, "Super admin access is required.");
            }
            const archiveRequest = await archive_request_model_1.ArchiveRequest.findById(requestId).session(session);
            if (!archiveRequest) {
                return reject(404, "Archive request not found.");
            }
            if (archiveRequest.status !== archive_request_model_1.ArchiveRequestStatus.APPROVED ||
                archiveRequest.archiveEndedAt != null ||
                archiveRequest.archiveEndReason != null) {
                return reject(409, "This request does not have an active approved archive.");
            }
            const validArchiveSettings = (archiveRequest.archiveType === "temporary" &&
                archiveRequest.archiveExpiresAt instanceof Date &&
                !Number.isNaN(archiveRequest.archiveExpiresAt.getTime())) ||
                (archiveRequest.archiveType === "permanent" &&
                    archiveRequest.archiveExpiresAt === null);
            if (!validArchiveSettings) {
                return reject(409, "Archive settings are incomplete. Reconciliation is required.");
            }
            const grantor = await user_model_1.User.findById(archiveRequest.grantorId)
                .select("_id planStatus archiveExpiresAt " +
                "activeArchiveRequestId planStatusChangedAt")
                .session(session);
            if (!grantor) {
                return reject(404, "Grantor account not found.");
            }
            if (grantor.planStatus !== user_interface_1.PlanStatus.ARCHIVED ||
                grantor.activeArchiveRequestId?.toString() !==
                    archiveRequest._id.toString()) {
                return reject(409, "This request is not the account's active archive.");
            }
            const grantorExpiry = grantor.archiveExpiresAt?.getTime() ?? null;
            const requestExpiry = archiveRequest.archiveExpiresAt?.getTime() ?? null;
            if (grantorExpiry !== requestExpiry) {
                return reject(409, "Account and request archive settings do not match. Reconciliation is required.");
            }
            const now = new Date();
            // Leave expired temporary archives to the expiration workflow.
            if (archiveRequest.archiveType === "temporary" &&
                archiveRequest.archiveExpiresAt.getTime() <=
                    now.getTime()) {
                return reject(409, "This archive has reached its expiration. Run the expiration restoration workflow instead.");
            }
            const activeSubscription = await subscriptions_model_1.Subscription.exists({
                userId: grantor._id,
                stripeStatus: "active",
                currentPeriodEnd: { $gt: now },
            }).session(session);
            const trialSubscription = activeSubscription
                ? null
                : await subscriptions_model_1.Subscription.exists({
                    userId: grantor._id,
                    stripeStatus: "trialing",
                    currentPeriodEnd: { $gt: now },
                }).session(session);
            const restoredStatus = activeSubscription
                ? user_interface_1.PlanStatus.ACTIVE
                : trialSubscription
                    ? user_interface_1.PlanStatus.TRIALING
                    : user_interface_1.PlanStatus.SUBSCRIPTION_REQUIRED;
            const updateResult = await user_model_1.User.updateOne({
                _id: grantor._id,
                planStatus: user_interface_1.PlanStatus.ARCHIVED,
                activeArchiveRequestId: archiveRequest._id,
                archiveExpiresAt: grantor.archiveExpiresAt,
                planStatusChangedAt: grantor.planStatusChangedAt ?? null,
            }, {
                $set: {
                    planStatus: restoredStatus,
                    archiveExpiresAt: null,
                    activeArchiveRequestId: null,
                    planStatusChangedAt: now,
                    planStatusChangedBy: actorObjectId,
                },
            }, {
                session,
                runValidators: true,
            });
            if (updateResult.modifiedCount !== 1) {
                return reject(409, "Archive state changed during restoration.");
            }
            archiveRequest.archiveEndedAt = now;
            archiveRequest.archiveEndReason =
                archive_request_model_1.ArchiveEndReason.ADMIN_RESTORED;
            archiveRequest.archiveEndedBy = actorObjectId;
            archiveRequest.archiveEndNote = normalizedNote;
            await archiveRequest.save({ session });
            return {
                requestId: archiveRequest._id,
                grantorId: grantor._id,
                planStatus: restoredStatus,
                archiveEndedAt: archiveRequest.archiveEndedAt,
                archiveEndReason: archiveRequest.archiveEndReason,
                archiveEndedBy: archiveRequest.archiveEndedBy,
                archiveEndNote: archiveRequest.archiveEndNote,
            };
        });
        return res.status(200).json({
            success: true,
            message: "Archive reversed. Account access now follows its subscription status.",
            data: result,
        });
    }
    catch (error) {
        if (error instanceof Error &&
            "archiveRestoreError" in error &&
            error.archiveRestoreError === true &&
            "statusCode" in error &&
            typeof error.statusCode === "number") {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        return next(error);
    }
};
exports.restoreGrantorArchive = restoreGrantorArchive;
// Controller to get pending grantor archive requests for admin users.
const getPendingGrantorArchiveRequests = async (req, res, next) => {
    try {
        // Keep this check as well as the route's admin middleware.
        if (req.user?.role !== "ADMIN" &&
            req.user?.role !== "SUPER_ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Admin access is required.",
            });
        }
        const requests = await archive_request_model_1.ArchiveRequest.find({
            status: archive_request_model_1.ArchiveRequestStatus.PENDING,
        })
            .select("grantorId requestedBy connectionId reason status " +
            "requesterNote createdAt")
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
    }
    catch (error) {
        return next(error);
    }
};
exports.getPendingGrantorArchiveRequests = getPendingGrantorArchiveRequests;
// Duplicate acceptProxyInvite implementation removed in favor of the handler that uses
// acceptProxyInviteService imported from ../connections/connection.service to avoid
// conflicting declarations and to centralize invite acceptance logic.
