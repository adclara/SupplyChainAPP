/**
 * Database Types
 * @description Type definitions for Supabase query results to eliminate 'any' types
 */

// =============================================================================
// QUERY RESULT TYPES (for Supabase select queries with joins)
// =============================================================================

/**
 * Inbound shipment status row (minimal for dashboard filtering)
 */
export interface InboundShipmentStatusRow {
    status: string;
}

/**
 * Putaway task status row
 */
export interface PutawayTaskStatusRow {
    status: string;
}

/**
 * Wave status row
 */
export interface WaveStatusRow {
    status: string;
}

/**
 * Shipment status row (for dashboard)
 */
export interface ShipmentStatusRow {
    status: string;
    shipped_at: string | null;
}

/**
 * Inventory quantity row
 */
export interface InventoryQuantityRow {
    quantity: number;
}

/**
 * Location units row
 */
export interface LocationUnitsRow {
    id: string;
    current_units: number;
}

/**
 * Problem ticket row (for dashboard)
 */
export interface ProblemTicketRow {
    status: string;
    priority: string;
}

/**
 * Inventory row with product join (for stats)
 * Note: Supabase returns joined data as arrays or single objects depending on relationship
 */
export interface InventoryWithProductRow {
    quantity: number;
    product: {
        id: string;
        min_stock_level: number | null;
    } | {
        id: string;
        min_stock_level: number | null;
    }[] | null;
}

/**
 * Inventory with product category (for category distribution)
 */
export interface InventoryWithCategoryRow {
    quantity: number;
    product: {
        category_id: string | null;
        category: {
            name: string;
        } | {
            name: string;
        }[] | null;
    } | {
        category_id: string | null;
        category: {
            name: string;
        } | {
            name: string;
        }[] | null;
    }[] | null;
}

/**
 * Transaction with joins (for activity display)
 * Note: Supabase returns related data as arrays when using select with joins
 */
export interface TransactionActivityRow {
    id: string;
    transaction_type: string;
    notes: string | null;
    created_at: string;
    user: {
        full_name: string | null;
    }[] | null;
}

/**
 * Transaction with full joins (for history display)
 */
export interface TransactionHistoryRow {
    id: string;
    warehouse_id: string;
    transaction_type: string;
    user_id: string;
    product_id: string | null;
    location_id_from: string | null;
    location_id_to: string | null;
    quantity: number | null;
    reference_id: string | null;
    notes: string | null;
    status: string;
    created_at: string;
    product: {
        name: string;
        sku: string;
    } | null;
    location_from: {
        barcode: string;
    } | null;
    location_to: {
        barcode: string;
    } | null;
    user: {
        full_name: string;
    } | null;
}

/**
 * Shipment line with product for wave checking
 */
export interface ShipmentLineForCommitmentRow {
    product_id: string;
    quantity: number;
    product: {
        sku: string;
    } | null;
}

/**
 * Eligible shipment row (for wave building)
 */
export interface EligibleShipmentRow {
    id: string;
    order_number: string;
    customer_name: string | null;
    created_at: string;
    shipment_lines: Array<{
        product_id: string;
        quantity: number;
    }>;
}

/**
 * Wave with shipments (for detail view)
 */
export interface WaveWithShipmentsRow {
    id: string;
    wave_number: string;
    warehouse_id: string;
    status: string;
    total_shipments: number;
    created_at: string;
    released_at: string | null;
    shipments: Array<{
        id: string;
        order_number: string;
        customer_name: string | null;
        status: string;
        shipment_lines: Array<{
            id: string;
            product_id: string;
            quantity: number;
            status: string;
        }>;
    }>;
}

/**
 * Shipment line for cartonization
 */
export interface ShipmentLineForCartonRow {
    quantity: number;
    product: {
        dimensions_cm: {
            l?: number;
            w?: number;
            h?: number;
            length?: number;
            width?: number;
            height?: number;
        } | null;
        weight_kg: number | null;
    } | null;
}

// =============================================================================
// SUPABASE RESPONSE HELPERS
// =============================================================================

/**
 * Extracts data from a Supabase query result with type safety
 */
export function extractData<T>(data: T[] | null): T[] {
    return data ?? [];
}

/**
 * Safely access nested product field from joined query
 */
export function getProductField<T>(
    row: { product: T | null },
    defaultValue: T extends object ? Partial<T> : T
): T {
    return row.product ?? (defaultValue as T);
}

// =============================================================================
// RPC FUNCTION RESULT TYPES
// =============================================================================

/**
 * Result from complete_pick RPC
 */
export interface CompletePickResult {
    success: boolean;
    message?: string;
}

/**
 * Result from complete_pick_with_shortage RPC
 */
export interface CompletePickWithShortageResult {
    success: boolean;
    actual_quantity: number;
    shortage: number;
    ticket_id: string | null;
}

/**
 * Result from move_stock RPC
 */
export interface MoveStockResult {
    success: boolean;
    message?: string;
}

/**
 * Result from adjust_stock RPC
 */
export interface AdjustStockResult {
    success: boolean;
    message?: string;
}

// =============================================================================
// PROMISE.ALLSETTLED HELPER TYPE
// =============================================================================

/**
 * Helper to extract data from PromiseSettledResult
 */
export type SettledData<T> = {
    status: 'fulfilled';
    value: { data: T[] | null; error: unknown };
} | {
    status: 'rejected';
    reason: unknown;
};

/**
 * Safely extract array data from a settled promise result
 */
export function getSettledData<T>(
    result: PromiseSettledResult<{ data: T[] | null; error: unknown }>,
    fallback: T[] = []
): T[] {
    if (result.status === 'fulfilled' && result.value.data) {
        return result.value.data;
    }
    return fallback;
}
