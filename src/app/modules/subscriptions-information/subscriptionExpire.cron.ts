import { Subscription } from "./subscriptions.model";
import * as cron from 'node-cron';
export const startSubscriptionExpireCron = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running subscription expire cron');

        await Subscription.updateMany(
            {
                status: 'active',
                currentPeriodEnd: { $lt: new Date() },
            },
            {
                $set: { status: 'expired' },
            }
        );
    });
};

