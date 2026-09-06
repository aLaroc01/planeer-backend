"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = exports.getStripeMonthlyRevenue = exports.getMonthlyRevenueService = exports.getStripeSalesSummary = exports.checkActiveSubscription = exports.createBillingPortalSession = exports.handlePaymentFailed = exports.handleSubscriptionDeleted = exports.saveSubscriptionToDBFromPaymentLink = exports.saveSubscriptionToDB = exports.createSubscriptionCheckoutSession = exports.syncSubscriptionFromStripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const config_1 = require("../../config");
const user_model_1 = require("../auth/user.model");
const connection_model_1 = __importDefault(require("../connections/connection.model"));
const package_model_1 = require("../package/package.model");
const subscriptions_model_1 = require("./subscriptions.model");
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const dayjs_1 = __importDefault(require("dayjs"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2025-10-29.clover",
});
const TRIAL_DAYS = 14;
const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
    "trialing",
    "active",
]);
const OPEN_SUBSCRIPTION_STATUSES = new Set([
    "trialing",
    "active",
    "past_due",
    "incomplete",
    "unpaid",
    "paused",
]);
const toDate = (unixSeconds) => unixSeconds ? new Date(unixSeconds * 1000) : null;
const asCustomerId = (customer) => {
    if (!customer)
        return null;
    return typeof customer === "string" ? customer : customer.id;
};
const getSubscriptionUserId = (subscription) => {
    const userId = subscription.metadata?.userId;
    if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Stripe subscription is missing a valid user ID.");
    }
    return userId;
};
const getPackageId = (subscription) => {
    const packageId = subscription.metadata?.packageId;
    if (!packageId || !mongoose_1.Types.ObjectId.isValid(packageId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Stripe subscription is missing a valid package ID.");
    }
    return packageId;
};
const getStripePriceId = (subscription) => {
    const item = subscription.items.data[0];
    if (!item?.price?.id) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Stripe subscription does not contain a price.");
    }
    return item.price.id;
};
const getPriceAmount = (subscription) => {
    const item = subscription.items.data[0];
    return (item?.price?.unit_amount ?? 0) / 100;
};
const getCurrency = (subscription) => {
    const item = subscription.items.data[0];
    return item?.price?.currency?.toLowerCase() ?? "usd";
};
const syncSubscriptionFromStripe = async (stripeSubscription) => {
    const userId = getSubscriptionUserId(stripeSubscription);
    const packageId = getPackageId(stripeSubscription);
    const stripeCustomerId = asCustomerId(stripeSubscription.customer);
    if (!stripeCustomerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Stripe subscription is missing a customer ID.");
    }
    const status = stripeSubscription.status;
    const subscriptionData = {
        stripeCustomerId,
        stripePriceId: getStripePriceId(stripeSubscription),
        priceAmount: getPriceAmount(stripeSubscription),
        currency: getCurrency(stripeSubscription),
        userId: new mongoose_1.Types.ObjectId(userId),
        package: new mongoose_1.Types.ObjectId(packageId),
        status,
        trialStart: toDate(stripeSubscription.trial_start),
        trialEnd: toDate(stripeSubscription.trial_end),
        currentPeriodStart: toDate(stripeSubscription.items.data[0]?.current_period_start),
        currentPeriodEnd: toDate(stripeSubscription.items.data[0]?.current_period_end),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: toDate(stripeSubscription.canceled_at),
        endedAt: toDate(stripeSubscription.ended_at),
    };
    const dbSubscription = await subscriptions_model_1.Subscription.findOneAndUpdate({ stripeSubscriptionId: stripeSubscription.id }, {
        $set: subscriptionData,
        $setOnInsert: {
            stripeSubscriptionId: stripeSubscription.id,
        },
    }, {
        upsert: true,
        new: true,
        runValidators: true,
    });
    const hasEntitledSubscription = await subscriptions_model_1.Subscription.exists({
        userId: new mongoose_1.Types.ObjectId(userId),
        status: { $in: [...ENTITLED_SUBSCRIPTION_STATUSES] },
    });
    const userUpdate = {
        stripeCustomerId,
        isSubscribed: Boolean(hasEntitledSubscription),
    };
    // A user consumes the free trial once Stripe creates a trialing subscription.
    // This is intentionally never reset if they later cancel.
    if (status === "trialing") {
        userUpdate.hasUsedFreeTrial = true;
        userUpdate.freeTrialUsedAt = new Date();
    }
    await user_model_1.User.findByIdAndUpdate(userId, {
        $set: userUpdate,
    });
    return dbSubscription;
};
exports.syncSubscriptionFromStripe = syncSubscriptionFromStripe;
const createSubscriptionCheckoutSession = async (userId, packageId) => {
    if (!mongoose_1.Types.ObjectId.isValid(userId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid user ID");
    }
    if (!mongoose_1.Types.ObjectId.isValid(packageId)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid package ID");
    }
    const [user, packageDoc] = await Promise.all([
        user_model_1.User.findById(userId).select("+stripeCustomerId +hasUsedFreeTrial +freeTrialUsedAt"),
        package_model_1.Package.findOne({
            _id: packageId,
            status: "active",
        }),
    ]);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (!packageDoc?.priceId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Package not found or Stripe Price ID is missing");
    }
    const openSubscription = await subscriptions_model_1.Subscription.findOne({
        userId: user._id,
        status: { $in: [...OPEN_SUBSCRIPTION_STATUSES] },
    }).sort({ createdAt: -1 });
    if (openSubscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.CONFLICT, "You already have an open subscription. Use Billing to manage it.");
    }
    const isActiveProxy = await connection_model_1.default.exists({
        proxyUserId: user._id,
        status: "active",
    });
    const canStartTrial = !user.hasUsedFreeTrial && !isActiveProxy;
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
                userId: String(user._id),
            },
        });
        stripeCustomerId = customer.id;
        await user_model_1.User.findByIdAndUpdate(user._id, {
            $set: { stripeCustomerId },
        });
    }
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        client_reference_id: String(user._id),
        line_items: [
            {
                price: String(packageDoc.priceId),
                quantity: 1,
            },
        ],
        metadata: {
            userId: String(user._id),
            packageId: String(packageDoc._id),
        },
        subscription_data: {
            metadata: {
                userId: String(user._id),
                packageId: String(packageDoc._id),
            },
            ...(canStartTrial ? { trial_period_days: TRIAL_DAYS } : {}),
        },
        success_url: `${config_1.config.frontend_url}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config_1.config.frontend_url}/subscriptions/cancel`,
    });
    if (!session.url) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "Stripe did not return a checkout URL.");
    }
    return {
        url: session.url,
        sessionId: session.id,
        trialApplied: canStartTrial,
    };
};
exports.createSubscriptionCheckoutSession = createSubscriptionCheckoutSession;
const saveSubscriptionToDB = async (sessionId) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.mode !== "subscription") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "This Checkout Session is not a subscription session.");
    }
    if (session.payment_status === "unpaid") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment has not completed.");
    }
    if (!session.subscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Stripe has not created the subscription yet.");
    }
    const stripeSubscription = typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
    return (0, exports.syncSubscriptionFromStripe)(stripeSubscription);
};
exports.saveSubscriptionToDB = saveSubscriptionToDB;
const saveSubscriptionToDBFromPaymentLink = async (session) => {
    if (session.mode !== "subscription" || !session.subscription) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "The Checkout Session has no subscription.");
    }
    if (session.payment_status === "unpaid") {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Payment has not completed.");
    }
    const stripeSubscription = typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
    return (0, exports.syncSubscriptionFromStripe)(stripeSubscription);
};
exports.saveSubscriptionToDBFromPaymentLink = saveSubscriptionToDBFromPaymentLink;
const handleSubscriptionDeleted = async (stripeSubscription) => {
    const subscription = await (0, exports.syncSubscriptionFromStripe)(stripeSubscription);
    return {
        success: true,
        message: "Subscription cancellation synchronized.",
        data: {
            subscriptionId: subscription.stripeSubscriptionId,
            userId: subscription.userId,
        },
        statusCode: http_status_codes_1.StatusCodes.OK,
    };
};
exports.handleSubscriptionDeleted = handleSubscriptionDeleted;
const handlePaymentFailed = async (invoice) => {
    const subscriptionId = invoice.parent?.subscription_details?.subscription;
    if (!subscriptionId) {
        return {
            success: false,
            message: "Invoice does not belong to a subscription.",
            data: null,
            statusCode: http_status_codes_1.StatusCodes.OK,
        };
    }
    const stripeSubscription = typeof subscriptionId === "string"
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : subscriptionId;
    const subscription = await (0, exports.syncSubscriptionFromStripe)(stripeSubscription);
    return {
        success: true,
        message: "Subscription payment status synchronized.",
        data: {
            subscriptionId: subscription.stripeSubscriptionId,
            userId: subscription.userId,
            status: subscription.status,
        },
        statusCode: http_status_codes_1.StatusCodes.OK,
    };
};
exports.handlePaymentFailed = handlePaymentFailed;
const createBillingPortalSession = async (userId) => {
    const user = await user_model_1.User.findById(userId).select("+stripeCustomerId");
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    if (!user.stripeCustomerId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No Stripe billing account was found for this user.");
    }
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${config_1.config.frontend_url}/account`,
    });
    return {
        url: portalSession.url,
    };
};
exports.createBillingPortalSession = createBillingPortalSession;
// Admin stuff
const subscriptionsFromDB = async (query) => {
    const { searchTerm, limit, page, paymentType } = query;
    const conditions = [];
    if (typeof searchTerm === "string" && searchTerm.trim()) {
        const term = searchTerm.trim();
        const matchingPackageIds = await package_model_1.Package.find({
            $or: [
                { title: { $regex: term, $options: "i" } },
                { paymentType: { $regex: term, $options: "i" } },
            ],
        }).distinct("_id");
        const matchingUserIds = await user_model_1.User.find({
            $or: [
                { email: { $regex: term, $options: "i" } },
                { name: { $regex: term, $options: "i" } },
                { company: { $regex: term, $options: "i" } },
                { contact: { $regex: term, $options: "i" } },
            ],
        }).distinct("_id");
        const searchConditions = [];
        if (matchingPackageIds.length > 0) {
            searchConditions.push({ package: { $in: matchingPackageIds } });
        }
        if (matchingUserIds.length > 0) {
            searchConditions.push({ userId: { $in: matchingUserIds } });
        }
        if (searchConditions.length === 0) {
            return {
                data: [],
                meta: {
                    page: Math.max(1, Number(page) || 1),
                    limit: Math.min(100, Math.max(1, Number(limit) || 10)),
                    total: 0,
                    totalPages: 0,
                },
            };
        }
        conditions.push({ $or: searchConditions });
    }
    if (typeof paymentType === "string" && paymentType.trim()) {
        const packageIds = await package_model_1.Package.find({
            paymentType: paymentType.trim(),
        }).distinct("_id");
        if (packageIds.length === 0) {
            return {
                data: [],
                meta: {
                    page: Math.max(1, Number(page) || 1),
                    limit: Math.min(100, Math.max(1, Number(limit) || 10)),
                    total: 0,
                    totalPages: 0,
                },
            };
        }
        conditions.push({ package: { $in: packageIds } });
    }
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const filter = conditions.length ? { $and: conditions } : {};
    const [data, total] = await Promise.all([
        subscriptions_model_1.Subscription.find(filter)
            .populate([
            {
                path: "package",
                select: "title paymentType credit description",
            },
            {
                path: "userId",
                select: "email name linkedIn contact company website",
            },
        ])
            .select("userId package price stripeSubscriptionId currentPeriodStart currentPeriodEnd status createdAt updatedAt")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .lean(),
        subscriptions_model_1.Subscription.countDocuments(filter),
    ]);
    return {
        data,
        meta: {
            page: currentPage,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
};
// /**
//  * Create Stripe checkout session for a subscription package.
//  */
// export const createSubscriptionCheckoutSession = async (
//   userId: string,
//   packageId: string,
// ) => {
//   const packageDoc = await Package.findOne({
//     _id: packageId,
//     status: 'active',
//   });
//   if (!packageDoc) {
//     throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
//   }
//   const user = await User.findById(userId.toString()).select(
//     '+stripeCustomerId',
//   );
//   if (!user) {
//     throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
//   }
//   if (!user.stripeCustomerId) {
//     const customer = await stripe.customers.create({
//       email: user.email,
//     });
//     user.stripeCustomerId = customer.id;
//     await user.save();
//   }
//   const session = await stripe.checkout.sessions.create({
//     mode: 'subscription',
//     customer: String(user.stripeCustomerId),
//     line_items: [{ price: String(packageDoc.priceId), quantity: 1 }],
//     metadata: {
//       userId: String(user._id),
//       subscriptionId: String(packageDoc._id),
//     },
//     success_url: `${config.backend_url}/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.backend_url}/cancel?session_id={CHECKOUT_SESSION_ID}`,
//   });
//   return { url: session.url, sessionId: session.id };
// };
// /**
//  * Upgrade an existing active subscription to a new package.
//  */
// const upgradeSubscriptionToDB = async (
//   userId: string,
//   packageId: string,
// ) => {
//   const activeSubscription = await Subscription.findOne({
//     userId,
//     status: 'active',
//   });
//   if (!activeSubscription || !activeSubscription.subscriptionId) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'No active subscription found to upgrade',
//     );
//   }
//   const packageDoc = await Package.findById(packageId);
//   if (!packageDoc || !packageDoc.priceId) {
//     throw new AppError(
//       StatusCodes.NOT_FOUND,
//       'Package not found or missing Stripe Price ID',
//     );
//   }
//   const user = await User.findById(userId).select('+stripeCustomerId');
//   if (!user || !user.stripeCustomerId) {
//     throw new AppError(
//       StatusCodes.NOT_FOUND,
//       'User or Stripe Customer ID not found',
//     );
//   }
//   const stripeSubscription = await stripe.subscriptions.retrieve(
//     activeSubscription.subscriptionId,
//   );
//   await stripe.subscriptions.update(activeSubscription.subscriptionId, {
//     items: [
//       {
//         id: stripeSubscription.items.data[0].id,
//         price: packageDoc.priceId,
//       },
//     ],
//     proration_behavior: 'create_prorations',
//     metadata: {
//       userId,
//       packageId: packageDoc._id.toString(),
//     },
//   });
//   const portalSession = await stripe.billingPortal.sessions.create({
//     customer: user.stripeCustomerId,
//     return_url: config.frontend_url,
//     flow_data: {
//       type: 'subscription_update',
//       subscription_update: {
//         subscription: activeSubscription.subscriptionId,
//       },
//     },
//   });
//   return {
//     url: portalSession.url,
//   };
// };
// /**
//  * Cancel an active subscription in Stripe and mark it canceled in DB.
//  */
// const cancelSubscriptionToDB = async (userId: string) => {
//   const activeSubscription = await Subscription.findOne({
//     userId,
//     status: 'active',
//   });
//   if (!activeSubscription || !activeSubscription.subscriptionId) {
//     throw new AppError(
//       StatusCodes.NOT_FOUND,
//       'No active subscription found to cancel',
//     );
//   }
//   await stripe.subscriptions.cancel(activeSubscription.subscriptionId);
//   await Subscription.findOneAndUpdate(
//     { userId, status: 'active' },
//     { status: 'canceled' },
//     { new: true },
//   );
//   return { success: true, message: 'Subscription canceled successfully' };
// };
// /**
//  * Save a subscription created via Stripe Checkout to MongoDB.
//  */
// export const saveSubscriptionToDB = async (sessionId: string) => {
//   const session = await stripe.checkout.sessions.retrieve(sessionId);
//   if (!session || session.payment_status !== 'paid') {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'Payment not completed',
//     );
//   }
//   if (!session.subscription) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'Subscription not created yet',
//     );
//   }
//   if (!session.metadata?.userId) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'Stripe metadata missing. Please retry payment.',
//     );
//   }
//   const userId = session.metadata?.userId;
//   if (!userId || !Types.ObjectId.isValid(userId)) {
//     throw new AppError(
//       StatusCodes.UNAUTHORIZED,
//       'User not found',
//     );
//   }
//   const user = await User.findById(userId.toString());
//   if (!user) {
//     throw new AppError(
//       StatusCodes.UNAUTHORIZED,
//       'User not found',
//     );
//   }
//   const stripeSubscriptionRaw =
//     typeof session.subscription === 'string'
//       ? await stripe.subscriptions.retrieve(session.subscription)
//       : session.subscription;
//   const stripeSubscription = stripeSubscriptionRaw as MyStripeSubscription;
//   if (!stripeSubscription.id) {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'Stripe subscription ID missing',
//     );
//   }
//   const existing = await Subscription.findOne({
//     stripeSubscriptionId: stripeSubscription.id,
//   });
//   if (existing) {
//     return existing;
//   }
//   const packageDoc = await Package.findById(
//     session.metadata?.subscriptionId,
//   );
//   if (!packageDoc) {
//     throw new AppError(
//       StatusCodes.NOT_FOUND,
//       'Package not found',
//     );
//   }
//   const durationMap: Record<string, number> = {
//     '1 month': 30,
//     '3 months': 90,
//     '6 months': 180,
//     '1 year': 365,
//   };
//   const remainingDays = durationMap[packageDoc.duration] || 30;
//   const currentPeriodStart = stripeSubscription.current_period_start
//     ? new Date(stripeSubscription.current_period_start * 1000)
//     : new Date();
//   const currentPeriodEnd = stripeSubscription.current_period_end
//     ? new Date(stripeSubscription.current_period_end * 1000)
//     : new Date(
//         currentPeriodStart.getTime() + remainingDays * 86400000,
//       );
//   return await Subscription.create({
//     stripeSubscriptionId: stripeSubscription.id,
//     userId: user._id,
//     package: packageDoc._id,
//     price: packageDoc.price,
//     currentPeriodStart,
//     currentPeriodEnd,
//     remaining: remainingDays,
//     status: 'active',
//     customerId: stripeSubscription.customer,
//   });
// };
// export const isSubscriptionActive = (sub: ISubscription) => {
//   return new Date() < new Date(sub.currentPeriodEnd);
// };
// /**
//  * Cron job for expiring subscriptions.
//  */
// export const startSubscriptionExpireCron = () => {
//   cron.schedule('0 0 * * *', async () => {
//     console.log('Running subscription expire cron');
//     await Subscription.updateMany(
//       { status: 'active', currentPeriodEnd: { $lt: new Date() } },
//       { $set: { status: 'expired' } },
//     );
//   });
// };
// /**
//  * Check whether a given user currently has an active subscription.
//  */
const checkActiveSubscription = async (userId) => {
    const subscription = await subscriptions_model_1.Subscription.findOne({ userId, status: 'active' }, { currentPeriodEnd: 1 }).sort({ currentPeriodEnd: -1 });
    if (!subscription) {
        return false;
    }
    if (!subscription.currentPeriodEnd || new Date() > subscription.currentPeriodEnd) {
        return false;
    }
    return true;
};
exports.checkActiveSubscription = checkActiveSubscription;
// const getMonthlyEarningsStatsFromDB = async (year: number) => {
//   const stats = await Subscription.aggregate([
//     {
//       $match: {
//         status: { $in: ['active', 'expired'] },
//         createdAt: {
//           $gte: new Date(`${year}-01-01`),
//           $lte: new Date(`${year}-12-31`),
//         },
//       },
//     },
//     {
//       $group: {
//         _id: { month: { $month: '$createdAt' } },
//         totalEarnings: { $sum: '$price' },
//         totalSubscriptions: { $sum: 1 },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         month: '$_id.month',
//         totalEarnings: 1,
//         totalSubscriptions: 1,
//       },
//     },
//     {
//       $sort: { month: 1 },
//     },
//   ]);
//   return stats;
// };
// interface MonthlyRevenue {
//   month: string;
//   revenue: number;
// }
const getStripeSalesSummary = async () => {
    let activeSubscriptions = 0;
    let pastDueSubscriptions = 0;
    let trialingSubscriptions = 0;
    for await (const subscription of stripe.subscriptions.list({
        status: "all",
        limit: 100,
    })) {
        if (subscription.status === "active") {
            activeSubscriptions += 1;
        }
        if (subscription.status === "past_due") {
            pastDueSubscriptions += 1;
        }
        if (subscription.status === "trialing") {
            trialingSubscriptions += 1;
        }
    }
    return {
        activeSubscriptions,
        pastDueSubscriptions,
        trialingSubscriptions,
    };
};
exports.getStripeSalesSummary = getStripeSalesSummary;
const getSalesSummary = async () => {
    const now = (0, dayjs_1.default)();
    const currentMonthStart = now.startOf("month").toDate();
    const nextMonthStart = now.add(1, "month").startOf("month").toDate();
    const previousMonthStart = now
        .subtract(1, "month")
        .startOf("month")
        .toDate();
    const billedStatuses = ["active", "past_due"];
    const liveStatuses = ["trialing", "active", "past_due", "unpaid"];
    const [activeSubscriptions, trialingSubscriptions, pastDueSubscriptions, newSubscriptions, canceledSubscriptions, currentMrrResult, previousMrrResult, monthly, planBreakdown,] = await Promise.all([
        subscriptions_model_1.Subscription.countDocuments({ status: "active" }),
        subscriptions_model_1.Subscription.countDocuments({ status: "trialing" }),
        subscriptions_model_1.Subscription.countDocuments({ status: "past_due" }),
        subscriptions_model_1.Subscription.countDocuments({
            createdAt: {
                $gte: currentMonthStart,
                $lt: nextMonthStart,
            },
        }),
        subscriptions_model_1.Subscription.countDocuments({
            status: "canceled",
            canceledAt: {
                $gte: currentMonthStart,
                $lt: nextMonthStart,
            },
        }),
        // MRR excludes free trials. It includes active subscriptions and
        // past-due subscriptions because they are still contracted recurring revenue.
        subscriptions_model_1.Subscription.aggregate([
            {
                $match: {
                    status: { $in: billedStatuses },
                },
            },
            {
                $group: {
                    _id: "$currency",
                    mrr: {
                        $sum: {
                            $ifNull: ["$priceAmount", 0],
                        },
                    },
                },
            },
        ]),
        // This is a historical snapshot approximation. Subscription documents store
        // their current state, so Stripe invoice data is more accurate for true
        // historical MRR and revenue accounting.
        subscriptions_model_1.Subscription.aggregate([
            {
                $match: {
                    status: { $in: billedStatuses },
                    createdAt: {
                        $gte: previousMonthStart,
                        $lt: currentMonthStart,
                    },
                },
            },
            {
                $group: {
                    _id: "$currency",
                    mrr: {
                        $sum: {
                            $ifNull: ["$priceAmount", 0],
                        },
                    },
                },
            },
        ]),
        // New subscription value by subscription creation month—not cash collected.
        subscriptions_model_1.Subscription.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: now.subtract(11, "month").startOf("month").toDate(),
                        $lt: nextMonthStart,
                    },
                    status: { $in: liveStatuses },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        currency: "$currency",
                    },
                    newSubscriptionValue: {
                        $sum: {
                            $ifNull: ["$priceAmount", 0],
                        },
                    },
                    newSubscriptions: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    currency: "$_id.currency",
                    newSubscriptionValue: 1,
                    newSubscriptions: 1,
                },
            },
            { $sort: { year: 1, month: 1, currency: 1 } },
        ]),
        subscriptions_model_1.Subscription.aggregate([
            {
                $match: {
                    status: { $in: billedStatuses },
                },
            },
            {
                $lookup: {
                    from: "packages",
                    localField: "package",
                    foreignField: "_id",
                    as: "packageDetails",
                },
            },
            {
                $unwind: {
                    path: "$packageDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: {
                        packageId: "$package",
                        planName: {
                            $ifNull: ["$packageDetails.title", "Unknown plan"],
                        },
                        currency: "$currency",
                    },
                    activeSubscriptions: { $sum: 1 },
                    mrr: {
                        $sum: {
                            $ifNull: ["$priceAmount", 0],
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    packageId: "$_id.packageId",
                    planName: "$_id.planName",
                    currency: "$_id.currency",
                    activeSubscriptions: 1,
                    mrr: 1,
                },
            },
            { $sort: { mrr: -1 } },
        ]),
    ]);
    const mrrByCurrency = currentMrrResult.map((row) => ({
        currency: row._id,
        amount: row.mrr ?? 0,
    }));
    const previousMrrByCurrency = new Map(previousMrrResult.map((row) => [row._id, row.mrr ?? 0]));
    const mrrChangeByCurrency = mrrByCurrency.map(({ currency, amount }) => {
        const previous = previousMrrByCurrency.get(currency) ?? 0;
        return {
            currency,
            currentMrr: amount,
            previousMrr: previous,
            changePercent: previous > 0
                ? Number((((amount - previous) / previous) * 100).toFixed(1))
                : null,
        };
    });
    const totalCurrentMrr = mrrByCurrency.reduce((total, item) => total + item.amount, 0);
    const subscriberChurnRate = activeSubscriptions + canceledSubscriptions > 0
        ? Number(((canceledSubscriptions /
            (activeSubscriptions + canceledSubscriptions)) *
            100).toFixed(1))
        : 0;
    return {
        // Only use this total if your application bills in one currency.
        mrr: totalCurrentMrr,
        arr: totalCurrentMrr * 12,
        mrrByCurrency,
        mrrChangeByCurrency,
        activeSubscriptions,
        trialingSubscriptions,
        pastDueSubscriptions,
        newSubscriptions,
        canceledSubscriptions,
        subscriberChurnRate,
        monthly,
        planBreakdown,
    };
};
const getMonthlyRevenueService = async () => {
    const now = (0, dayjs_1.default)();
    // const currentYear = now.year();
    const currentYearStart = now.startOf("year").toDate();
    const nextYearStart = now.add(1, "year").startOf("year").toDate();
    const monthlySubscriptionValue = await subscriptions_model_1.Subscription.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: currentYearStart,
                    $lt: nextYearStart,
                },
                status: {
                    $in: ["trialing", "active", "past_due", "unpaid"],
                },
            },
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                    currency: "$currency",
                },
                value: {
                    $sum: {
                        $ifNull: ["$priceAmount", 0],
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                month: "$_id.month",
                currency: "$_id.currency",
                value: 1,
            },
        },
        {
            $sort: {
                month: 1,
                currency: 1,
            },
        },
    ]);
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    return months.map((month, index) => {
        const monthNumber = index + 1;
        const valuesByCurrency = monthlySubscriptionValue
            .filter((row) => row.month === monthNumber)
            .map((row) => ({
            currency: row.currency,
            value: row.value ?? 0,
        }));
        return {
            month,
            valuesByCurrency,
        };
    });
};
exports.getMonthlyRevenueService = getMonthlyRevenueService;
const getStripeMonthlyRevenue = async () => {
    const monthlyRevenue = new Map();
    for (let month = 1; month <= 12; month += 1) {
        monthlyRevenue.set(month, 0);
    }
    for await (const invoice of stripe.invoices.list({
        status: "paid",
        limit: 100,
    })) {
        const paidAt = invoice.status_transitions?.paid_at;
        if (!paidAt)
            continue;
        const month = new Date(paidAt * 1000).getUTCMonth() + 1;
        const revenue = (invoice.amount_paid ?? 0) / 100;
        monthlyRevenue.set(month, (monthlyRevenue.get(month) ?? 0) + revenue);
    }
    return Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
        month,
        revenue,
    }));
};
exports.getStripeMonthlyRevenue = getStripeMonthlyRevenue;
exports.SubscriptionService = {
    getStripeMonthlyRevenue: exports.getStripeMonthlyRevenue,
    getStripeSalesSummary: exports.getStripeSalesSummary,
    subscriptionsFromDB,
    getMonthlyRevenueService: exports.getMonthlyRevenueService,
    getSalesSummary,
    createSubscriptionCheckoutSession: exports.createSubscriptionCheckoutSession,
    saveSubscriptionToDB: exports.saveSubscriptionToDB,
    saveSubscriptionToDBFromPaymentLink: exports.saveSubscriptionToDBFromPaymentLink,
    syncSubscriptionFromStripe: exports.syncSubscriptionFromStripe,
    handleSubscriptionDeleted: exports.handleSubscriptionDeleted,
    handlePaymentFailed: exports.handlePaymentFailed,
    createBillingPortalSession: exports.createBillingPortalSession,
    checkActiveSubscription: exports.checkActiveSubscription,
};
