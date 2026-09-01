"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config");
const stripe_1 = __importDefault(require("stripe"));
if (!config_1.config.stripe_secret_key) {
    throw new Error('Stripe secret key is missing');
}
// const stripe = new Stripe(config.stripe_secret_key as string);
// const stripe: Stripe = new Stripe(config.stripe_secret_key as string, {
//  apiVersion: '2025-10-29.clover', // latest type-safe version
// });
const stripe = new stripe_1.default(config_1.config.stripe_secret_key, {
    apiVersion: '2023-10-16',
});
exports.default = stripe;
