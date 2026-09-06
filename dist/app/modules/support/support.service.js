"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const mongoose_1 = require("mongoose");
const support_model_1 = require("./support.model");
const createTicket = async (userId, payload) => {
    return support_model_1.SupportTicket.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        subject: payload.subject.trim(),
        message: payload.message.trim(),
        priority: payload.priority ?? "NORMAL",
        status: "OPEN",
    });
};
const getMyTickets = async (userId) => {
    const activeTickets = await support_model_1.SupportTicket.find({
        userId,
        status: { $nin: ["RESOLVED", "CLOSED"] },
    })
        .sort({ updatedAt: -1 })
        .limit(3);
    const remainingSlots = 3 - activeTickets.length;
    if (remainingSlots <= 0) {
        return activeTickets;
    }
    const resolvedTickets = await support_model_1.SupportTicket.find({
        userId,
        status: { $in: ["RESOLVED", "CLOSED"] },
    })
        .sort({ updatedAt: -1 })
        .limit(remainingSlots);
    return [...activeTickets, ...resolvedTickets];
};
const getAllTickets = async (status) => {
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
        return support_model_1.SupportTicket.find({ status })
            .populate(populateFields)
            .sort({ updatedAt: -1 });
    }
    // Default dashboard view:
    // active tickets first, resolved/closed tickets last.
    const activeTickets = await support_model_1.SupportTicket.find({
        status: { $nin: ["RESOLVED", "CLOSED"] },
    })
        .populate(populateFields)
        .sort({ updatedAt: -1 });
    const completedTickets = await support_model_1.SupportTicket.find({
        status: { $in: ["RESOLVED", "CLOSED"] },
    })
        .populate(populateFields)
        .sort({ resolvedAt: -1, updatedAt: -1 });
    return [...activeTickets, ...completedTickets];
};
const updateTicketAsAdmin = async (ticketId, payload, adminId) => {
    const ticket = await support_model_1.SupportTicket.findById(ticketId);
    if (!ticket) {
        throw new Error("Support ticket not found.");
    }
    if (ticket.status === "RESOLVED") {
        throw new Error("Resolved tickets cannot be updated.");
    }
    const update = {
        ...payload,
        updatedBy: adminId,
        updatedByAt: new Date(),
    };
    if (payload.status === "RESOLVED" || payload.status === "CLOSED") {
        update.resolvedAt = new Date();
    }
    if (payload.status === "OPEN" ||
        payload.status === "IN_PROGRESS") {
        update.resolvedAt = null;
    }
    return support_model_1.SupportTicket.findByIdAndUpdate(ticketId, { $set: update }, {
        new: true,
        runValidators: true,
    });
};
exports.SupportService = {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateTicketAsAdmin,
};
