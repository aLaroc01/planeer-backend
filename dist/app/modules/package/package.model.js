"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const mongoose_1 = require("mongoose");
const packageSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    priceId: {
        type: String,
        required: true,
    },
    duration: {
        type: String,
        enum: ['1 month', '3 months', '6 months', '1 year'],
        required: true,
    },
    paymentType: {
        type: String,
        enum: ['Monthly', 'Yearly'],
        required: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
exports.Package = (0, mongoose_1.model)('Package', packageSchema);
