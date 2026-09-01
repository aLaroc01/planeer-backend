"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageValidation = void 0;
const zod_1 = require("zod");
const createPackageZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().nonempty('Title is required'),
        description: zod_1.z.string().nonempty('Description is required'),
        price: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .transform((val) => typeof val === 'string' ? parseFloat(val) : val)
            .refine((val) => !isNaN(val), {
            message: 'Price must be a valid number',
        }),
        duration: zod_1.z.enum(['1 month', '3 months', '6 months', '1 year']),
        paymentType: zod_1.z.enum(['Monthly', 'Yearly']),
        productId: zod_1.z.string().optional(),
        subscriptionType: zod_1.z.enum(['app', 'web']),
    }),
});
exports.PackageValidation = {
    createPackageZodSchema,
};
