import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import type { Request, Response } from "express";

import { 
  getMonthlyRevenueService, 
  handlePaymentFailed, 
  handleSubscriptionDeleted, 
  saveSubscriptionToDB,
  saveSubscriptionToDBFromPaymentLink,
  SubscriptionService} from "./subscriptions.service";
import AppError from "../../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import Stripe from "stripe";
// import stripe from '../../config/stripe';



const subscriptions = catchAsync(async (req, res) => {
     sendResponse(res, {
          statusCode: StatusCodes.NOT_IMPLEMENTED,
          success: false,
          message: 'Subscription list retrieval is not implemented',
          data: null,
     });
});


const subscriptionDetails = catchAsync(async (req, res) => {
     sendResponse(res, {
          statusCode: StatusCodes.NOT_IMPLEMENTED,
          success: false,
          message: 'Subscription details retrieval is not implemented',
          data: null,
     });
});

const cancelSubscription = catchAsync(async (req, res) => {
     sendResponse(res, {
          statusCode: StatusCodes.NOT_IMPLEMENTED,
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


const createCheckoutSession = catchAsync(async (req, res) => {
  const { id }: any = req.user;
  const { packageId } = req.body;

  if (!packageId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Package ID is required");
  }

  const result = await SubscriptionService.createSubscriptionCheckoutSession(
    String(id),
    String(packageId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Create checkout session successfully",
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
      // Use existing service method to create/upgrade a checkout session
      const result = await SubscriptionService.createSubscriptionCheckoutSession(userId, packageId);
     
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


export const getStripeMonthlyRevenueController = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await SubscriptionService.getStripeMonthlyRevenue();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Stripe monthly revenue retrieved successfully",
      data: result,
    });
  }
);



export const getMonthlyRevenueController = catchAsync(async (_req, res) => {
  const revenueData = await getMonthlyRevenueService();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Monthly revenue fetched successfully",
    data: revenueData,
  });
});


const createBillingPortalSession = catchAsync(async (req, res) => {
  const userId = Array.isArray(req.user?.id)
    ? req.user.id[0]
    : req.user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not found");
  }

  const result = await SubscriptionService.createBillingPortalSession(
    String(userId)
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Billing portal session created successfully",
    data: {
      url: result.url,
    },
  });
});


export const getSalesSummaryController = catchAsync(
  async (req: Request, res: Response) => {
    const result = await SubscriptionService.getSalesSummary();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Sales summary retrieved successfully",
      data: result,
    });
  }
);


export const getStripeSalesSummaryController = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await SubscriptionService.getStripeSalesSummary();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Stripe sales summary retrieved successfully",
      data: result,
    });
  }
);


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
    event = Stripe.webhooks.constructEvent(
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
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscription =
          await SubscriptionService.saveSubscriptionToDBFromPaymentLink(session);

        responseData = {
          statusCode: StatusCodes.OK,
          success: true,
          message: "Checkout session completed and subscription synchronized",
          data: subscription,
        };
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;

        const subscription =
          await SubscriptionService.syncSubscriptionFromStripe(stripeSubscription);

        responseData = {
          statusCode: StatusCodes.OK,
          success: true,
          message: `Subscription ${stripeSubscription.status} synchronized`,
          data: subscription,
        };
        break;
      }

      case "invoice.payment_failed": {
        responseData = await SubscriptionService.handlePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      }

      default: {
        responseData = {
          statusCode: StatusCodes.OK,
          success: true,
          message: `Unhandled event type ${event.type}`,
          data: null,
        };
      }
    }

    // Webhook events return different payload shapes (subscription documents,
    // payment-failure summaries, or null), so do not let one event narrow the
    // response data type for all webhook branches.
    return sendResponse(res, responseData as any);
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
     getSalesSummaryController,
     // orderSuccess,
     orderCancel,
    //  monthlyEarningsStats,
    getStripeSalesSummaryController,
    createBillingPortalSession,
    stripeWebhookHandler,
    checkoutSuccessController,
  
};
