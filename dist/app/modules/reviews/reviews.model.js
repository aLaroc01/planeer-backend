"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const financialSchema = new mongoose_1.Schema({
    comment: { type: String, required: true },
    rating: { type: Number, required: true },
    userID: { type: mongoose_1.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, versionKey: false
});
exports.ReviewModel = (0, mongoose_1.model)("reviews", financialSchema);
