import { StatusCodes } from 'http-status-codes';
import stripe from '../app/config/stripe';
import { IPackage } from '../app/modules/package/package.interface';
import AppError from '../errors/AppError';


export const updateSubscriptionInfo = async (productId: string, payload: Partial<IPackage>): Promise<{ productId: string; priceId: string }> => {
     const updatedProduct = await stripe.products.update(productId, {
          name: (payload.title as string) || undefined,
          description: (payload.description as string) || undefined,
     });

     if (!updatedProduct) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update product in Stripe');
     }

     let interval: 'month' | 'year' = 'month';
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

     const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Number(payload.price) * 100,
          currency: 'usd',
          recurring: { interval, interval_count: intervalCount },
     });

     if (!newPrice) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create new price in Stripe');
     }

     // Step 3: Return the updated product and price IDs
     return { productId: updatedProduct.id, priceId: newPrice.id };
};
