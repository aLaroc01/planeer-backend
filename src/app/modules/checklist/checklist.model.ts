import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChecklistItem {
  _id?: Types.ObjectId;
  title: string;
  category: "financial" | "medical" | "legal" | "digital" | "personal";
  instructions: string;
  status: "pending" | "in-progress" | "done";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChecklist extends Document {
  userId: Types.ObjectId;
  items: IChecklistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["financial", "medical", "legal", "digital", "personal"],
      required: true,
    },
    instructions: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "done"],
      default: "pending",
    },
  },
  { timestamps: true, _id: false }
);

const ChecklistSchema = new Schema<IChecklist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [ChecklistItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IChecklist>("Checklist", ChecklistSchema);