"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileModel = void 0;
// for mongoose model
const mongoose_1 = require("mongoose");
const profileSchema = new mongoose_1.Schema({
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipcode: { type: String, default: "" },
    imgUrl: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
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
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
profileSchema.index({ userID: 1 }, { unique: true });
exports.ProfileModel = (0, mongoose_1.model)("profile", profileSchema);
