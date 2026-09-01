import { model, Schema, Types } from "mongoose";
import { Review } from "./reviews.interface";

const financialSchema =  new Schema<Review>({
    comment: { type: String, required:true },
    rating: {type: Number,required: true },
    userID: { type: Types.ObjectId,   ref: 'User',required:true},

    },{
    timestamps: true,versionKey: false
})

export const ReviewModel = model<Review>("reviews", financialSchema);