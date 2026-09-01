import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

import { getMonthlyRevenueService, handlePaymentFailed, handleSubscriptionDeleted, saveSubscriptionToDB, SubscriptionService } from "./subscriptions.service";
import AppError from "../../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import stripe, { Stripe } from "stripe";

const subscriptions = catchAsync(async (req, res) => {
     const result = await SubscriptionService.subscriptionsFromDB(req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription list retrieved successfully',
          data: result,
     });
});


const subscriptionDetails = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.subscriptionDetailsFromDB(id);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Subscription details retrieved successfully',
          data: result.subscription,
     });
});

const cancelSubscription = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await SubscriptionService.cancelSubscriptionToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
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


const createCheckoutSession = catchAsync(async (req, res) => {
    const { id }: any = req.user;
    // ✅ convert string | string[] to string
    const packageId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await SubscriptionService.createSubscriptionCheckoutSession(
        String(id),
        packageId
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Create checkout session successfully',
        data: {
            sessionId: result.sessionId,
            url: result.url,
        },
    });
});





// update subscriptions
const updateSubscription = catchAsync(async (req, res) => {
        // ✅ logged in user id কে string বানানো
    const userId: string = Array.isArray(req.user?.id) ? req.user.id[0] : req.user?.id || "";
    if (!userId) throw new Error("Invalid user ID");

    // ✅ package id কে string বানানো
    const packageId: string = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!packageId) throw new Error("Invalid package ID");
      const result = await SubscriptionService.upgradeSubscriptionToDB(userId, packageId);
     
     // const { id }: any = req.user;
     // const packageId = req.params.id;
     // const result = await SubscriptionService.upgradeSubscriptionToDB(id, packageId);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Update checkout session successfully',
          data: {
               url: result.url,
          },
     });
});




const orderCancel = catchAsync(async (req, res) => {
    const sessionId = req.query.session_id as string || 'N/A';
    res.render('cancel', { sessionId });  // ✅ sessionId pass করো
});















// Controller for Stripe checkout success
export const checkoutSuccessController = catchAsync(async (req, res ) => {
    const sessionId = req.query.session_id as string;
//     const userId = req.user?.id;

    if (!sessionId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Session ID is required');
    }

//     if (!userId) {
//         throw new AppError(StatusCodes.UNAUTHORIZED, 'User not found');
//     }

    // Save subscription in DB   userId
    const subscription = await saveSubscriptionToDB(sessionId);
  
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






 const monthlyEarningsStats = catchAsync(async (req, res) => {
          const year = Number(req.query.year) || new Date().getFullYear();

          const result =
               await SubscriptionService.getMonthlyEarningsStatsFromDB(year);

          sendResponse(res, {
               statusCode: StatusCodes.OK,
               success: true,
               message: 'Monthly earnings stats retrieved successfully',
               data: result,
          });
     }
);






export const getMonthlyRevenueController = catchAsync(async (req, res) => {
    const revenueData = await getMonthlyRevenueService();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Monthly revenue fetched successfully",
        data: revenueData,
    });
});







export const stripeWebhookHandler = catchAsync( async (req, res) => {
  const sig = req.headers["stripe-signature"] as string | undefined;

  if (!sig) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Missing Stripe signature",
      data: null,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Webhook signature verification failed",
      data: null,
    });
  }

  try {
    let responseData;

    switch (event.type) {
      case "customer.subscription.deleted":
        responseData = await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        responseData = await handlePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
        responseData = {
          statusCode: StatusCodes.OK,
          success: true,
          message: `Unhandled event type ${event.type}`,
          data: null,
        };
    }

    return sendResponse(res, responseData);
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: err.message || "Internal Server Error",
      data: null,
    });
  }
});









export const SubscriptionController = {
     subscriptions,
     subscriptionDetails,
     createCheckoutSession,
     updateSubscription,
     cancelSubscription,
     getMonthlyRevenueController,
     // orderSuccess,
     orderCancel,
     monthlyEarningsStats,
  
};
