// for mongoose model
import { model, Schema, Types } from 'mongoose'
import { PROFILE } from './profile.interface';



const profileSchema =  new Schema<PROFILE>({
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipcode: {type: String, default: "" },
    imgUrl: { type: String, default: "" },
    phoneNumber: {  type: String, default: ""  }, 
    mainRole: { type: String },
    suggestions: {
        type: [
            {
            key: {
                type: String,
                required: true,
            },
            completed: {
                type: Boolean,
                default: false,
            },
            completedAt: {
                type: Date,
                default: null,
            },
            dismissed: {
                type: Boolean,
                default: false,
            },
            dismissedAt: {
                type: Date,
                default: null,
            },
            },
        ],
        default: [],
        },


    userID: { type: Types.ObjectId,   ref: 'User', required: true},
    },{
    timestamps: true,versionKey: false
})

profileSchema.index({ userID: 1 }, { unique: true });

export const ProfileModel = model<PROFILE>("profile", profileSchema);