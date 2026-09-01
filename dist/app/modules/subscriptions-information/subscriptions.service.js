"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = exports.handlePaymentFailed = exports.handleSubscriptionDeleted = exports.getMonthlyRevenueService = exports.checkActiveSubscription = exports.startSubscriptionExpireCron = exports.isSubscriptionActive = exports.saveSubscriptionToDB = exports.createSubscriptionCheckoutSession = void 0;
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const config_1 = require("../../config");
const stripe_1 = __importDefault(require("../../config/stripe"));
const user_model_1 = require("../auth/user.model");
const package_model_1 = require("../package/package.model");
const subscriptions_model_1 = require("./subscriptions.model");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const dayjs_1 = __importDefault(require("dayjs"));
const subscriptionDetailsFromDB = async (id) => {
    const subscription = await subscriptions_model_1.Subscription.findOne({ userId: id }).populate('package', 'title credit duration').lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }
    const subscriptionFromStripe = await stripe_1.default.subscriptions.retrieve(subscription.subscriptionId);
    // Check subscription status and update database accordingly
    if (subscriptionFromStripe?.status !== 'active') {
        await Promise.all([user_model_1.User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), subscriptions_model_1.Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
    }
    return { subscription };
};
const companySubscriptionDetailsFromDB = async (id) => {
    const subscription = await subscriptions_model_1.Subscription.findOne({ userId: id }).populate('package', 'title credit').lean();
    if (!subscription) {
        return { subscription: {} }; // Return empty object if no subscription found
    }
    const subscriptionFromStripe = await stripe_1.default.subscriptions.retrieve(subscription.subscriptionId);
    // Check subscription status and update database accordingly
    if (subscriptionFromStripe?.status !== 'active') {
        await Promise.all([user_model_1.User.findByIdAndUpdate(id, { isSubscribed: false }, { new: true }), subscriptions_model_1.Subscription.findOneAndUpdate({ user: id }, { status: 'expired' }, { new: true })]);
    }
    return { subscription };
};
const subscriptionsFromDB = async (query) => {
    const conditions = [];
    const { searchTerm, limit, page, paymentType } = query;
    // Handle search term - search in both package title and user details
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
        const trimmedSearchTerm = searchTerm.trim();
        // Find matching packages by title or paymentType
        const matchingPackageIds = await package_model_1.Package.find({
            $or: [{ title: { $regex: trimmedSearchTerm, $options: 'i' } }, { paymentType: { $regex: trimmedSearchTerm, $options: 'i' } }],
        }).distinct('_id');
        // Find matching users by email, name, company, etc.
        const matchingUserIds = await user_model_1.User.find({
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
        }
        else {
            // If no matches found, return empty result early
            return {
                data: [],
                meta: {
                    page: parseInt(page) || 1,
                    total: 0,
                },
            };
        }
    }
    // Handle payment type filter
    if (paymentType && typeof paymentType === 'string' && paymentType.trim()) {
        const packageIdsWithPaymentType = await package_model_1.Package.find({
            paymentType: paymentType.trim(),
        }).distinct('_id');
        if (packageIdsWithPaymentType.length > 0) {
            conditions.push({ package: { $in: packageIdsWithPaymentType } });
        }
        else {
            // If no packages match the payment type, return empty result
            return {
                data: [],
                meta: {
                    page: parseInt(page) || 1,
                    total: 0,
                },
            };
        }
    }
    // Build final query conditions
    const whereConditions = conditions.length > 0 ? { $and: conditions } : {};
    // Pagination
    const pages = Math.max(1, parseInt(page) || 1);
    const size = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Limit max size
    const skip = (pages - 1) * size;
    try {
        // Execute query with population
        const result = await subscriptions_model_1.Subscription.find(whereConditions)
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
        const count = await subscriptions_model_1.Subscription.countDocuments(whereConditions);
        const data = {
            data: result,
            meta: {
                page: pages,
                limit: size,
                total: count,
                totalPages: Math.ceil(count / size),
            },
        };
        return data;
    }
    catch (error) {
        console.error('Error fetching subscriptions:', error);
        throw new Error('Failed to fetch subscriptions');
    }
};
const createSubscriptionCheckoutSession = async (userId, packageId) => {
    const packageDoc = await package_model_1.Package.findOne({ _id: packageId, status: 'active' });
    if (!packageDoc)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    // 2️⃣ Find user                   userId id
    const user = await user_model_1.User.findById(userId.toString()).select('+stripeCustomerId');
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    // 3️⃣ Create stripe customer if missing
    if (!user.stripeCustomerId) {
        const customer = await stripe_1.default.customers.create({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
    }
    // 4️⃣ Create checkout session
    const session = await stripe_1.default.checkout.sessions.create({
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
        success_url: `${config_1.config.backend_url}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config_1.config.backend_url}/cancel?session_id={CHECKOUT_SESSION_ID}`,
    });
    return { url: session.url, sessionId: session.id };
};
exports.createSubscriptionCheckoutSession = createSubscriptionCheckoutSession;
const upgradeSubscriptionToDB = async (userId, packageId) => {
    const activeSubscription = await subscriptions_model_1.Subscription.findOne({
        userId,
        status: 'active',
    });
    if (!activeSubscription || !activeSubscription.subscriptionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'No active subscription found to upgrade');
    }
    const packageDoc = await package_model_1.Package.findById(packageId);
    if (!packageDoc || !packageDoc.priceId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found or missing Stripe Price ID');
    }
    const user = await user_model_1.User.findById(userId).select('+stripeCustomerId');
    if (!user || !user.stripeCustomerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User or Stripe Customer ID not found');
    }
    const stripeSubscription = await stripe_1.default.subscriptions.retrieve(activeSubscription.subscriptionId);
    console.log(stripeSubscription, 'this is stripe subscription existing');
    await stripe_1.default.subscriptions.update(activeSubscription.subscriptionId, {
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
    const portalSession = await stripe_1.default.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: config_1.config.frontend_url,
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
const cancelSubscriptionToDB = async (userId) => {
    const activeSubscription = await subscriptions_model_1.Subscription.findOne({
        userId,
        status: 'active',
    });
    if (!activeSubscription || !activeSubscription.subscriptionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No active subscription found to cancel');
    }
    await stripe_1.default.subscriptions.cancel(activeSubscription.subscriptionId);
    await subscriptions_model_1.Subscription.findOneAndUpdate({ userId, status: 'active' }, { status: 'canceled' }, { new: true });
    return { success: true, message: 'Subscription canceled successfully' };
};
const saveSubscriptionToDB = async (sessionId) => {
    const session = await stripe_1.default.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Payment not completed');
    }
    if (!session.subscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Subscription not created yet');
    }
    // ✅ এখানে বসাও
    if (!session.metadata?.userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Stripe metadata missing. Please retry payment.');
    }
    const userId = session.metadata?.userId;
    if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not found');
    }
    //userId
    const user = await user_model_1.User.findById(userId.toString());
    if (!user)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not found');
    const stripeSubscriptionRaw = typeof session.subscription === 'string'
        ? await stripe_1.default.subscriptions.retrieve(session.subscription)
        : session.subscription;
    const stripeSubscription = stripeSubscriptionRaw;
    if (!stripeSubscription.id) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Stripe subscription ID missing');
    }
    // ✅ correct duplicate check
    const existing = await subscriptions_model_1.Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id,
    });
    if (existing)
        return existing;
    const packageDoc = await package_model_1.Package.findById(session.metadata?.subscriptionId);
    if (!packageDoc)
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    const durationMap = {
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
    return await subscriptions_model_1.Subscription.create({
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
exports.saveSubscriptionToDB = saveSubscriptionToDB;
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
const isSubscriptionActive = (sub) => {
    return new Date() < new Date(sub.currentPeriodEnd);
};
exports.isSubscriptionActive = isSubscriptionActive;
// Cron job for expiring subscriptions
const cron = __importStar(require("node-cron"));
const startSubscriptionExpireCron = () => {
    cron.schedule('0 0 * * *', async () => {
        console.log('Running subscription expire cron');
        await subscriptions_model_1.Subscription.updateMany({ status: 'active', currentPeriodEnd: { $lt: new Date() } }, { $set: { status: 'expired' } });
    });
};
exports.startSubscriptionExpireCron = startSubscriptionExpireCron;
const checkActiveSubscription = async (userId) => {
    const subscription = await subscriptions_model_1.Subscription.findOne({
        userId,
        status: 'active',
    }).sort({ currentPeriodEnd: -1 });
    if (!subscription)
        return false;
    if (new Date() > subscription.currentPeriodEnd) {
        subscription.status = 'expired';
        await subscription.save();
        return false;
    }
    return true;
};
exports.checkActiveSubscription = checkActiveSubscription;
const getMonthlyEarningsStatsFromDB = async (year) => {
    const stats = await subscriptions_model_1.Subscription.aggregate([
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
const getMonthlyRevenueService = async () => {
    // get current year
    const currentYear = (0, dayjs_1.default)().year();
    // Aggregate monthly revenue
    const revenue = await subscriptions_model_1.Subscription.aggregate([
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
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueData = months.map((m, i) => {
        const monthData = revenue.find(r => r._id === i + 1);
        return { month: m, revenue: monthData ? monthData.totalRevenue : 0 };
    });
    return revenueData;
};
exports.getMonthlyRevenueService = getMonthlyRevenueService;
/**
 * Handle subscription deleted from Stripe
 */
const handleSubscriptionDeleted = async (sub) => {
    const dbSub = await subscriptions_model_1.Subscription.findOne({ stripeSubscriptionId: sub.id });
    if (!dbSub) {
        return {
            success: false,
            message: "Subscription record not found",
            data: null,
            statusCode: 200,
        };
    }
    await subscriptions_model_1.Subscription.findOneAndUpdate({ stripeSubscriptionId: sub.id }, { status: "expired" });
    await user_model_1.User.findByIdAndUpdate(dbSub.userId, {
        $set: { stripeCustomerId: null, isSubscribed: false },
    });
    return {
        success: true,
        message: "Subscription expired and user updated successfully",
        data: { subscriptionId: sub.id, userId: dbSub.userId },
        statusCode: 200,
    };
};
exports.handleSubscriptionDeleted = handleSubscriptionDeleted;
/**
 * Handle payment failed from Stripe
 */
const handlePaymentFailed = async (invoice) => {
    // as any ব্যবহার করে TS কে বলছি: আমি নিজে জানি invoice.subscription আছে
    const subId = invoice.subscription;
    if (!subId) {
        return {
            success: false,
            message: "No subscription found in invoice",
            data: null,
            statusCode: 200,
        };
    }
    const dbSub = await subscriptions_model_1.Subscription.findOne({ stripeSubscriptionId: subId });
    if (!dbSub) {
        return {
            success: false,
            message: "No subscription record found for this invoice",
            data: null,
            statusCode: 200,
        };
    }
    await user_model_1.User.findByIdAndUpdate(dbSub.userId, {
        $set: { stripeCustomerId: null, isSubscribed: false },
    });
    return {
        success: true,
        message: "Payment failed: user updated successfully",
        data: { subscriptionId: subId, userId: dbSub.userId },
        statusCode: 200,
    };
};
exports.handlePaymentFailed = handlePaymentFailed;
exports.SubscriptionService = {
    subscriptionDetailsFromDB,
    subscriptionsFromDB,
    companySubscriptionDetailsFromDB,
    createSubscriptionCheckoutSession: exports.createSubscriptionCheckoutSession,
    upgradeSubscriptionToDB,
    cancelSubscriptionToDB,
    getMonthlyRevenueService: exports.getMonthlyRevenueService,
    // successMessage,
    saveSubscriptionToDB: exports.saveSubscriptionToDB,
    getMonthlyEarningsStatsFromDB,
};
