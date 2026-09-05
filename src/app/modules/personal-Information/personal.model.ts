
// for mongoose model

import { model, Schema, Types } from 'mongoose'
import { PERSONAL } from './personal.interface';



const personalSchema =  new Schema<PERSONAL>({
    personalItems: { type: String, default: "" },
    collectables: { type: String, default: "" },
    personalValues: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },
    sentimentalItems: { type: String, default: "" },

    userID: { type: Types.ObjectId,   ref: 'User', required: true},
    },{
    timestamps: true,versionKey: false
})

export const PersonalModel = model<PERSONAL>("personal", personalSchema);