

import { Model, Types } from 'mongoose';

export type ISubscription = {
     customerId: string;
     stripeStatus?:
     | "incomplete"
     | "incomplete_expired"
     | "trialing"
     | "active"
     | "past_due"
     | "canceled"
     | "unpaid"
     | "paused"
     | null;

     cancelAtPeriodEnd?: boolean;
     paymentCollectionPaused?: boolean;
     trialEnd?: Date | null;
     canceledAt?: Date | null;
     currency?: string;
     price: number;
     userId: Types.ObjectId;
     package: Types.ObjectId;
     trxId?: string; 
     remaining: number;
     subscriptionId: string;
     stripeSubscriptionId: string;
     status: 'expired' | 'active' | 'cancel' | 'deactivated';
     currentPeriodStart: Date;  // <-- Date type
     currentPeriodEnd: Date;    // <-- Date type
};

export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>;