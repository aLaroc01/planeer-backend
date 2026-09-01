import Stripe from 'stripe';
import AppError from '../../../errors/AppError';
import { config } from '../../config';
import stripe from '../../config/stripe';
import { User } from '../auth/user.model';
import { Package } from '../package/package.model';
import { ISubscription } from './subscriptions.interface';
import { Subscription } from './subscriptions.model';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose'; 
import dayjs from 'dayjs';


const subscriptionDetailsFromDB = async (id: string): Promise<{ subscription: ISubscription | {} }> => {
     const subscription = await Subscription.findOne({ userId: id }).populate('package', 'title credit duration').lean();

     if (!subscription) {
          return { subscription: {} }; // Return empty object if no subscription found
     }

     const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

     // Check subscription status and update database accordingly
     if (subscriptionFromStripe?.status !== 'active') {
          await Promise.all([User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
     }

     return { subscription };
};

const companySubscriptionDetailsFromDB = async (id: string): Promise<{ subscription: ISubscription | {} }> => {
     const subscription = await Subscription.findOne({ userId: id }).populate('package', 'title credit').lean();
     if (!subscription) {
          return { subscription: {} }; // Return empty object if no subscription found
     }

     const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

     // Check subscription status and update database accordingly
     if (subscriptionFromStripe?.status !== 'active') {
          await Promise.all([User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
     }

     return { subscription };
};

const subscriptionsFromDB = async (query: Record<string, unknown>): Promise<ISubscription[]> => {
     const conditions: any[] = [];

     const { searchTerm, limit, page, paymentType } = query;

     // Handle search term - search in both package title and user details
     if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
          const trimmedSearchTerm = searchTerm.trim();

          // Find matching packages by title or paymentType
          const matchingPackageIds = await Package.find({
               $or: [{ title: { $regex: trimmedSearchTerm, $options: 'i' } }, { paymentType: { $regex: trimmedSearchTerm, $options: 'i' } }],
          }).distinct('_id');

          // Find matching users by email, name, company, etc.
          const matchingUserIds = await User.find({
               $or: [
                    { email: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { name: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { company: { $regex: trimmedSearchTerm, $options: 'i' } },
                    { contact: { $regex: trimmedSearchTerm, $options: 'i' } },
               ],
          }).distinct('_id');

          // Create search conditions
          const searchConditions = [];

          if (matchingPackageIds.length > 0) {
               searchConditions.push({ package: { $in: matchingPackageIds } });
          }

          if (matchingUserIds.length > 0) {
               searchConditions.push({ userId: { $in: matchingUserIds } });
          }

          // Only add search condition if we found matching packages or users
          if (searchConditions.length > 0) {
               conditions.push({ $or: searchConditions });
          } else {
               // If no matches found, return empty result early
               return {
                    data: [],
                    meta: {
                         page: parseInt(page as string) || 1,
                         total: 0,
                    },
               } as any;
          }
     }

     // Handle payment type filter
     if (paymentType && typeof paymentType === 'string' && paymentType.trim()) {
          const packageIdsWithPaymentType = await Package.find({
               paymentType: paymentType.trim(),
          }).distinct('_id');

          if (packageIdsWithPaymentType.length > 0) {
               conditions.push({ package: { $in: packageIdsWithPaymentType } });
          } else {
               // If no packages match the payment type, return empty result
               return {
                    data: [],
                    meta: {
                         page: parseInt(page as string) || 1,
                         total: 0,
                    },
               } as any;
          }
     }

     // Build final query conditions
     const whereConditions = conditions.length > 0 ? { $and: conditions } : {};

     // Pagination
     const pages = Math.max(1, parseInt(page as string) || 1);
     const size = Math.max(1, Math.min(100, parseInt(limit as string) || 10)); // Limit max size
     const skip = (pages - 1) * size;

     try {
          // Execute query with population
          const result = await Subscription.find(whereConditions)
               .populate([
                    {
                         path: 'package',
                         select: 'title paymentType credit description',
                    },
                    {
                         path: 'userId',
                         select: 'email name linkedIn contact company website',
                    },
               ])
               .select('userId package price trxId currentPeriodStart currentPeriodEnd status createdAt updatedAt')
               .sort({ createdAt: -1 }) // Add sorting by creation date
               .skip(skip)
               .limit(size)
               .lean(); // Use lean() for better performance

          // Get total count for pagination
          const count = await Subscription.countDocuments(whereConditions);

          const data: any = {
               data: result,
               meta: {
                    page: pages,
                    limit: size,
                    total: count,
                    totalPages: Math.ceil(count / size),
               },
          };

          return data;
     } catch (error) {
          console.error('Error fetching subscriptions:', error);
          throw new Error('Failed to fetch subscriptions');
     }
};









export const createSubscriptionCheckoutSession = async (userId: string, packageId: string) => {
   
    const packageDoc = await Package.findOne({ _id: packageId, status: 'active' });
    if (!packageDoc) throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');

    // 2️⃣ Find user                   userId id
    const user = await User.findById(userId.toString()).select('+stripeCustomerId');
   
    if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

    // 3️⃣ Create stripe customer if missing
    if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
    }

    // 4️⃣ Create checkout session
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: String(user.stripeCustomerId),
        line_items: [{ price: String(packageDoc.priceId), quantity: 1 }],
        metadata: {
            userId: String(user._id), // MongoDB ObjectId string
            subscriptionId: String(packageDoc._id),
        },
     //    success_url: `${config.backend_url}/api/v1/success?session_id={CHECKOUT_SESSION_ID}`,
     //    cancel_url: `${config.backend_url}/api/v1/cancel`,

    // ✅ ঠিক করা হলো
     success_url: `${config.backend_url}/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${config.backend_url}/cancel?session_id={CHECKOUT_SESSION_ID}`,
    });

    return { url: session.url, sessionId: session.id };
};












const upgradeSubscriptionToDB = async (userId: string, packageId: string) => {
     const activeSubscription = await Subscription.findOne({
          userId,
          status: 'active',
     });

     if (!activeSubscription || !activeSubscription.subscriptionId) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'No active subscription found to upgrade');
     }

     const packageDoc = await Package.findById(packageId);

     if (!packageDoc || !packageDoc.priceId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found or missing Stripe Price ID');
     }

     const user = await User.findById(userId).select('+stripeCustomerId');

     if (!user || !user.stripeCustomerId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
     }

     const stripeSubscription = await stripe.subscriptions.retrieve(activeSubscription.subscriptionId);
     console.log(stripeSubscription, 'this is stripe subscription existing');

     await stripe.subscriptions.update(activeSubscription.subscriptionId, {
          items: [
               {
                    id: stripeSubscription.items.data[0].id,
                    price: packageDoc.priceId,
               },
          ],
          proration_behavior: 'create_prorations',
          metadata: {
               userId,
               packageId: packageDoc._id.toString(),
          },
     });
     console.log(' thsi is stripe subscription updated');
     const portalSession = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: config.frontend_url,
          flow_data: {
               type: 'subscription_update',
               subscription_update: {
                    subscription: activeSubscription.subscriptionId,
               },
          },
     });

     return {
          url: portalSession.url,
     };
};
const cancelSubscriptionToDB = async (userId: string) => {
     const activeSubscription = await Subscription.findOne({
          userId,
          status: 'active',
     });
     if (!activeSubscription || !activeSubscription.subscriptionId) {
          throw new AppError(StatusCodes.NOT_FOUND, 'No active subscription found to cancel');
     }

     await stripe.subscriptions.cancel(activeSubscription.subscriptionId);

     await Subscription.findOneAndUpdate({ userId, status: 'active' }, { status: 'canceled' }, { new: true });

     return { success: true, message: 'Subscription canceled successfully' };
};
// Extend Stripe Subscription type for timestamps
interface MyStripeSubscription extends Stripe.Subscription {
    current_period_start?: number;
    current_period_end?: number;
}



export const saveSubscriptionToDB = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  


    if (!session || session.payment_status !== 'paid') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Payment not completed');
    }

    if (!session.subscription) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Subscription not created yet');
    }


        // ✅ এখানে বসাও
    if (!session.metadata?.userId) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            'Stripe metadata missing. Please retry payment.'
        );
    }

    const userId = session.metadata?.userId;

    if (!userId || !Types.ObjectId.isValid(userId)) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');
    }
                                   //userId
    const user = await User.findById(userId.toString());
    if (!user) throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');

    const stripeSubscriptionRaw =
        typeof session.subscription === 'string'
            ? await stripe.subscriptions.retrieve(session.subscription)
            : session.subscription;

    const stripeSubscription = stripeSubscriptionRaw as MyStripeSubscription;

    if (!stripeSubscription.id) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Stripe subscription ID missing');
    }

    // ✅ correct duplicate check
    const existing = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id,
    });
    if (existing) return existing;

    const packageDoc = await Package.findById(session.metadata?.subscriptionId);
    if (!packageDoc) throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');

    const durationMap: Record<string, number> = {
        '1 month': 30,
        '3 months': 90,
        '6 months': 180,
        '1 year': 365,
    };
    const remainingDays = durationMap[packageDoc.duration] || 30;

    const currentPeriodStart = stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : new Date();

    const currentPeriodEnd = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : new Date(currentPeriodStart.getTime() + remainingDays * 86400000);

    return await Subscription.create({
        stripeSubscriptionId: stripeSubscription.id,
        userId: user._id,
        package: packageDoc._id,
        price: packageDoc.price,
        currentPeriodStart,
        currentPeriodEnd,
        remaining: remainingDays,
        status: 'active',
        customerId: stripeSubscription.customer,
    });
};



// interface MyStripeSubscription {
//   id: string;
//   customer: string;
//   current_period_start?: number;
//   current_period_end?: number;
//   status: string;
// }

// export const saveSubscriptionToDB = async (sessionId: string) => {
//   const session = await stripe.checkout.sessions.retrieve(sessionId);

//   if (!session || session.payment_status !== 'paid') {
//     throw new AppError(StatusCodes.BAD_REQUEST, 'Payment not completed');
//   }

//   if (!session.subscription) {
//     throw new AppError(StatusCodes.BAD_REQUEST, 'Subscription not created yet');
//   }

//   if (!session.metadata?.userId) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'Stripe metadata missing. Please retry payment.'
//     );
//   }

//   const userId = session.metadata.userId;
//   const user = await User.findById(userId);
//   if (!user) throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');

//   // Cast to MyStripeSubscription
//   const stripeSubscriptionRaw =
//     typeof session.subscription === 'string'
//       ? await stripe.subscriptions.retrieve(session.subscription)
//       : session.subscription;

//   const stripeSubscription = stripeSubscriptionRaw as MyStripeSubscription;

//   const currentPeriodStart = stripeSubscription.current_period_start
//     ? new Date(stripeSubscription.current_period_start * 1000)
//     : new Date();

//   const currentPeriodEnd = stripeSubscription.current_period_end
//     ? new Date(stripeSubscription.current_period_end * 1000)
//     : new Date(currentPeriodStart.getTime() + 30 * 86400000);

//   const subscription = await Subscription.create({
//     stripeSubscriptionId: stripeSubscription.id,
//     userId: user._id,
//     package: session.metadata.subscriptionId,
//     price: 0, // বা session.metadata.price
//     currentPeriodStart,
//     currentPeriodEnd,
//     remaining: 30,
//     status: 'active',
//     customerId: stripeSubscription.customer,
//   });

//   await subscription.populate('package');

//   return subscription;
// };


export const isSubscriptionActive = (sub: ISubscription) => {
    return new Date() < new Date(sub.currentPeriodEnd);
};



// Cron job for expiring subscriptions
import * as cron from 'node-cron';
export const startSubscriptionExpireCron = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running subscription expire cron');
        await Subscription.updateMany(
            { status: 'active', currentPeriodEnd: { $lt: new Date() } },
            { $set: { status: 'expired' } }
        );
    });
};


export const checkActiveSubscription = async (userId: string) => {
    const subscription = await Subscription.findOne({
        userId,
        status: 'active',
    }).sort({ currentPeriodEnd: -1 });

    if (!subscription) return false;

    if (new Date() > subscription.currentPeriodEnd) {
        subscription.status = 'expired';
        await subscription.save();
        return false;
    }

    return true;
};






const getMonthlyEarningsStatsFromDB = async (year: number) => {
     const stats = await Subscription.aggregate([
          {
               $match: {
                    status: { $in: ['active', 'expired'] },
                    createdAt: {
                         $gte: new Date(`${year}-01-01`),
                         $lte: new Date(`${year}-12-31`),
                    },
               },
          },
          {
               $group: {
                    _id: { month: { $month: '$createdAt' } },
                    totalEarnings: { $sum: '$price' },
                    totalSubscriptions: { $sum: 1 },
               },
          },
          {
               $project: {
                    _id: 0,
                    month: '$_id.month',
                    totalEarnings: 1,
                    totalSubscriptions: 1,
               },
          },
          {
               $sort: { month: 1 },
          },
     ]);

     return stats;
};



interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export const getMonthlyRevenueService = async (): Promise<MonthlyRevenue[]> => {
    // get current year
    const currentYear = dayjs().year();

    // Aggregate monthly revenue
    const revenue = await Subscription.aggregate([
        {
            $match: {
                currentPeriodStart: {
                    $gte: new Date(`${currentYear}-01-01`),
                    $lte: new Date(`${currentYear}-12-31`)
                },
                status: "active" // only active subscriptions count
            }
        },
        {
            $group: {
                _id: { $month: "$currentPeriodStart" },
                totalRevenue: { $sum: "$price" }
            }
        }
    ]);

    // Initialize array with 0 revenue for all months
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueData: MonthlyRevenue[] = months.map((m, i) => {
        const monthData = revenue.find(r => r._id === i + 1);
        return { month: m, revenue: monthData ? monthData.totalRevenue : 0 };
    });

    return revenueData;
};



/**
 * Handle subscription deleted from Stripe
 */
export const handleSubscriptionDeleted = async (sub: Stripe.Subscription) => {
  const dbSub = await Subscription.findOne({ stripeSubscriptionId: sub.id });
  if (!dbSub) {
    return {
      success: false,
      message: "Subscription record not found",
      data: null,
      statusCode: 200,
    };
  }

  await Subscription.findOneAndUpdate(
    { stripeSubscriptionId: sub.id },
    { status: "expired" }
  );

  await User.findByIdAndUpdate(dbSub.userId, {
    $set: { stripeCustomerId: null, isSubscribed: false },
  });

  return {
    success: true,
    message: "Subscription expired and user updated successfully",
    data: { subscriptionId: sub.id, userId: dbSub.userId },
    statusCode: 200,
  };
};

/**
 * Handle payment failed from Stripe
 */
export const handlePaymentFailed = async (invoice: Stripe.Invoice) => {
   // as any ব্যবহার করে TS কে বলছি: আমি নিজে জানি invoice.subscription আছে
  const subId = (invoice as any).subscription as string | undefined;
  if (!subId) {
    return {
      success: false,
      message: "No subscription found in invoice",
      data: null,
      statusCode: 200,
    };
  }

  const dbSub = await Subscription.findOne({ stripeSubscriptionId: subId });
  if (!dbSub) {
    return {
      success: false,
      message: "No subscription record found for this invoice",
      data: null,
      statusCode: 200,
    };
  }

  await User.findByIdAndUpdate(dbSub.userId, {
    $set: { stripeCustomerId: null, isSubscribed: false },
  });

  return {
    success: true,
    message: "Payment failed: user updated successfully",
    data: { subscriptionId: subId, userId: dbSub.userId },
    statusCode: 200,
  };
};


export const SubscriptionService = {
     subscriptionDetailsFromDB,
     subscriptionsFromDB,
     companySubscriptionDetailsFromDB,
     createSubscriptionCheckoutSession,
     upgradeSubscriptionToDB,
     cancelSubscriptionToDB,
     getMonthlyRevenueService,
     // successMessage,
     saveSubscriptionToDB,
     getMonthlyEarningsStatsFromDB,
    
};
