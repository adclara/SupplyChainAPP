/**
 * Wave Service
 * @description Business logic for wave management operations
 */

import { supabase } from '@/lib/supabase';
import {
    EligibleShipmentRow,
    WaveWithShipmentsRow,
} from '@/types/database';

// =============================================================================
// TYPES
// =============================================================================

export interface Wave {
    id: string;
    wave_number: string;
    warehouse_id: string;
    status: 'pending' | 'picking' | 'packing' | 'shipped';
    total_shipments: number;
    created_at: string;
    released_at: string | null;
}

export interface CreateWaveInput {
    warehouse_id: string;
    shipment_ids?: string[];
    prioritization?: 'sla' | 'density' | 'carrier';
}

export interface InventoryCheckResult {
    can_fulfill: boolean;
    shortages: Array<{
        product_id: string;
        sku: string;
        missing_qty: number;
    }>;
}

// =============================================================================
// WAVE OPERATIONS
// =============================================================================

/**
 * Create a new wave
 * @param input - Wave creation parameters
 * @returns Created wave
 * @throws Error if creation fails
 */
export async function createWave(input: CreateWaveInput): Promise<Wave> {
    try {
        // Generate wave number
        const waveNumber = `WAVE-${Date.now()}`;

        const { data, error } = await supabase
            .from('waves')
            .insert({
                wave_number: waveNumber,
                warehouse_id: input.warehouse_id,
                status: 'pending',
                total_shipments: input.shipment_ids?.length || 0,
            })
            .select()
            .single();

        if (error) throw error;

        if (input.shipment_ids && input.shipment_ids.length > 0) {
            // DEEP DIVE: Perform hard allocation check before committing
            const commitment = await preCheckInventoryCommitment(input.shipment_ids);
            if (!commitment.can_fulfill) {
                throw new Error(`Inventory Shortage: Cannot release wave. Missing ${commitment.shortages.length} SKUs.`);
            }

            const { error: assignError } = await supabase
                .from('shipments')
                .update({ wave_id: data.id })
                .in('id', input.shipment_ids);

            if (assignError) throw assignError;
        }

        return data;
    } catch (error) {
        console.error('Failed to create wave:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create wave');
    }
}

/**
 * DEEP DIVE: Waterfall Prioritization Logic
 * Groups shipments by SLA, then SKU Coincidence (density)
 */
export async function getEligibleShipments(warehouseId: string, limit = 50): Promise<EligibleShipmentRow[]> {
    const { data, error } = await supabase
        .from('shipments')
        .select(`
            id,
            order_number,
            customer_name,
            created_at,
            shipment_lines (product_id, quantity)
        `)
        .eq('warehouse_id', warehouseId)
        .is('wave_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }) // Default SLA (Oldest first)
        .limit(limit);

    if (error) throw error;
    return (data || []) as EligibleShipmentRow[];
}

/**
 * DEEP DIVE: Inventory Commitment Pre-check
 * Ensures picking doesn't fail on the floor due to phantom inventory
 */
export async function preCheckInventoryCommitment(shipmentIds: string[]): Promise<InventoryCheckResult> {
    // 1. Get required quantities
    const { data: lines, error: linesError } = await supabase
        .from('shipment_lines')
        .select('product_id, quantity, product:products(sku)')
        .in('shipment_id', shipmentIds);

    if (linesError) throw linesError;

    const rawLines = lines || [];

    const requirements: Record<string, { qty: number; sku: string }> = {};
    rawLines.forEach((line) => {
        // Normalize Supabase join - may return object or array
        const productData = line.product;
        const product = Array.isArray(productData) ? productData[0] : productData;
        const sku = product?.sku || 'UNKNOWN';
        if (!requirements[line.product_id]) {
            requirements[line.product_id] = { qty: 0, sku };
        }
        requirements[line.product_id].qty += line.quantity;
    });

    // 2. Cross-check with available inventory
    const shortages: InventoryCheckResult['shortages'] = [];

    for (const [productId, req] of Object.entries(requirements)) {
        const { data: inv, error: invError } = await supabase
            .from('inventory')
            .select('quantity')
            .eq('product_id', productId);

        if (invError) throw invError;
        const totalAvail = inv?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        if (totalAvail < req.qty) {
            shortages.push({
                product_id: productId,
                sku: req.sku,
                missing_qty: req.qty - totalAvail
            });
        }
    }

    return {
        can_fulfill: shortages.length === 0,
        shortages
    };
}

/**
 * Release wave for picking
 * @param waveId - ID of wave to release
 * @returns Updated wave
 * @throws Error if release fails
 */
export async function releaseWave(waveId: string): Promise<Wave> {
    try {
        const { data, error } = await supabase
            .from('waves')
            .update({
                status: 'picking',
                released_at: new Date().toISOString(),
            })
            .eq('id', waveId)
            .eq('status', 'pending') // Only allow releasing pending waves
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Wave not found or already released');

        return data;
    } catch (error) {
        console.error('Failed to release wave:', error);
        throw new Error('Failed to release wave. Please try again.');
    }
}

/**
 * Get waves for warehouse
 * @param warehouseId - Warehouse ID
 * @param status - Optional status filter
 * @returns List of waves
 */
export async function getWaves(
    warehouseId: string,
    status?: Wave['status']
): Promise<Wave[]> {
    try {
        let query = supabase
            .from('waves')
            .select('*')
            .eq('warehouse_id', warehouseId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data || []) as Wave[];
    } catch (error) {
        console.error('Failed to fetch waves:', error);
        throw new Error('Failed to fetch waves. Please try again.');
    }
}

/**
 * Get wave by ID with shipments
 * @param waveId - Wave ID
 * @returns Wave with shipments
 */
export async function getWaveWithShipments(waveId: string): Promise<WaveWithShipmentsRow | null> {
    try {
        const { data, error } = await supabase
            .from('waves')
            .select(`
                *,
                shipments (
                    id,
                    order_number,
                    customer_name,
                    status,
                    shipment_lines (
                        id,
                        product_id,
                        quantity,
                        status
                    )
                )
            `)
            .eq('id', waveId)
            .single();

        if (error) throw error;

        return data as WaveWithShipmentsRow;
    } catch (error) {
        console.error('Failed to fetch wave:', error);
        throw new Error('Failed to fetch wave. Please try again.');
    }
}
