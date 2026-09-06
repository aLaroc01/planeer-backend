"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSupportTicketAsAdmin = exports.getAllSupportTickets = exports.getMySupportTickets = exports.createSupportTicket = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const support_service_1 = require("./support.service");
exports.createSupportTicket = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
        return;
    }
    const ticket = await support_service_1.SupportService.createTicket(userId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: "Support ticket created successfully",
        data: ticket,
    });
});
exports.getMySupportTickets = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
        return;
    }
    const tickets = await support_service_1.SupportService.getMyTickets(userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Your support tickets retrieved successfully",
        data: tickets,
    });
});
exports.getAllSupportTickets = (0, catchAsync_1.default)(async (req, res) => {
    const status = req.query.status;
    const tickets = await support_service_1.SupportService.getAllTickets(status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Support tickets retrieved successfully",
        data: tickets,
    });
});
exports.updateSupportTicketAsAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
            success: false,
            message: "Unauthorized",
            data: null,
        });
        return;
    }
    const ticket = await support_service_1.SupportService.updateTicketAsAdmin(req.params.ticketId, req.body, userId);
    if (!ticket) {
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
            success: false,
            message: "Support ticket not found",
            data: null,
        });
        return;
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Support ticket updated successfully",
        data: ticket,
    });
});
