import { z } from 'zod';

export const createShipmentSchema = z.object({
    asn_number: z.string()
        .min(3, 'ASN must be at least 3 characters')
        .transform(val => val.toUpperCase()) // Auto-convert to uppercase
        .refine(val => /^[A-Z0-9-]+$/.test(val), {
            message: 'ASN can only contain letters, numbers, and dashes'
        }),
    supplier_name: z.string().min(2, 'Supplier name is required'),
    expected_date: z.string().refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'Expected date cannot be in the past',
    }),
    carrier: z.string().optional(),
});

export const manualReceiveSchema = z.object({
    barcode: z.string().min(1, 'Product barcode is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
});

export type CreateShipmentValues = z.infer<typeof createShipmentSchema>;
export type ManualReceiveValues = z.infer<typeof manualReceiveSchema>;
