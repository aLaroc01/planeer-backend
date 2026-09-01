
// for mongoose model

import { model, Schema, Types } from 'mongoose'
import { REPORT } from './report.interface';





const financialSchema =  new Schema<REPORT>({
    
    
   
    problemtitle: { type: String, required:true },
    desdetails: { type: String, required:true },
    status: { 
    type: String, 
    enum: ["Progress", "Completed"], 
    default: "Progress" 
  },
    userID: { type: Types.ObjectId,   ref: 'User',required:true},

    },{
    timestamps: true,versionKey: false
})

export const ReportModel = model<REPORT>("report", financialSchema);