"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const user_interface_1 = require("./user.interface");
const userSchema = new mongoose_1.Schema({
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
        unique: true, // Ensures email is unique
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
    otp: { type: String },
    imgUrl: {
        type: String,
        default: 'https://i.ibb.co/z5YHLV9/profile.png',
    },
    proxysetId: [{ type: mongoose_1.Types.ObjectId, ref: "User" }],
    stripeCustomerId: {
        type: String,
        default: '',
    },
    userPercentage: { type: Number },
    role: {
        type: String,
        enum: Object.values(user_interface_1.Role),
        default: user_interface_1.Role.USER
    },
}, {
    timestamps: true, versionKey: false
});
exports.User = (0, mongoose_1.model)("User", userSchema);
