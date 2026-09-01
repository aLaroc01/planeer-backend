

import { config } from '../config';
import Stripe from 'stripe';

if (!config.stripe_secret_key) {
  throw new Error('Stripe secret key is missing');
}

// const stripe = new Stripe(config.stripe_secret_key as string);

// const stripe: Stripe = new Stripe(config.stripe_secret_key as string, {
//  apiVersion: '2025-10-29.clover', // latest type-safe version
// });

const stripe = new Stripe(config.stripe_secret_key as string, {
  apiVersion: '2023-10-16' as any,
});

export default stripe;
