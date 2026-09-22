"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalInfoModel = void 0;
const mongoose_1 = require("mongoose");
const DigitalInfoSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    digitalMedia: {
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
    digitalInfoPercentage: { type: Number },
}, { timestamps: true, versionKey: false });
exports.DigitalInfoModel = (0, mongoose_1.model)("digitalInfo", DigitalInfoSchema);
