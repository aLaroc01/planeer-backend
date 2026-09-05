"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = require("mongoose");
const subscriptionSchema = new mongoose_1.Schema({
    stripeSubscriptionId: {
        type: String,
        required: true,
        unique: true,
    },
    customerId: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    package: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Package',
        required: true,
    },
    currentPeriodStart: {
        type: Date,
        required: true,
    },
    currentPeriodEnd: {
        type: Date,
        required: true,
    },
    remaining: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['expired', 'active', 'cancel', 'deactivated'],
        default: 'active',
        required: true,
    },
}, {
    timestamps: true,
});
exports.Subscription = (0, mongoose_1.model)('Subscription', subscriptionSchema);
