"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmergencyRelease = exports.requestEmergencyRelease = exports.updateConnectionProxyInfo = exports.validateProxyInvite = exports.createDirectProxyConnectionService = exports.acceptProxyDirectly = exports.denyProxyDirectly = exports.sendConnectionRequest = exports.createProxyConnection = exports.connectionSearcher = exports.getConnectionsForUser = void 0;
const user_model_1 = require("../auth/user.model");
const connection_model_1 = __importDefault(require("./connection.model"));
const connection_service_1 = require("../connections/connection.service");
// import Request from "twilio/lib/http/request";
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
//
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
// Update connection info (based on connectionID)
const updateConnectionProxyInfo = async (req, res) => {
    const result = await (0, connection_service_1.updateConnectionProxyService)(req);
    return res.status(result.status === "success" ? 200 : 400).json(result);
};
exports.updateConnectionProxyInfo = updateConnectionProxyInfo;
// export const acceptProxyInvite = async (req: Request, res: Response) => {
//   try {
//     const { token, userId } = req.body;
//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         message: "Invite token is required",
//       });
//     }
//     const connection = await Connection.findOne({
//       inviteToken: token,
//       inviteExpiresAt: { $gt: new Date() },
//       status: "invited",
//     });
//     if (!connection) {
//       return res.status(404).json({
//         success: false,
//         message: "Invalid or expired invite",
//       });
//     }
//     if (userId) {
//       connection.proxyUserId = userId;
//     }
//     connection.status = "active";
//     connection.acceptedAt = new Date();
//     connection.inviteToken = null;
//     connection.inviteExpiresAt = null;
//     await connection.save();
//     return res.status(200).json({
//       success: true,
//       message: "Proxy invite accepted",
//       data: connection,
//     });
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : String(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to accept proxy invite",
//       error: errorMessage,
//     });
//   }
// };
const requestEmergencyRelease = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { reason, evidenceNote } = req.body;
        const connection = await connection_model_1.default.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection not found" });
        }
        if (connection.status !== "active") {
            return res.status(400).json({ success: false, message: "Connection is not active" });
        }
        connection.releaseStatus = "pending-release";
        connection.releaseReason = reason || "proxy-request";
        connection.releaseRequestedBy = req.user?._id || null;
        connection.releaseRequestedAt = new Date();
        connection.evidenceNote = evidenceNote || "";
        await connection.save();
        return res.status(200).json({
            success: true,
            message: "Emergency release requested",
            data: connection,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            success: false,
            message: "Failed to request emergency release",
            error: errorMessage,
        });
    }
};
exports.requestEmergencyRelease = requestEmergencyRelease;
const verifyEmergencyRelease = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { approved, evidenceNote } = req.body;
        const connection = await connection_model_1.default.findById(connectionId);
        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection not found" });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify emergency release",
            error: errorMessage,
        });
    }
};
exports.verifyEmergencyRelease = verifyEmergencyRelease;
// Duplicate acceptProxyInvite implementation removed in favor of the handler that uses
// acceptProxyInviteService imported from ../connections/connection.service to avoid
// conflicting declarations and to centralize invite acceptance logic.
