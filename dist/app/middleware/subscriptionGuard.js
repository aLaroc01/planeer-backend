"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionGuard = void 0;
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const subscriptions_service_1 = require("../modules/subscriptions-information/subscriptions.service");
const subscriptionGuard = async (req, res, next) => {
    const userId = req.user?._id; // auth middleware থেকে
    if (!userId) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
    }
    const isActive = await (0, subscriptions_service_1.checkActiveSubscription)(userId);
    if (!isActive) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Subscription expired or inactive');
    }
    next();
};
exports.subscriptionGuard = subscriptionGuard;
