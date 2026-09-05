"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscriptionInfo = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../app/config/stripe"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const updateSubscriptionInfo = async (productId, payload) => {
    const updatedProduct = await stripe_1.default.products.update(productId, {
        name: payload.title || undefined,
        description: payload.description || undefined,
    });
    if (!updatedProduct) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to update product in Stripe');
    }
    let interval = 'month';
    let intervalCount = 1;
    switch (payload.duration) {
        case '1 month':
            interval = 'month';
            intervalCount = 1;
            break;
        case '3 months':
            interval = 'month';
            intervalCount = 3;
            break;
        case '6 months':
            interval = 'month';
            intervalCount = 6;
            break;
        case '1 year':
            interval = 'year';
            intervalCount = 1;
            break;
        default:
            interval = 'month';
            intervalCount = 1;
    }
    const newPrice = await stripe_1.default.prices.create({
        product: productId,
        unit_amount: Number(payload.price) * 100,
        currency: 'usd',
        recurring: { interval, interval_count: intervalCount },
    });
    if (!newPrice) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create new price in Stripe');
    }
    // Step 3: Return the updated product and price IDs
    return { productId: updatedProduct.id, priceId: newPrice.id };
};
exports.updateSubscriptionInfo = updateSubscriptionInfo;
