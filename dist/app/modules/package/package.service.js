"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const http_status_codes_1 = require("http-status-codes");
const package_model_1 = require("./package.model");
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const QueryBuilder_1 = __importDefault(require("../../../builder/QueryBuilder"));
const stripe_1 = __importDefault(require("../../config/stripe"));
const createSubscriptionProductHelper_1 = require("../../../handlers/createSubscriptionProductHelper");
const updateSubscriptionProductInfo_1 = require("../../../handlers/updateSubscriptionProductInfo");
const createPackageToDB = async (payload) => {
    const productPayload = {
        title: payload.title,
        duration: payload.duration,
        price: Number(payload.price),
    };
    const product = await (0, createSubscriptionProductHelper_1.createSubscriptionProduct)(productPayload);
    if (!product) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create subscription product');
    }
    if (product) {
        payload.priceId = product.priceId;
        payload.productId = product.productId;
    }
    const result = await package_model_1.Package.create(payload);
    if (!result) {
        await stripe_1.default.products.del(product.productId);
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to created Package');
    }
    return result;
};
// const updatePackageToDB = async (id: string, payload: IPackage): Promise<IPackage | null> => {
//      const isExistPackage: any = await Package.findById(id);
//      if (!isExistPackage) {
//           throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
//      }
//      const updatedProduct = await updateSubscriptionInfo(isExistPackage.productId, payload);
//      if (!updatedProduct) {
//           throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update subscription product in Stripe');
//      }
//      payload.priceId = updatedProduct.priceId;
//      payload.productId = updatedProduct.productId;
//      const updatedPackage = await Package.findByIdAndUpdate(id, payload, {
//           new: true,
//           runValidators: true,
//      });
//      if (!updatedPackage) {
//           throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update package');
//      }
//      return updatedPackage;
// };
const updatePackageToDB = async (idParam, payload) => {
    // ✅ Ensure id is string
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    // Find existing package
    const isExistPackage = await package_model_1.Package.findById(id);
    if (!isExistPackage) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Package not found");
    }
    // Update subscription info in Stripe
    const updatedProduct = await (0, updateSubscriptionProductInfo_1.updateSubscriptionInfo)(isExistPackage.productId ?? "", payload);
    if (!updatedProduct) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to update subscription product in Stripe");
    }
    // ✅ Handle string | undefined safely
    payload.priceId = updatedProduct.priceId ?? "";
    payload.productId = updatedProduct.productId ?? "";
    // Update package in MongoDB
    const updatedPackage = await package_model_1.Package.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!updatedPackage) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Failed to update package");
    }
    return updatedPackage;
};
const getPackageFromDB = async (queryParms) => {
    const query = {
        isDeleted: false,
    };
    const queryBuilder = new QueryBuilder_1.default(package_model_1.Package.find(query), queryParms);
    const packages = await queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
    console.log(packages);
    const meta = await queryBuilder.countTotal();
    return {
        packages,
        meta,
    };
};
const getPackageByUserFromDB = async (queryParms) => {
    const query = {
        status: 'active',
        isDeleted: false,
    };
    const queryBuilder = new QueryBuilder_1.default(package_model_1.Package.find(query), queryParms);
    const packages = await queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
    const meta = await queryBuilder.countTotal();
    return {
        packages,
        meta,
    };
};
const getPackageDetailsFromDB = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid ID');
    }
    const result = await package_model_1.Package.findById(id);
    if (!result) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    }
    return result;
};
const deletePackageToDB = async (id) => {
    const isExistPackage = await package_model_1.Package.findById(id);
    if (!isExistPackage) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Package not found');
    }
    try {
        // Get all prices for the Stripe product
        const prices = await stripe_1.default.prices.list({ product: isExistPackage.productId });
        // Deactivate all prices associated with the product
        for (const price of prices.data) {
            if (price.active) {
                await stripe_1.default.prices.update(price.id, { active: false });
            }
        }
        // Archive the product instead of deleting it
        // This is the recommended approach when you have associated prices
        await stripe_1.default.products.update(isExistPackage.productId, {
            active: false,
            metadata: {
                deleted_at: new Date().toISOString(),
                deleted_by: 'system', // or pass user info if available
            },
        });
        // Update the package status in your DB
        const result = await package_model_1.Package.findByIdAndUpdate({ _id: id }, {
            status: 'inactive',
            isDeleted: true,
            deletedAt: new Date(), // Add timestamp for when it was deleted
        }, { new: true });
        if (!result) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to delete Package');
        }
        return result;
    }
    catch (stripeError) {
        // Handle Stripe-specific errors
        if (stripeError.type === 'StripeInvalidRequestError') {
            // If the product doesn't exist in Stripe, just update the DB
            console.warn(`Stripe product ${isExistPackage.productId} not found, updating DB only`);
            const result = await package_model_1.Package.findByIdAndUpdate({ _id: id }, {
                status: 'inactive',
                isDeleted: true,
                deletedAt: new Date(),
            }, { new: true });
            return result;
        }
        // Re-throw other errors
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Failed to delete package: ${stripeError.message}`);
    }
};
exports.PackageService = {
    createPackageToDB,
    updatePackageToDB,
    getPackageFromDB,
    getPackageDetailsFromDB,
    deletePackageToDB,
    getPackageByUserFromDB,
};
