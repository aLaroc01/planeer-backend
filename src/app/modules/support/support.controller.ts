import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SupportService } from "./support.service";

export const createSupportTicket = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "Unauthorized",
        data: null,
      });
      return;
    }

    const ticket = await SupportService.createTicket(userId, req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  }
);

export const getMySupportTickets = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "Unauthorized",
        data: null,
      });
      return;
    }

    const tickets = await SupportService.getMyTickets(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your support tickets retrieved successfully",
      data: tickets,
    });
  }
);

export const getAllSupportTickets = catchAsync(
  async (req: Request, res: Response) => {
    const status = req.query.status as
      | "OPEN"
      | "IN_PROGRESS"
      | "RESOLVED"
      | "CLOSED"
      | undefined;

    const tickets = await SupportService.getAllTickets(status);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Support tickets retrieved successfully",
      data: tickets,
    });
  }
);

export const updateSupportTicketAsAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "Unauthorized",
        data: null,
      });
      return;
    }

    const ticket = await SupportService.updateTicketAsAdmin(
      req.params.ticketId,
      req.body,
      userId,
    );

    if (!ticket) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Support ticket not found",
        data: null,
      });
      return;
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Support ticket updated successfully",
      data: ticket,
    });
  }
);