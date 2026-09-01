import { model, Schema, Types } from "mongoose"
import { IUser, Role } from "./user.interface"

const userSchema =  new Schema<IUser>({
  firstName: {
    type: String,
  
  
  },
  lastName: {
    type: String,
  
  },
  dateOfBirth: {
    type: Date,
  
  },
  city: {
    type: String,

  },
  state: {
    type: String,
  
  },
  company: {
    type: String,
   
  },
  yearStarted: {
    type: Number,
   
  },
  email: {
    type: String,
    required: true,
    unique: true,  // Ensures email is unique
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6, // You can adjust the minimum password length as needed
   
  },
  phoneNumber: {
    type: String,
    // match: /^\+[1-9]\d{1,14}$/,
  },
   otp:{type:String},

      imgUrl: {
        type: String,
         default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
   
     proxysetId: [{ type: Types.ObjectId, ref: "User" }],
       stripeCustomerId: {
               type: String,
               default: '',
          },
    userPercentage: { type: Number },
    role: {
        type: String,
        enum: Object.values(Role),
        default: Role.USER
    },
  
}, {
    timestamps: true,versionKey:false
})


export const User = model<IUser>("User", userSchema)