import { Document, Types } from "mongoose";
import { IUser } from "../auth/user.interface";

export type ChecklistStatus = "pending" | "in-progress" | "done";

export interface ChecklistItem {
  title: string;
  category: "financial" | "medical" | "legal" | "digital" | "personal";
  instructions: string;
  status: ChecklistStatus;
}

export interface CHECKLIST {
  title: string;
  category: "financial" | "medical" | "legal" | "digital" | "personal";
  instructions: string;
  status: ChecklistStatus;
  userID: string;
  createdAt?: Date;
  updatedAt?: Date;
}