"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChecklist = exports.updateChecklist = exports.updateChecklistProxy = exports.getChecklistByCurrentUser = exports.createChecklist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const checklist_service_1 = __importDefault(require("./checklist.service"));
const checklist_model_1 = __importDefault(require("./checklist.model"));
const checklistService = new checklist_service_1.default();
const getAuthenticatedUserId = (req) => {
    return req.user?.id;
};
const validateItems = (items) => {
    return Array.isArray(items);
};
const createChecklist = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({
                status: "failed",
                message: "Unauthorized",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
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
        const result = await checklistService.createChecklist(userId, {
            items: req.body.items,
        });
        return res.status(200).json({
            status: "success",
            message: "Checklist saved successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.createChecklist = createChecklist;
const getChecklistByCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                status: "failed",
                message: "Unauthorized",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
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
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.getChecklistByCurrentUser = getChecklistByCurrentUser;
const updateChecklistProxy = async (req, res) => {
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
            if (!mongoose_1.default.Types.ObjectId.isValid(proxyId)) {
                return res.status(400).json({
                    status: "failed",
                    message: "Invalid proxyId",
                });
            }
        }
        const checklist = await checklist_model_1.default.findOneAndUpdate({ userId: ownerId }, { proxyId: proxyId ?? null });
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
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.updateChecklistProxy = updateChecklistProxy;
const updateChecklist = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        if (!userId) {
            return res.status(401).json({
                status: "failed",
                message: "Unauthorized",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
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
        const result = await checklistService.updateChecklistByUser(userId, {
            items: req.body.items,
        });
        return res.status(200).json({
            status: "success",
            message: "Checklist updated successfully",
            data: result,
        });
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.updateChecklist = updateChecklist;
const deleteChecklist = async (req, res) => {
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
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.deleteChecklist = deleteChecklist;
