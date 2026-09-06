"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChecklist = exports.updateChecklist = exports.getChecklistByUser = exports.createChecklist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const checklist_service_1 = __importDefault(require("./checklist.service"));
const connection_model_1 = __importDefault(require("../connections/connection.model"));
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
const getChecklistByUser = async (req, res) => {
    try {
        const requesterId = req.user?.id;
        const checklistOwnerId = req.params.id;
        if (!requesterId) {
            return res.status(401).json({
                status: "failed",
                message: "Unauthorized",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(requesterId)) {
            return res.status(401).json({
                status: "failed",
                message: "Invalid authenticated user ID",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(checklistOwnerId)) {
            return res.status(400).json({
                status: "failed",
                message: "Invalid checklist owner ID",
            });
        }
        const isOwner = requesterId === checklistOwnerId;
        if (!isOwner) {
            const activeConnection = await connection_model_1.default.exists({
                grantorId: checklistOwnerId,
                proxyUserId: requesterId,
                status: "active",
            });
            if (!activeConnection) {
                return res.status(403).json({
                    status: "failed",
                    message: "You do not have permission to view this checklist",
                });
            }
        }
        const result = await checklistService.getChecklistByUser(checklistOwnerId);
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
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.getChecklistByUser = getChecklistByUser;
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
