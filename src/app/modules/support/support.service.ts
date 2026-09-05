import { Types } from "mongoose";
import { SupportTicket } from "./support.model";

type CreateTicketPayload = {
  subject: string;
  message: string;
  priority?: "LOW" | "NORMAL" | "HIGH";
};

export type UpdateTicketPayload = {
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  adminReply?: string;
};

const createTicket = async (
  userId: string,
  payload: CreateTicketPayload
) => {
  return SupportTicket.create({
    userId: new Types.ObjectId(userId),
    subject: payload.subject.trim(),
    message: payload.message.trim(),
    priority: payload.priority ?? "NORMAL",
    status: "OPEN",
  });
};

const getMyTickets = async (userId: string) => {
  const activeTickets = await SupportTicket.find({
    userId,
    status: { $nin: ["RESOLVED", "CLOSED"] },
  })
    .sort({ updatedAt: -1 })
    .limit(3);

  const remainingSlots = 3 - activeTickets.length;

  if (remainingSlots <= 0) {
    return activeTickets;
  }

  const resolvedTickets = await SupportTicket.find({
    userId,
    status: { $in: ["RESOLVED", "CLOSED"] },
  })
    .sort({ updatedAt: -1 })
    .limit(remainingSlots);

  return [...activeTickets, ...resolvedTickets];
};

const getAllTickets = async (
  status?: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
) => {
  const populateFields = [
    {
      path: "userId",
      select: "firstName lastName email imgUrl",
    },
    {
      path: "updatedBy",
      select: "firstName lastName email imgUrl",
    },
  ];

  // If the dashboard filters by a specific status,
  // return only that status, newest updates first.
  if (status) {
    return SupportTicket.find({ status })
      .populate(populateFields)
      .sort({ updatedAt: -1 });
  }

  // Default dashboard view:
  // active tickets first, resolved/closed tickets last.
  const activeTickets = await SupportTicket.find({
    status: { $nin: ["RESOLVED", "CLOSED"] },
  })
    .populate(populateFields)
    .sort({ updatedAt: -1 });

  const completedTickets = await SupportTicket.find({
    status: { $in: ["RESOLVED", "CLOSED"] },
  })
    .populate(populateFields)
    .sort({ resolvedAt: -1, updatedAt: -1 });

  return [...activeTickets, ...completedTickets];
};


const updateTicketAsAdmin = async (
    ticketId: string,
    payload: UpdateTicketPayload,
    adminId: string
    ) => {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
        throw new Error("Support ticket not found.");
    }

    if (ticket.status === "RESOLVED") {
        throw new Error("Resolved tickets cannot be updated.");
    }

    const update: UpdateTicketPayload & {
        resolvedAt?: Date | null;
        updatedBy?: string;
        updatedByAt?: Date;
    } = {
        ...payload,
        updatedBy: adminId,
        updatedByAt: new Date(),
    };

    if (payload.status === "RESOLVED" || payload.status === "CLOSED") {
        update.resolvedAt = new Date();
    }

    if (
        payload.status === "OPEN" ||
        payload.status === "IN_PROGRESS"
    ) {
        update.resolvedAt = null;
    }

    return SupportTicket.findByIdAndUpdate(
        ticketId,
        { $set: update },
        {
        new: true,
        runValidators: true,
        }
    );
};

export const SupportService = {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketAsAdmin,
};



