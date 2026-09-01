

import { model, Schema } from 'mongoose';
import { ISubscription, SubscriptionModel } from './subscriptions.interface';

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>({
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
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    package: {
        type: Schema.Types.ObjectId,
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

export const Subscription = model<ISubscription, SubscriptionModel>(
    'Subscription',
    subscriptionSchema
);