"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = exports.stripeWebhookHandler = exports.getMonthlyRevenueController = exports.checkoutSuccessController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const subscriptions_service_1 = require("./subscriptions.service");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("stripe"));
const subscriptions = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subscriptions_service_1.SubscriptionService.subscriptionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription list retrieved successfully',
        data: result,
    });
});
const subscriptionDetails = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.user;
    const result = await subscriptions_service_1.SubscriptionService.subscriptionDetailsFromDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Subscription details retrieved successfully',
        data: result.subscription,
    });
});
const cancelSubscription = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.user;
    const result = await subscriptions_service_1.SubscriptionService.cancelSubscriptionToDB(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Cancel subscription successfully',
        data: result,
    });
});
// create checkout session
// const createCheckoutSession = catchAsync(async (req, res) => {
//      const { id }: any = req.user;
//      const packageId = req.params.id;
//      const result = await SubscriptionService.createSubscriptionCheckoutSession(id, packageId);
//      sendResponse(res, {
//           statusCode: StatusCodes.OK,
//           success: true,
//           message: 'Create checkout session successfully',
//           data: {
//                sessionId: result.sessionId,
//                url: result.url,
//           },
//      });
// });
const createCheckoutSession = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.user;
    // ✅ convert string | string[] to string
    const packageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await subscriptions_service_1.SubscriptionService.createSubscriptionCheckoutSession(String(id), packageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Create checkout session successfully',
        data: {
            sessionId: result.sessionId,
            url: result.url,
        },
    });
});
// update subscriptions
const updateSubscription = (0, catchAsync_1.default)(async (req, res) => {
    // ✅ logged in user id কে string বানানো
    const userId = Array.isArray(req.user?.id) ? req.user.id[0] : req.user?.id || "";
    if (!userId)
        throw new Error("Invalid user ID");
    // ✅ package id কে string বানানো
    const packageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!packageId)
        throw new Error("Invalid package ID");
    const result = await subscriptions_service_1.SubscriptionService.upgradeSubscriptionToDB(userId, packageId);
    // const { id }: any = req.user;
    // const packageId = req.params.id;
    // const result = await SubscriptionService.upgradeSubscriptionToDB(id, packageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Update checkout session successfully',
        data: {
            url: result.url,
        },
    });
});
const orderCancel = (0, catchAsync_1.default)(async (req, res) => {
    const sessionId = req.query.session_id || 'N/A';
    res.render('cancel', { sessionId }); // ✅ sessionId pass করো
});
// Controller for Stripe checkout success
exports.checkoutSuccessController = (0, catchAsync_1.default)(async (req, res) => {
    const sessionId = req.query.session_id;
    //     const userId = req.user?.id;
    if (!sessionId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Session ID is required');
    }
    //     if (!userId) {
    //         throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');
    //     }
    // Save subscription in DB   userId
    const subscription = await (0, subscriptions_service_1.saveSubscriptionToDB)(sessionId);
    // Send response
    //     sendResponse(res, {
    //         statusCode: StatusCodes.OK,
    //         success: true,
    //         message: 'Subscription created successfully',
    //         data: subscription,
    //     });
    // 
    res.render('subscription-success', { subscription });
});
const monthlyEarningsStats = (0, catchAsync_1.default)(async (req, res) => {
    const year = Number(req.query.year) || new Date().getFullYear();
    const result = await subscriptions_service_1.SubscriptionService.getMonthlyEarningsStatsFromDB(year);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Monthly earnings stats retrieved successfully',
        data: result,
    });
});
exports.getMonthlyRevenueController = (0, catchAsync_1.default)(async (req, res) => {
    const revenueData = await (0, subscriptions_service_1.getMonthlyRevenueService)();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Monthly revenue fetched successfully",
        data: revenueData,
    });
});
exports.stripeWebhookHandler = (0, catchAsync_1.default)(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Missing Stripe signature",
            data: null,
        });
    }
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err);
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            success: false,
            message: "Webhook signature verification failed",
            data: null,
        });
    }
    try {
        let responseData;
        switch (event.type) {
            case "customer.subscription.deleted":
                responseData = await (0, subscriptions_service_1.handleSubscriptionDeleted)(event.data.object);
                break;
            case "invoice.payment_failed":
                responseData = await (0, subscriptions_service_1.handlePaymentFailed)(event.data.object);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
                responseData = {
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    success: true,
                    message: `Unhandled event type ${event.type}`,
                    data: null,
                };
        }
        return (0, sendResponse_1.default)(res, responseData);
    }
    catch (err) {
        console.error("Webhook handler error:", err);
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: err.message || "Internal Server Error",
            data: null,
        });
    }
});
exports.SubscriptionController = {
    subscriptions,
    subscriptionDetails,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
    getMonthlyRevenueController: exports.getMonthlyRevenueController,
    // orderSuccess,
    orderCancel,
    monthlyEarningsStats,
};
