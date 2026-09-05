import { Types } from "mongoose";

export type TSupportTicket = {
  userId: Types.ObjectId;
  subject: string;
  message: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  adminReply?: string;

  updatedBy?: Types.ObjectId | null;
  updatedByAt?: Date | null;
};
