"use strict";
// for mongoose model
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalModel = void 0;
const mongoose_1 = require("mongoose");
const personalSchema = new mongoose_1.Schema({
    personalItems: { type: String, default: "" },
    collectables: { type: String, default: "" },
    personalValues: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },
    sentimentalItems: { type: String, default: "" },
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
exports.PersonalModel = (0, mongoose_1.model)("personal", personalSchema);
