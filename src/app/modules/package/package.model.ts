import { model, Schema } from 'mongoose';
import { IPackage, PackageModel } from './package.interface';

const packageSchema = new Schema<IPackage, PackageModel>(
     {
          title: {
               type: String,
               required: true,
          },
          price: {
               type: Number,
               required: true,
          },
          priceId: {
               type: String,
               required: true,
          },
          duration: {
               type: String,
               enum: ['1 month', '3 months', '6 months', '1 year'],
               required: true,
          },
          paymentType: {
               type: String,
               enum: ['Monthly', 'Yearly'],
               required: true,
          },
          status: {
               type: String,
               enum: ['active', 'inactive'],
               default: 'active',
          },
          isDeleted: {
               type: Boolean,
               default: false,
          },
     },
     {
          timestamps: true,
     },
);

export const Package = model<IPackage, PackageModel>('Package', packageSchema);
