"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const subscriptions_controller_1 = require("./subscriptions.controller");
const subscriptionGuard_1 = require("../../middleware/subscriptionGuard");
const router = express_1.default.Router();
//USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN
router.get('/', auth_middleware_1.auth, subscriptions_controller_1.SubscriptionController.subscriptions);
router.get('/details', auth_middleware_1.auth, subscriptions_controller_1.SubscriptionController.subscriptionDetails);
// router.get('/success', SubscriptionController.orderSuccess);
router.get('/success', subscriptions_controller_1.checkoutSuccessController);
router.get('/cancel', subscriptions_controller_1.SubscriptionController.orderCancel);
router.post('/create-checkout-session/:id', auth_middleware_1.auth, subscriptions_controller_1.SubscriptionController.createCheckoutSession);
router.post('/update/:id', auth_middleware_1.auth, subscriptions_controller_1.SubscriptionController.updateSubscription);
router.delete('/subscription/cancel/:id', subscriptions_controller_1.SubscriptionController.cancelSubscription);
router.get('/monthly-earnings-stats', auth_middleware_1.auth, auth_middleware_1.isAdmin, subscriptions_controller_1.SubscriptionController.monthlyEarningsStats);
router.get('/subscriptions/stats', auth_middleware_1.auth, auth_middleware_1.isAdmin, subscriptions_controller_1.SubscriptionController.getMonthlyRevenueController);
// Example of protected route using subscriptionGuard
router.get('/premium-content', auth_middleware_1.auth, subscriptionGuard_1.subscriptionGuard, (req, res) => {
    res.send('This is premium content for active subscribers only.');
});
router.post('/stripe/webhook', express_1.default.raw({ type: 'application/json' }), subscriptions_controller_1.stripeWebhookHandler);
exports.SubscriptionRoutes = router;
