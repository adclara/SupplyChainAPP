/**
 * Inventory Service
 * @description Business logic for inventory management operations
 */

import { supabase } from '@/lib/supabase';
import { Inventory, Transaction } from '@/types';
import { TransactionHistoryRow } from '@/types/database';

// =============================================================================
// TRANSACTION LOGGING
// =============================================================================

/**
 * Log a transaction with proper error handling
 * Returns result object instead of silently failing
 */
export async function logTransaction(
    params: Partial<Transaction>
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('transactions')
            .insert({
                ...params,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Failed to log transaction:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to log transaction:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

// =============================================================================
// STOCK OPERATIONS
// =============================================================================

/**
 * Add stock to inventory (e.g. from Receiving)
 */
export async function addStock(
    warehouseId: string,
    productId: string,
    locationId: string,
    quantity: number,
    userId: string,
    referenceId?: string
): Promise<Inventory> {
    try {
        // Validate quantity
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        // 1. Check if inventory record exists for this product + location
        const { data: existing } = await supabase
            .from('inventory')
            .select('*')
            .eq('warehouse_id', warehouseId)
            .eq('product_id', productId)
            .eq('location_id', locationId)
            .single();

        let result: Inventory;

        if (existing) {
            // Update existing
            const newQty = existing.quantity + quantity;
            const { data, error } = await supabase
                .from('inventory')
                .update({ quantity: newQty, updated_at: new Date().toISOString() })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // Create new
            const { data, error } = await supabase
                .from('inventory')
                .insert({
                    warehouse_id: warehouseId,
                    product_id: productId,
                    location_id: locationId,
                    quantity: quantity,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        // 2. Log Transaction (check result but don't fail the main operation)
        const logResult = await logTransaction({
            warehouse_id: warehouseId,
            transaction_type: 'receive',
            user_id: userId,
            product_id: productId,
            location_id_to: locationId,
            quantity: quantity,
            reference_id: referenceId,
            status: 'completed'
        });

        if (!logResult.success) {
            console.warn('Stock added but transaction log failed:', logResult.error);
        }

        return result;

    } catch (error) {
        console.error('Failed to add stock:', error);
        throw new Error('Failed to add stock');
    }
}

// =============================================================================
// INVENTORY QUERIES
// =============================================================================

/**
 * Get full inventory with optional filters
 */
export async function getInventory(
    warehouseId: string,
    filters?: {
        search?: string;
        location_type?: string;
        low_stock?: boolean;
    }
): Promise<Inventory[]> {
    let query = supabase
        .from('inventory')
        .select(`
            *,
            product:products(*),
            location:locations(*)
        `)
        .eq('warehouse_id', warehouseId)
        .gt('quantity', 0); // Only show positive stock by default

    // Location Type Filter
    if (filters?.location_type) {
        query = query.eq('location.location_type', filters.location_type);
    }

    const { data, error } = await query;
    if (error) throw error;

    let result = (data || []) as Inventory[];

    // Client-side filtering for Search (Supabase join search is tricky without RPC)
    if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(item =>
            item.product?.name.toLowerCase().includes(searchLower) ||
            item.product?.sku.toLowerCase().includes(searchLower) ||
            item.location?.barcode.toLowerCase().includes(searchLower)
        );
    }

    return result;
}

/**
 * Get Inventory Stats for Dashboard
 */
export async function getInventoryStats(warehouseId: string) {
    const { data: inv, error } = await supabase
        .from('inventory')
        .select('quantity, product:products(id, min_stock_level)')
        .eq('warehouse_id', warehouseId);

    if (error) throw error;

    const inventoryRows = inv || [];

    const totalUnits = inventoryRows.reduce((sum, item) => sum + (item.quantity || 0), 0);

    // Calculate Low Stock - handle Supabase join returning object or array
    const productMap = new Map<string, { qty: number, min: number }>();

    inventoryRows.forEach(item => {
        // Normalize product data - Supabase may return object or array
        const productData = item.product;
        const product = Array.isArray(productData) ? productData[0] : productData;
        const productId = product?.id;
        if (!productId) return;

        const minStock = product?.min_stock_level ?? 10; // Default min 10
        const current = productMap.get(productId) || { qty: 0, min: minStock };
        current.qty += item.quantity;
        productMap.set(productId, current);
    });

    let lowStockCount = 0;
    productMap.forEach((val) => {
        if (val.qty <= val.min) lowStockCount++;
    });

    return {
        totalUnits,
        distinctSkus: productMap.size,
        lowStockCount,
        occupiedLocations: inventoryRows.length
    };
}

/**
 * Get category distribution
 */
export async function getCategoryStats(warehouseId: string) {
    const { data: inv, error } = await supabase
        .from('inventory')
        .select(`
            quantity,
            product:products(
                category_id,
                category:categories(name)
            )
        `)
        .eq('warehouse_id', warehouseId);

    if (error) throw error;

    const inventoryRows = inv || [];

    const distribution = new Map<string, number>();
    let total = 0;

    inventoryRows.forEach(item => {
        // Normalize nested joins - Supabase may return object or array
        const productData = item.product;
        const product = Array.isArray(productData) ? productData[0] : productData;
        const categoryData = product?.category;
        const category = Array.isArray(categoryData) ? categoryData[0] : categoryData;

        const catName = category?.name || 'Uncategorized';
        distribution.set(catName, (distribution.get(catName) || 0) + item.quantity);
        total += item.quantity;
    });

    // Convert to percentage array
    return Array.from(distribution.entries())
        .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5
}

/**
 * Get recent transactions (optionally by product)
 */
export async function getTransactionHistory(
    warehouseId: string,
    filters?: {
        limit?: number;
        productId?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    }
): Promise<TransactionHistoryRow[]> {
    let query = supabase
        .from('transactions')
        .select(`
            *,
            product:products(name, sku),
            location_from:locations!location_id_from(barcode),
            location_to:locations!location_id_to(barcode),
            user:users_public(full_name)
        `) // Fetch joined data for display
        .eq('warehouse_id', warehouseId)
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

    if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
    }
    if (filters?.type && filters.type !== 'all') {
        query = query.eq('transaction_type', filters.type);
    }
    if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TransactionHistoryRow[];
}

/**
 * Get inventory by Location
 */
export async function getInventoryByLocation(locationId: string): Promise<Inventory[]> {
    const { data, error } = await supabase
        .from('inventory')
        .select('*, product:products(*)')
        .eq('location_id', locationId);

    if (error) throw error;
    return (data || []) as Inventory[];
}

// =============================================================================
// LOCATION LOOKUPS
// =============================================================================

/**
 * Find or create a default RECEIVING location
 */
export async function getReceivingLocation(warehouseId: string): Promise<string> {
    // Try to find a location with type 'dock' or barcode 'RECEIVING'
    const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('warehouse_id', warehouseId)
        .eq('barcode', 'RECEIVING')
        .single();

    if (data) return data.id;

    // If not found, try any dock
    const { data: dock } = await supabase
        .from('locations')
        .select('id')
        .eq('warehouse_id', warehouseId)
        .eq('location_type', 'dock')
        .limit(1)
        .single();

    if (dock) return dock.id;

    throw new Error('No RECEIVING or Dock location found');
}

/**
 * Find or create a default QUARANTINE/PROBLEM location
 */
export async function getQuarantineLocation(warehouseId: string): Promise<string> {
    // Try to find a location with type 'problem' or barcode 'QUARANTINE'
    const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('warehouse_id', warehouseId)
        .eq('barcode', 'QUARANTINE')
        .single();

    if (data) return data.id;

    // If not found, try any 'problem' location
    const { data: problemLoc } = await supabase
        .from('locations')
        .select('id')
        .eq('warehouse_id', warehouseId)
        .eq('location_type', 'problem')
        .limit(1)
        .single();

    if (problemLoc) return problemLoc.id;

    throw new Error('No QUARANTINE or Problem location found');
}

// =============================================================================
// STOCK MOVEMENT (ATOMIC OPERATIONS)
// =============================================================================

/**
 * Move stock from one location to another - ATOMIC via RPC
 */
export async function moveStock(
    warehouseId: string,
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    userId: string
): Promise<void> {
    try {
        // Validate quantity
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        const { data, error } = await supabase
            .rpc('move_stock', {
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_from_location_id: fromLocationId,
                p_to_location_id: toLocationId,
                p_quantity: quantity,
                p_user_id: userId
            });

        if (error) throw error;

        const result = data as { success: boolean } | null;
        if (!result?.success) throw new Error('Move operation failed');
    } catch (error) {
        console.error('Failed to move stock:', error);
        throw error;
    }
}

/**
 * Adjust stock quantity (Cycle Count) - ATOMIC via RPC
 */
export async function adjustStock(
    warehouseId: string,
    productId: string,
    locationId: string,
    deltaQuantity: number,
    userId: string,
    reason: string
): Promise<void> {
    try {
        const { data, error } = await supabase
            .rpc('adjust_stock', {
                p_warehouse_id: warehouseId,
                p_product_id: productId,
                p_location_id: locationId,
                p_delta_quantity: deltaQuantity,
                p_user_id: userId,
                p_reason: reason
            });

        if (error) throw error;

        const result = data as { success: boolean } | null;
        if (!result?.success) throw new Error('Adjustment operation failed');
    } catch (error) {
        console.error('Failed to adjust stock:', error);
        throw error;
    }
}
