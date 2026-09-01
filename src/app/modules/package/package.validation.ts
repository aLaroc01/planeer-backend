import { z } from 'zod';

const createPackageZodSchema = z.object({
  body: z.object({
    title: z.string().nonempty('Title is required'),

    description: z.string().nonempty('Description is required'),

    price: z
      .union([z.string(), z.number()])
      .transform((val) =>
        typeof val === 'string' ? parseFloat(val) : val
      )
      .refine((val) => !isNaN(val), {
        message: 'Price must be a valid number',
      }),

    duration: z.enum(['1 month', '3 months', '6 months', '1 year']),

    paymentType: z.enum(['Monthly', 'Yearly']),

    productId: z.string().optional(),

    subscriptionType: z.enum(['app', 'web']),
  }),
});

export const PackageValidation = {
  createPackageZodSchema,
};