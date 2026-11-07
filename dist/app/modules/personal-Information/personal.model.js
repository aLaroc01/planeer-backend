"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalModel = void 0;
const mongoose_1 = require("mongoose");
const personalItemTypes = [
    "valuable",
    "collectible",
    "sentimental",
    "generalInstructions",
];
const personalItemSchema = new mongoose_1.Schema({
    itemType: {
        type: String,
        enum: personalItemTypes,
        required: true,
    },
    name: {
        type: String,
        trim: true,
        default: "",
    },
    description: {
        type: String,
        trim: true,
        default: "",
    },
    location: {
        type: String,
        trim: true,
        default: "",
    },
    estimatedValueCents: {
        type: Number,
        min: 0,
        default: undefined,
        validate: {
            validator: (value) => value == null || Number.isSafeInteger(value),
            message: "Estimated value must be a whole number of cents.",
        },
    },
    wishes: {
        type: String,
        trim: true,
        default: "",
    },
    instructions: {
        type: String,
        trim: true,
        default: "",
    },
}, { timestamps: true });
personalItemSchema.pre("validate", function (next) {
    if (this.itemType !== "generalInstructions" &&
        !this.name?.trim()) {
        return next(new Error("Each personal item requires a name."));
    }
    next();
});
const personalSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: {
        type: [personalItemSchema],
        default: [],
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.PersonalModel = (0, mongoose_1.model)("personal", personalSchema);
