import { StatusCodes } from 'http-status-codes';
import { IPackage } from './package.interface';
import { Package } from './package.model';
import mongoose from 'mongoose';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../../builder/QueryBuilder';
import stripe from '../../config/stripe';
import { createSubscriptionProduct } from '../../../handlers/createSubscriptionProductHelper';
import { updateSubscriptionInfo } from '../../../handlers/updateSubscriptionProductInfo';








const createPackageToDB = async (payload: IPackage): Promise<IPackage | null> => {
     const productPayload = {
          title: payload.title,
          duration: payload.duration,
          price: Number(payload.price),
     };

     const product = await createSubscriptionProduct(productPayload);

     if (!product) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create subscription product');
     }

     if (product) {
          payload.priceId = product.priceId;
          payload.productId = product.productId;
     }

     const result = await Package.create(payload);
     if (!result) {
          await stripe.products.del(product.productId);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to created Package');
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
const updatePackageToDB = async (
  idParam: string | string[],
  payload: IPackage
): Promise<IPackage> => {
  // ✅ Ensure id is string
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  // Find existing package
  const isExistPackage: IPackage | null = await Package.findById(id);
  if (!isExistPackage) {
    throw new AppError(StatusCodes.NOT_FOUND, "Package not found");
  }

  // Update subscription info in Stripe
  const updatedProduct = await updateSubscriptionInfo(
    isExistPackage.productId ?? "",
    payload
  );

  if (!updatedProduct) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Failed to update subscription product in Stripe"
    );
  }

  // ✅ Handle string | undefined safely
  payload.priceId = updatedProduct.priceId ?? "";
  payload.productId = updatedProduct.productId ?? "";

  // Update package in MongoDB
  const updatedPackage = await Package.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedPackage) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Failed to update package");
  }

  return updatedPackage;
};











const getPackageFromDB = async (queryParms: Record<string, unknown>) => {
     const query: any = {
          isDeleted: false,
     };

     const queryBuilder = new QueryBuilder(Package.find(query), queryParms);
     const packages = await queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
     console.log(packages);
     const meta = await queryBuilder.countTotal();
     return {
          packages,
          meta,
     };
};
const getPackageByUserFromDB = async (queryParms: Record<string, unknown>) => {
     const query: any = {
          status: 'active',
          isDeleted: false,
     };

     const queryBuilder = new QueryBuilder(Package.find(query), queryParms);
     const packages = await queryBuilder.filter().sort().paginate().fields().sort().modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     return {
          packages,
          meta,
     };
};

const getPackageDetailsFromDB = async (id: string): Promise<IPackage | null> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid ID');
     }
     const result = await Package.findById(id);
     if (!result) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }
     return result;
};

const deletePackageToDB = async (id: string): Promise<IPackage | null> => {
     const isExistPackage: any = await Package.findById(id);
     if (!isExistPackage) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Package not found');
     }

     try {
          // Get all prices for the Stripe product
          const prices = await stripe.prices.list({ product: isExistPackage.productId });

          // Deactivate all prices associated with the product
          for (const price of prices.data) {
               if (price.active) {
                    await stripe.prices.update(price.id, { active: false });
               }
          }

          // Archive the product instead of deleting it
          // This is the recommended approach when you have associated prices
          await stripe.products.update(isExistPackage.productId, {
               active: false,
               metadata: {
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'system', // or pass user info if available
               },
          });

          // Update the package status in your DB
          const result = await Package.findByIdAndUpdate(
               { _id: id },
               {
                    status: 'inactive',
                    isDeleted: true,
                    deletedAt: new Date(), // Add timestamp for when it was deleted
               },
               { new: true },
          );

          if (!result) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Package');
          }

          return result;
     } catch (stripeError: any) {
          // Handle Stripe-specific errors
          if (stripeError.type === 'StripeInvalidRequestError') {
               // If the product doesn't exist in Stripe, just update the DB
               console.warn(`Stripe product ${isExistPackage.productId} not found, updating DB only`);

               const result = await Package.findByIdAndUpdate(
                    { _id: id },
                    {
                         status: 'inactive',
                         isDeleted: true,
                         deletedAt: new Date(),
                    },
                    { new: true },
               );

               return result;
          }

          // Re-throw other errors
          throw new AppError(StatusCodes.BAD_REQUEST, `Failed to delete package: ${stripeError.message}`);
     }
};

export const PackageService = {
     createPackageToDB,
     updatePackageToDB,
     getPackageFromDB,
     getPackageDetailsFromDB,
     deletePackageToDB,
     getPackageByUserFromDB,
};
