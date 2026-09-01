import { Document, Types } from "mongoose";

export enum Role {
    USER = "USER",
    ADMIN = "ADMIN",
    CORPORATE = "CORPORATE",

}

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    city: string;
    state: string;
    company: string;
    yearStarted: number;
    email: string;
    phoneNumber: string;
    otp: string;
    password: string;
    imgUrl: string;
    stripeCustomerId:string;
    userPercentage: number;
    role: Role;
    proxysetId: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    
}


// types/proxyUser.types.ts
export type ProxyUser = {
  _id: string;
  email: string;
};

export type ProxyUserResponse = {
  status: boolean;
  data: ProxyUser[];
};