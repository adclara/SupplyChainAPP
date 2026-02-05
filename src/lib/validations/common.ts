/**
 * Common Validation Schemas
 * @description Reusable Zod schemas for input validation
 */

import { z } from 'zod';

// =============================================================================
// PRIMITIVE VALIDATORS
// =============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Warehouse ID (UUID)
 */
export const warehouseIdSchema = uuidSchema;

/**
 * User ID (UUID)
 */
export const userIdSchema = uuidSchema;

/**
 * Product ID (UUID)
 */
export const productIdSchema = uuidSchema;

/**
 * Location ID (UUID)
 */
export const locationIdSchema = uuidSchema;

/**
 * Positive integer
 */
export const positiveIntSchema = z.number().int('Must be a whole number').positive('Must be positive');

/**
 * Non-negative integer (0 or more)
 */
export const nonNegativeIntSchema = z.number().int('Must be a whole number').nonnegative('Cannot be negative');

/**
 * Quantity for inventory operations (positive, reasonable bounds)
 */
export const quantitySchema = z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be positive')
    .max(99999, 'Quantity exceeds maximum allowed');

/**
 * Optional quantity (can be 0)
 */
export const optionalQuantitySchema = z.number()
    .int('Quantity must be a whole number')
    .nonnegative('Quantity cannot be negative')
    .max(99999, 'Quantity exceeds maximum allowed');

// =============================================================================
// STRING VALIDATORS
// =============================================================================

/**
 * Non-empty string
 */
export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

/**
 * SKU format (alphanumeric with dashes)
 */
export const skuSchema = z.string()
    .min(1, 'SKU cannot be empty')
    .max(50, 'SKU too long')
    .regex(/^[A-Za-z0-9\-_]+$/, 'SKU can only contain letters, numbers, dashes, and underscores');

/**
 * Location barcode format
 */
export const barcodeSchema = z.string()
    .min(1, 'Barcode cannot be empty')
    .max(50, 'Barcode too long');

/**
 * Order number format
 */
export const orderNumberSchema = z.string()
    .min(1, 'Order number cannot be empty')
    .max(50, 'Order number too long');

// =============================================================================
// PAGINATION VALIDATORS
// =============================================================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * Sort parameters
 */
export const sortSchema = z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// DATE VALIDATORS
// =============================================================================

/**
 * ISO date string
 */
export const isoDateSchema = z.string().datetime({ offset: true });

/**
 * Optional date range
 */
export const dateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    { message: 'Start date must be before end date' }
);

// =============================================================================
// ENUM VALIDATORS
// =============================================================================

/**
 * Transaction types
 */
export const transactionTypeSchema = z.enum([
    'receive',
    'putaway',
    'pick',
    'pack',
    'adjust',
    'inventory_update',
    'move'
]);

/**
 * Location types
 */
export const locationTypeSchema = z.enum(['prime', 'reserve', 'dock', 'problem']);

/**
 * Shipment status
 */
export const shipmentStatusSchema = z.enum(['pending', 'picking', 'packed', 'shipped']);

/**
 * Wave status
 */
export const waveStatusSchema = z.enum(['pending', 'picking', 'packing', 'shipped']);

/**
 * Problem ticket status
 */
export const ticketStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed']);

/**
 * Problem ticket types
 */
export const ticketTypeSchema = z.enum(['shortage', 'damage', 'mislabel', 'wrong_location', 'other']);

// =============================================================================
// COMPOSITE VALIDATORS
// =============================================================================

/**
 * Add stock operation
 */
export const addStockSchema = z.object({
    warehouseId: warehouseIdSchema,
    productId: productIdSchema,
    locationId: locationIdSchema,
    quantity: quantitySchema,
    userId: userIdSchema,
    referenceId: uuidSchema.optional(),
});

/**
 * Move stock operation
 */
export const moveStockSchema = z.object({
    warehouseId: warehouseIdSchema,
    productId: productIdSchema,
    fromLocationId: locationIdSchema,
    toLocationId: locationIdSchema,
    quantity: quantitySchema,
    userId: userIdSchema,
});

/**
 * Adjust stock operation
 */
export const adjustStockSchema = z.object({
    warehouseId: warehouseIdSchema,
    productId: productIdSchema,
    locationId: locationIdSchema,
    deltaQuantity: z.number().int(),
    userId: userIdSchema,
    reason: nonEmptyStringSchema.max(500),
});

/**
 * Complete pick operation
 */
export const completePickSchema = z.object({
    lineId: uuidSchema,
    userId: userIdSchema,
});

/**
 * Complete pick with shortage
 */
export const completePickWithShortageSchema = z.object({
    lineId: uuidSchema,
    userId: userIdSchema,
    actualQuantity: nonNegativeIntSchema,
    shortageReason: z.string().max(500).optional(),
});

/**
 * Receive item operation
 */
export const receiveItemSchema = z.object({
    lineId: uuidSchema,
    quantity: quantitySchema,
    userId: userIdSchema.optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate and parse data, returning result with typed error
 */
export function safeValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    // Format the first error message - Zod v4 uses .issues instead of .errors
    const issues = result.error.issues;
    if (issues && issues.length > 0) {
        const firstError = issues[0];
        const path = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';
        return { success: false, error: `${path}${firstError.message}` };
    }
    return { success: false, error: 'Validation failed' };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data);
}
