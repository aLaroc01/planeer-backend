"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialModel = void 0;
const mongoose_1 = require("mongoose");
const financialItemTypes = [
    "account",
    "retirementAccount",
    "asset",
    "debt",
];
const financialItemSchema = new mongoose_1.Schema({
    itemType: {
        type: String,
        enum: financialItemTypes,
        required: true,
    },
    details: {
        type: String,
        trim: true,
        default: "",
    },
    institution: {
        type: String,
        trim: true,
        default: "",
    },
    accountType: {
        type: String,
        trim: true,
        default: "",
    },
    assetType: {
        type: String,
        trim: true,
        default: "",
    },
    debtType: {
        type: String,
        trim: true,
        default: "",
    },
    amountCents: {
        type: Number,
        min: 0,
        default: undefined,
        validate: {
            validator: (value) => value == null || Number.isSafeInteger(value),
            message: "Amount must be a whole number of cents.",
        },
    },
}, { timestamps: true });
const financialSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: {
        type: [financialItemSchema],
        default: [],
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.FinancialModel = (0, mongoose_1.model)("financial", financialSchema);
