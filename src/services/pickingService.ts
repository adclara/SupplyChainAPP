/**
 * Picking Service
 * @description Business logic for picking operations with wave optimization
 */

import { supabase } from '@/lib/supabase';
import { CompletePickResult, CompletePickWithShortageResult } from '@/types/database';

// =============================================================================
// TYPES
// =============================================================================

export interface ShipmentLine {
    id: string;
    shipment_id: string;
    product_id: string;
    location_id: string;
    quantity: number;
    status: 'pending' | 'in_progress' | 'picked';
    picked_at: string | null;
    picked_by: string | null;
}

export interface PickTask extends ShipmentLine {
    product: {
        sku: string;
        name: string;
    };
    location: {
        barcode: string;
        aisle: string;
        section?: number;
        level?: number;
    };
    shipment: {
        order_number: string;
        customer_name: string;
    };
}

// =============================================================================
// PICKING OPERATIONS
// =============================================================================

/**
 * Get available picks for user to discover
 * @param warehouseId - Warehouse ID
 * @returns List of available pick tasks
 */
export async function getAvailablePicks(warehouseId: string): Promise<PickTask[]> {
    try {
        const { data, error } = await supabase
            .from('shipment_lines')
            .select(`
                *,
                product:products(sku, name),
                location:locations(barcode, aisle),
                shipment:shipments!inner(
                    order_number,
                    customer_name,
                    wave_id,
                    waves!inner(warehouse_id, status)
                )
            `)
            .eq('status', 'pending')
            .eq('shipment.waves.warehouse_id', warehouseId)
            .eq('shipment.waves.status', 'picking')
            .limit(50);

        if (error) throw error;

        return (data || []) as PickTask[];
    } catch (error) {
        console.error('Failed to fetch available picks:', error);
        throw new Error('Failed to fetch available picks. Please try again.');
    }
}

/**
 * Get user's active picks
 * @param userId - User ID
 * @returns List of user's picks in progress
 */
export async function getMyActivePicks(userId: string): Promise<PickTask[]> {
    try {
        const { data, error } = await supabase
            .from('shipment_lines')
            .select(`
                *,
                product:products(sku, name),
                location:locations(barcode, aisle),
                shipment:shipments(order_number, customer_name)
            `)
            .eq('picked_by', userId)
            .eq('status', 'in_progress');

        if (error) throw error;

        return (data || []) as PickTask[];
    } catch (error) {
        console.error('Failed to fetch active picks:', error);
        throw new Error('Failed to fetch active picks. Please try again.');
    }
}

/**
 * Pull a pick task (assign to user)
 * @param lineId - Shipment line ID
 * @param userId - User ID
 * @returns Updated shipment line
 */
export async function pullPick(lineId: string, userId: string): Promise<ShipmentLine> {
    try {
        const { data, error } = await supabase
            .from('shipment_lines')
            .update({
                status: 'in_progress',
                picked_by: userId,
            })
            .eq('id', lineId)
            .eq('status', 'pending') // Only allow pulling if still pending
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Pick already assigned or not found');

        return data as ShipmentLine;
    } catch (error) {
        console.error('Failed to pull pick:', error);
        throw new Error('Failed to pull pick. Please try again.');
    }
}

/**
 * Complete a pick (scan confirmed) - ATOMIC via RPC
 * @param lineId - Shipment line ID
 * @param userId - User ID
 * @returns Updated shipment line
 */
export async function completePick(lineId: string, userId: string): Promise<ShipmentLine> {
    try {
        // Call PostgreSQL RPC function for atomic transaction
        const { data, error } = await supabase
            .rpc('complete_pick', {
                p_line_id: lineId,
                p_user_id: userId
            });

        if (error) throw error;

        const result = data as CompletePickResult | null;
        if (!result?.success) throw new Error('Pick completion failed');

        // Fetch updated line for return
        const { data: updatedLine, error: fetchError } = await supabase
            .from('shipment_lines')
            .select('*')
            .eq('id', lineId)
            .single();

        if (fetchError) throw fetchError;
        return updatedLine as ShipmentLine;
    } catch (error) {
        console.error('Failed to complete pick:', error);
        throw new Error('Failed to complete pick. Please try again.');
    }
}

/**
 * Release a pick (unassign from user)
 * @param lineId - Shipment line ID
 * @param userId - User ID
 */
export async function releasePick(lineId: string, userId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('shipment_lines')
            .update({
                status: 'pending',
                picked_by: null,
            })
            .eq('id', lineId)
            .eq('picked_by', userId)
            .eq('status', 'in_progress');

        if (error) throw error;
    } catch (error) {
        console.error('Failed to release pick:', error);
        throw new Error('Failed to release pick. Please try again.');
    }
}

// =============================================================================
// WAVE OPTIMIZATION
// =============================================================================

/**
 * Get optimized pick queue (sorted by zone/aisle)
 * @param warehouseId - Warehouse ID
 * @param waveId - Optional wave ID to filter
 * @returns Optimized pick queue
 */
export async function getOptimizedPickQueue(
    warehouseId: string,
    waveId?: string
): Promise<PickTask[]> {
    try {
        const { data, error } = await supabase
            .rpc('get_optimized_pick_queue', {
                p_warehouse_id: warehouseId,
                p_wave_id: waveId || null
            });

        if (error) throw error;
        return (data || []) as PickTask[];
    } catch (error) {
        console.error('Failed to get optimized pick queue:', error);
        throw new Error('Failed to get optimized pick queue');
    }
}

// =============================================================================
// SHORT PICK HANDLING
// =============================================================================

/**
 * Complete a pick with shortage support
 * @param lineId - Shipment line ID
 * @param userId - User ID
 * @param actualQuantity - Actual quantity picked
 * @param shortageReason - Reason for shortage (if any)
 * @returns Pick result with shortage info
 */
export async function completePickWithShortage(
    lineId: string,
    userId: string,
    actualQuantity: number,
    shortageReason?: string
): Promise<{
    success: boolean;
    actualQuantity: number;
    shortage: number;
    ticketId?: string;
}> {
    try {
        // Validate quantity
        if (actualQuantity < 0) {
            throw new Error('Quantity cannot be negative');
        }

        const { data, error } = await supabase
            .rpc('complete_pick_with_shortage', {
                p_line_id: lineId,
                p_user_id: userId,
                p_actual_quantity: actualQuantity,
                p_shortage_reason: shortageReason || null
            });

        if (error) throw error;

        const result = data as CompletePickWithShortageResult | null;
        if (!result?.success) throw new Error('Pick completion failed');

        return {
            success: result.success,
            actualQuantity: result.actual_quantity,
            shortage: result.shortage,
            ticketId: result.ticket_id ?? undefined
        };
    } catch (error) {
        console.error('Failed to complete pick with shortage:', error);
        throw new Error('Failed to complete pick');
    }
}

// NOTE: createMockWave has been removed from production code.
// For development seeding, use database seed scripts or Supabase dashboard.
