import express from 'express';
import { auth, isAdmin } from '../../middleware/auth.middleware';
import { checkoutSuccessController, stripeWebhookHandler, SubscriptionController } from './subscriptions.controller';
import { subscriptionGuard } from '../../middleware/subscriptionGuard';


const router = express.Router();
//USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN
router.get('/', auth, SubscriptionController.subscriptions);

router.get('/details', auth, SubscriptionController.subscriptionDetails);
// router.get('/success', SubscriptionController.orderSuccess);
router.get('/success', checkoutSuccessController);
router.get('/cancel', SubscriptionController.orderCancel);
router.post('/create-checkout-session/:id', auth, SubscriptionController.createCheckoutSession);
router.post('/update/:id', auth, SubscriptionController.updateSubscription);
router.delete('/subscription/cancel/:id',  SubscriptionController.cancelSubscription);
router.get('/monthly-earnings-stats',auth,isAdmin,SubscriptionController.monthlyEarningsStats);
router.get('/subscriptions/stats',auth,isAdmin,SubscriptionController.getMonthlyRevenueController);


// Example of protected route using subscriptionGuard
router.get('/premium-content', auth, subscriptionGuard, (req, res) => {
    res.send('This is premium content for active subscribers only.');
});

router.post( '/stripe/webhook',express.raw({ type: 'application/json' }), stripeWebhookHandler);




export const SubscriptionRoutes = router;
