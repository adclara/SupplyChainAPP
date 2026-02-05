/**
 * Validation Schemas Tests
 * @description Unit tests for input validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
    uuidSchema,
    quantitySchema,
    skuSchema,
    paginationSchema,
    addStockSchema,
    moveStockSchema,
    safeValidate,
    validateOrThrow,
} from '@/lib/validations/common';

describe('Primitive Validators', () => {
    describe('uuidSchema', () => {
        it('should accept valid UUID', () => {
            const validUuid = '123e4567-e89b-12d3-a456-426614174000';
            expect(uuidSchema.safeParse(validUuid).success).toBe(true);
        });

        it('should reject invalid UUID', () => {
            expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
            expect(uuidSchema.safeParse('').success).toBe(false);
            expect(uuidSchema.safeParse(123).success).toBe(false);
        });
    });

    describe('quantitySchema', () => {
        it('should accept positive integers', () => {
            expect(quantitySchema.safeParse(1).success).toBe(true);
            expect(quantitySchema.safeParse(100).success).toBe(true);
            expect(quantitySchema.safeParse(99999).success).toBe(true);
        });

        it('should reject zero', () => {
            expect(quantitySchema.safeParse(0).success).toBe(false);
        });

        it('should reject negative numbers', () => {
            expect(quantitySchema.safeParse(-1).success).toBe(false);
            expect(quantitySchema.safeParse(-100).success).toBe(false);
        });

        it('should reject non-integers', () => {
            expect(quantitySchema.safeParse(1.5).success).toBe(false);
            expect(quantitySchema.safeParse(0.1).success).toBe(false);
        });

        it('should reject values exceeding maximum', () => {
            expect(quantitySchema.safeParse(100000).success).toBe(false);
        });
    });

    describe('skuSchema', () => {
        it('should accept valid SKUs', () => {
            expect(skuSchema.safeParse('SKU-123').success).toBe(true);
            expect(skuSchema.safeParse('PRODUCT_001').success).toBe(true);
            expect(skuSchema.safeParse('ABC123').success).toBe(true);
        });

        it('should reject empty strings', () => {
            expect(skuSchema.safeParse('').success).toBe(false);
        });

        it('should reject special characters', () => {
            expect(skuSchema.safeParse('SKU@123').success).toBe(false);
            expect(skuSchema.safeParse('SKU 123').success).toBe(false);
        });
    });
});

describe('Composite Validators', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    describe('paginationSchema', () => {
        it('should accept valid pagination params', () => {
            const result = paginationSchema.safeParse({ page: 1, limit: 25 });
            expect(result.success).toBe(true);
        });

        it('should apply defaults', () => {
            const result = paginationSchema.parse({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(25);
        });

        it('should reject page < 1', () => {
            expect(paginationSchema.safeParse({ page: 0, limit: 25 }).success).toBe(false);
        });

        it('should reject limit > 100', () => {
            expect(paginationSchema.safeParse({ page: 1, limit: 150 }).success).toBe(false);
        });
    });

    describe('addStockSchema', () => {
        it('should accept valid add stock params', () => {
            const validData = {
                warehouseId: validUuid,
                productId: validUuid,
                locationId: validUuid,
                quantity: 10,
                userId: validUuid,
            };
            expect(addStockSchema.safeParse(validData).success).toBe(true);
        });

        it('should accept optional referenceId', () => {
            const validData = {
                warehouseId: validUuid,
                productId: validUuid,
                locationId: validUuid,
                quantity: 10,
                userId: validUuid,
                referenceId: validUuid,
            };
            expect(addStockSchema.safeParse(validData).success).toBe(true);
        });

        it('should reject missing required fields', () => {
            expect(addStockSchema.safeParse({}).success).toBe(false);
            expect(addStockSchema.safeParse({ warehouseId: validUuid }).success).toBe(false);
        });

        it('should reject invalid UUIDs', () => {
            const invalidData = {
                warehouseId: 'not-uuid',
                productId: validUuid,
                locationId: validUuid,
                quantity: 10,
                userId: validUuid,
            };
            expect(addStockSchema.safeParse(invalidData).success).toBe(false);
        });

        it('should reject invalid quantity', () => {
            const invalidData = {
                warehouseId: validUuid,
                productId: validUuid,
                locationId: validUuid,
                quantity: -5,
                userId: validUuid,
            };
            expect(addStockSchema.safeParse(invalidData).success).toBe(false);
        });
    });

    describe('moveStockSchema', () => {
        it('should accept valid move stock params', () => {
            const validData = {
                warehouseId: validUuid,
                productId: validUuid,
                fromLocationId: validUuid,
                toLocationId: validUuid,
                quantity: 5,
                userId: validUuid,
            };
            expect(moveStockSchema.safeParse(validData).success).toBe(true);
        });
    });
});

describe('Helper Functions', () => {
    describe('safeValidate', () => {
        it('should return success with data on valid input', () => {
            const result = safeValidate(quantitySchema, 10);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe(10);
            }
        });

        it('should return error message on invalid input', () => {
            const result = safeValidate(quantitySchema, -5);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(typeof result.error).toBe('string');
                expect(result.error.length).toBeGreaterThan(0);
            }
        });
    });

    describe('validateOrThrow', () => {
        it('should return data on valid input', () => {
            const result = validateOrThrow(quantitySchema, 10);
            expect(result).toBe(10);
        });

        it('should throw on invalid input', () => {
            expect(() => validateOrThrow(quantitySchema, -5)).toThrow();
        });
    });
});
