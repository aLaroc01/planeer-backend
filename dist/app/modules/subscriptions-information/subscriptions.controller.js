"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = exports.stripeWebhookHandler = exports.getStripeSalesSummaryController = exports.getSalesSummaryController = exports.getMonthlyRevenueController = exports.getStripeMonthlyRevenueController = exports.checkoutSuccessController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const subscriptions_service_1 = require("./subscriptions.service");
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("stripe"));
// import stripe from '../../config/stripe';
const subscriptions = (0, catchAsync_1.default)(async (req, res) => {
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.NOT_IMPLEMENTED,
        success: false,
        message: 'Subscription list retrieval is not implemented',
        data: null,
    });
});
const subscriptionDetails = (0, catchAsync_1.default)(async (req, res) => {
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.NOT_IMPLEMENTED,
        success: false,
        message: 'Subscription details retrieval is not implemented',
        data: null,
    });
});
const cancelSubscription = (0, catchAsync_1.default)(async (req, res) => {
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.NOT_IMPLEMENTED,
        success: false,
        message: 'Cancel subscription is not implemented',
        data: null,
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
    const { packageId } = req.body;
    if (!packageId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Package ID is required");
    }
    const result = await subscriptions_service_1.SubscriptionService.createSubscriptionCheckoutSession(String(id), String(packageId));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Create checkout session successfully",
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
    // Use existing service method to create/upgrade a checkout session
    const result = await subscriptions_service_1.SubscriptionService.createSubscriptionCheckoutSession(userId, packageId);
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
//  const monthlyEarningsStats = catchAsync(async (req, res) => {
//           const year = Number(req.query.year) || new Date().getFullYear();
//           const result =
//                await SubscriptionService.getMonthlyEarningsStatsFromDB(year);
//           sendResponse(res, {
//                statusCode: StatusCodes.OK,
//                success: true,
//                message: 'Monthly earnings stats retrieved successfully',
//                data: result,
//           });
//      }
// );
exports.getStripeMonthlyRevenueController = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await subscriptions_service_1.SubscriptionService.getStripeMonthlyRevenue();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Stripe monthly revenue retrieved successfully",
        data: result,
    });
});
exports.getMonthlyRevenueController = (0, catchAsync_1.default)(async (_req, res) => {
    const revenueData = await (0, subscriptions_service_1.getMonthlyRevenueService)();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Monthly revenue fetched successfully",
        data: revenueData,
    });
});
const createBillingPortalSession = (0, catchAsync_1.default)(async (req, res) => {
    const userId = Array.isArray(req.user?.id)
        ? req.user.id[0]
        : req.user?.id;
    if (!userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "User not found");
    }
    const result = await subscriptions_service_1.SubscriptionService.createBillingPortalSession(String(userId));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Billing portal session created successfully",
        data: {
            url: result.url,
        },
    });
});
exports.getSalesSummaryController = (0, catchAsync_1.default)(async (req, res) => {
    const result = await subscriptions_service_1.SubscriptionService.getSalesSummary();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Sales summary retrieved successfully",
        data: result,
    });
});
exports.getStripeSalesSummaryController = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await subscriptions_service_1.SubscriptionService.getStripeSalesSummary();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Stripe sales summary retrieved successfully",
        data: result,
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
            case "checkout.session.completed": {
                const session = event.data.object;
                const subscription = await subscriptions_service_1.SubscriptionService.saveSubscriptionToDBFromPaymentLink(session);
                responseData = {
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    success: true,
                    message: "Checkout session completed and subscription synchronized",
                    data: subscription,
                };
                break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
                const stripeSubscription = event.data.object;
                const subscription = await subscriptions_service_1.SubscriptionService.syncSubscriptionFromStripe(stripeSubscription);
                responseData = {
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    success: true,
                    message: `Subscription ${stripeSubscription.status} synchronized`,
                    data: subscription,
                };
                break;
            }
            case "invoice.payment_failed": {
                responseData = await subscriptions_service_1.SubscriptionService.handlePaymentFailed(event.data.object);
                break;
            }
            default: {
                responseData = {
                    statusCode: http_status_codes_1.StatusCodes.OK,
                    success: true,
                    message: `Unhandled event type ${event.type}`,
                    data: null,
                };
            }
        }
        // Webhook events return different payload shapes (subscription documents,
        // payment-failure summaries, or null), so do not let one event narrow the
        // response data type for all webhook branches.
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
    getSalesSummaryController: exports.getSalesSummaryController,
    // orderSuccess,
    orderCancel,
    //  monthlyEarningsStats,
    getStripeSalesSummaryController: exports.getStripeSalesSummaryController,
    createBillingPortalSession,
    stripeWebhookHandler: exports.stripeWebhookHandler,
    checkoutSuccessController: exports.checkoutSuccessController,
};
