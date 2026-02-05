/**
 * Packing Service
 * @description Business logic for packing operations
 */

import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface Shipment {
    id: string;
    order_number: string;
    customer_name: string;
    status: 'pending' | 'picking' | 'packed' | 'shipped';
    total_items: number;
    wave_id: string | null;
}

export interface PackableShipment extends Shipment {
    shipment_lines: Array<{
        id: string;
        product_id: string;
        quantity: number;
        status: string;
        product: {
            sku: string;
            name: string;
        };
    }>;
}

// =============================================================================
// PACKING OPERATIONS
// =============================================================================

/**
 * Get shipments ready for packing
 * @param warehouseId - Warehouse ID
 * @returns List of shipments with all items picked
 */
export async function getPackableShipments(warehouseId: string): Promise<PackableShipment[]> {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .select(`
                *,
                shipment_lines!inner(
                    id,
                    product_id,
                    quantity,
                    status,
                    product:products(sku, name)
                )
            `)
            .eq('warehouse_id', warehouseId)
            .eq('status', 'picking')
            .not('shipment_lines.status', 'in', '(pending,in_progress)'); // All lines must be picked

        if (error) throw error;

        return (data || []) as PackableShipment[];
    } catch (error) {
        console.error('Failed to fetch packable shipments:', error);
        throw new Error('Failed to fetch packable shipments. Please try again.');
    }
}

/**
 * Start packing a shipment
 * @param shipmentId - Shipment ID
 * @returns Updated shipment
 */
export async function startPacking(shipmentId: string): Promise<Shipment> {
    try {
        const { data, error } = await supabase
            .from('shipments')
            .update({ status: 'packed' })
            .eq('id', shipmentId)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error('Shipment not found');

        return data as Shipment;
    } catch (error) {
        console.error('Failed to start packing:', error);
        throw new Error('Failed to start packing. Please try again.');
    }
}

/**
 * Generate shipping label
 * @param shipmentId - Shipment ID
 * @param carrier - Carrier name
 * @returns Label URL
 */
export async function generateLabel(
    shipmentId: string,
    carrier: string
): Promise<string> {
    try {
        // TODO: In production, this should call actual carrier API
        // For now, return placeholder label URL (marked as mock)
        const labelUrl = `https://labels.example.com/${shipmentId}-${carrier}.pdf`;

        const { error } = await supabase
            .from('shipments')
            .update({
                carrier,
                label_generated_at: new Date().toISOString(),
            })
            .eq('id', shipmentId);

        if (error) throw error;

        return labelUrl;
    } catch (error) {
        console.error('Failed to generate label:', error);
        throw new Error('Failed to generate label. Please try again.');
    }
}

// =============================================================================
// DEEP DIVE: CARTONIZATION & PACKING GUIDES
// =============================================================================

export interface BoxSize {
    label: string;
    length: number;
    width: number;
    height: number;
    max_weight: number;
}

const PREDEFINED_BOXES: BoxSize[] = [
    { label: 'SMALL', length: 15, width: 15, height: 10, max_weight: 5 },
    { label: 'MEDIUM', length: 30, width: 25, height: 20, max_weight: 15 },
    { label: 'LARGE', length: 50, width: 40, height: 30, max_weight: 30 },
];

/**
 * DEEP DIVE: Suggest Optimal Carton
 * Uses volumetric calculation to recommend the most cost-effective box
 */
export async function suggestCarton(shipmentId: string): Promise<BoxSize | null> {
    try {
        const { data: lines, error } = await supabase
            .from('shipment_lines')
            .select('quantity, product:products(dimensions_cm, weight_kg)')
            .eq('shipment_id', shipmentId);

        if (error || !lines) throw error;

        // Calculate total volume and weight
        let totalVolume = 0;
        let totalWeight = 0;

        lines.forEach((line) => {
            // Normalize Supabase join - may return object or array
            const productData = line.product;
            const product = Array.isArray(productData) ? productData[0] : productData;
            const dims = product?.dimensions_cm;

            // Handle both naming conventions for dimensions
            const length = dims?.length ?? dims?.l ?? 5;
            const width = dims?.width ?? dims?.w ?? 5;
            const height = dims?.height ?? dims?.h ?? 5;

            const itemVolume = length * width * height;
            totalVolume += itemVolume * line.quantity;
            totalWeight += (product?.weight_kg || 0.1) * line.quantity;
        });

        // Add 20% "Void Fill" buffer (Industry Standard)
        const requiredVolume = totalVolume * 1.2;

        // Find smallest box that fits volume and weight
        for (const box of PREDEFINED_BOXES) {
            const boxVolume = box.length * box.width * box.height;
            if (boxVolume >= requiredVolume && box.max_weight >= totalWeight) {
                return box;
            }
        }

        // Default to LARGE if no fit (with warning)
        console.warn(`No suitable box found for shipment ${shipmentId}. Defaulting to LARGE.`);
        return PREDEFINED_BOXES[2];
    } catch (error) {
        console.error('Cartonization error:', error);
        return null;
    }
}
