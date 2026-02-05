/**
 * Dashboard Service
 * @description Business logic for dashboard analytics and KPIs
 */

import { supabase } from '@/lib/supabase';
import {
    InboundShipmentStatusRow,
    PutawayTaskStatusRow,
    WaveStatusRow,
    ShipmentStatusRow,
    InventoryQuantityRow,
    LocationUnitsRow,
    ProblemTicketRow,
    TransactionActivityRow,
    getSettledData,
} from '@/types/database';

export interface DashboardStats {
    inbound: {
        receiving: number;
        scheduled: number;
        putaway_pending: number;
    };
    outbound: {
        waves_active: number;
        picking_active: number;
        packing_pending: number;
        shipped_today: number;
    };
    inventory: {
        total_skus: number;
        total_units: number;
        locations_used: number;
    };
    problems: {
        open: number;
        critical: number;
    };
}

export interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user_name?: string;
}

/**
 * Get dashboard statistics with resilient error handling
 * Uses Promise.allSettled to ensure partial data is returned even if some queries fail
 * @param warehouseId - Warehouse ID
 * @returns Dashboard stats
 */
export async function getDashboardStats(warehouseId: string): Promise<DashboardStats> {
    // Use Promise.allSettled for resilience - dashboard shows partial data if some queries fail
    const results = await Promise.allSettled([
        supabase.from('inbound_shipments').select('status').eq('warehouse_id', warehouseId),
        supabase.from('putaway_tasks').select('status'),
        supabase.from('waves').select('status').eq('warehouse_id', warehouseId),
        supabase.from('shipments').select('status, shipped_at'),
        supabase.from('inventory').select('quantity'),
        supabase.from('locations').select('id, current_units').eq('warehouse_id', warehouseId),
        supabase.from('problem_tickets').select('status, priority').eq('warehouse_id', warehouseId),
    ]);

    // Extract data with type safety, using empty arrays for failed queries
    const inboundData = getSettledData<InboundShipmentStatusRow>(results[0]);
    const putawayData = getSettledData<PutawayTaskStatusRow>(results[1]);
    const wavesData = getSettledData<WaveStatusRow>(results[2]);
    const shipmentsData = getSettledData<ShipmentStatusRow>(results[3]);
    const inventoryData = getSettledData<InventoryQuantityRow>(results[4]);
    const locationsData = getSettledData<LocationUnitsRow>(results[5]);
    const problemsData = getSettledData<ProblemTicketRow>(results[6]);

    // Log any failures for debugging (but don't throw)
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`Dashboard query ${index} failed:`, result.reason);
        } else if (result.value.error) {
            console.error(`Dashboard query ${index} error:`, result.value.error);
        }
    });

    // Calculate inbound stats
    const inbound = {
        receiving: inboundData.filter((i) => i.status === 'receiving').length,
        scheduled: inboundData.filter((i) => i.status === 'scheduled').length,
        putaway_pending: putawayData.filter((p) => p.status === 'pending').length,
    };

    // Calculate outbound stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const outbound = {
        waves_active: wavesData.filter((w) => ['released', 'picking'].includes(w.status)).length,
        picking_active: shipmentsData.filter((s) => s.status === 'picking').length,
        packing_pending: shipmentsData.filter((s) => s.status === 'picked').length,
        shipped_today: shipmentsData.filter((s) =>
            s.status === 'shipped' &&
            s.shipped_at &&
            new Date(s.shipped_at) >= today
        ).length,
    };

    // Calculate inventory stats
    const inventory = {
        total_skus: inventoryData.length,
        total_units: inventoryData.reduce((sum, inv) => sum + (inv.quantity || 0), 0),
        locations_used: locationsData.filter((l) => (l.current_units || 0) > 0).length,
    };

    // Calculate problem stats
    const problems = {
        open: problemsData.filter((p) => ['open', 'in_progress'].includes(p.status)).length,
        critical: problemsData.filter((p) => p.priority === 'critical' && p.status !== 'resolved').length,
    };

    return { inbound, outbound, inventory, problems };
}

/**
 * Get recent activity for dashboard
 * @param warehouseId - warehouse ID
 * @param limit - Number of activities to return
 * @returns List of recent activities
 */
export async function getRecentActivity(
    warehouseId: string,
    limit: number = 10
): Promise<RecentActivity[]> {
    try {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                id,
                transaction_type,
                notes,
                created_at,
                user:users_public(full_name)
            `)
            .eq('warehouse_id', warehouseId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        // Type the data properly
        const activities = (data || []) as TransactionActivityRow[];

        return activities.map((activity) => ({
            id: activity.id,
            type: activity.transaction_type,
            description: activity.notes || `${activity.transaction_type} transaction`,
            timestamp: activity.created_at,
            user_name: activity.user?.[0]?.full_name ?? undefined,
        }));
    } catch (error) {
        console.error('Failed to fetch recent activity:', error);
        return [];
    }
}
