"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialInfoModel = void 0;
const mongoose_1 = require("mongoose");
const SocialInfoSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    socialMedia: {
        type: String,
        trim: true,
        default: undefined,
    },
    website: {
        type: String,
        trim: true,
        default: undefined,
    },
    streamingService: {
        type: String,
        trim: true,
        default: undefined,
    },
    socialInfoPercentage: { type: Number },
}, { timestamps: true, versionKey: false });
exports.SocialInfoModel = (0, mongoose_1.model)("socialInfo", SocialInfoSchema);
