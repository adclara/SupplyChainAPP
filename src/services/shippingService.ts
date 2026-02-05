import { createServerClient } from '@/lib/supabase';
import { PostgrestResponse } from '@supabase/supabase-js';

export interface Shipment {
    id: string;
    order_number: string;
    customer_name: string;
    status: string;
    carrier?: string;
    tracking_number?: string;
    wave_id: string;
    shipment_lines: {
        id: string;
        product: {
            id: string;
            name: string;
            sku: string;
            weight: number;
        };
        quantity: number;
    }[];
}

export interface ShipmentHandOffLog {
    id: string;
    shipment_id: string;
    carrier: string;
    tracking_number: string;
    shipped_by: string;
    shipped_at: string;
    weight_kg: number;
    shipment: {
        order_number: string;
        customer_name: string;
    };
    user: {
        full_name: string;
    };
}

/**
 * Get all packed shipments for a specific wave
 */
export async function getPackedShipmentsByWave(waveId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('shipments')
        .select(`
      id,
      order_number,
      customer_name,
      status,
      carrier,
      tracking_number,
      wave_id,
      shipment_lines (
        id,
        quantity,
        product:products (
          id,
          name,
          sku,
          weight
        )
      )
    `)
        .eq('wave_id', waveId)
        .eq('status', 'packed');

    if (error) throw error;
    return data as any[];
}

/**
 * Get hand-off log for a specific wave
 */
export async function getShipmentHandOffLog(waveId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('shipment_hand_off_log')
        .select(`
      *,
      shipment:shipment_id (
        order_number,
        customer_name,
        wave_id
      ),
      user:shipped_by (
        full_name
      )
    `)
        .eq('shipment.wave_id', waveId)
        .order('shipped_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Update shipment status to "shipped" and create hand-off log entry
 */
export async function confirmShipment(shipmentId: string, carrier: string, trackingNumber: string, userId: string, weightKg: number) {
    const supabase = createServerClient();

    const { data: shipment, error: updateError } = await supabase
        .from('shipments')
        .update({
            status: 'shipped',
            carrier,
            tracking_number: trackingNumber
        })
        .eq('id', shipmentId)
        .select()
        .single();

    if (updateError) throw updateError;

    const { error: logError } = await supabase
        .from('shipment_hand_off_log')
        .insert({
            shipment_id: shipmentId,
            carrier,
            tracking_number: trackingNumber,
            shipped_by: userId,
            weight_kg: weightKg
        });

    if (logError) throw logError;

    return shipment;
}

/**
 * Get all waves with status "packed" or "picking" (shippable waves)
 */
export async function getPackedWaves() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('waves')
        .select('id, wave_number, status, created_at')
        .eq('status', 'packing') // Or whenever they are ready for shipping
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
