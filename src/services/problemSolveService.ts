/**
 * Problem Solve Service
 * @description Business logic for exception handling and problem tickets
 */

import { supabase } from '@/lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface ProblemTicket {
    id: string;
    warehouse_id: string;
    ticket_type: 'short_pick' | 'damage' | 'missing' | 'quality';
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';

    reference_type?: string;
    reference_id?: string;

    product_id?: string;
    location_id?: string;
    expected_quantity?: number;
    actual_quantity?: number;
    shortage_quantity?: number;

    assigned_to?: string;
    assigned_at?: string;

    resolved_by?: string;
    resolved_at?: string;
    resolution_notes?: string;

    description?: string;
    notes?: string;
    created_by: string;
    created_at: string;
    updated_at: string;

    // Joined data
    product?: {
        name: string;
        sku: string;
    };
    location?: {
        barcode: string;
    };
    assigned_user?: {
        full_name: string;
    };
}

// =============================================================================
// TICKET OPERATIONS
// =============================================================================

/**
 * Get all problem tickets for a warehouse
 */
export async function getProblemTickets(
    warehouseId: string,
    filters?: {
        status?: string;
        type?: string;
        assignedTo?: string;
    }
): Promise<ProblemTicket[]> {
    try {
        let query = supabase
            .from('problem_tickets')
            .select(`
                *,
                product:products(name, sku),
                location:locations(barcode),
                assigned_user:users_public!assigned_to(full_name)
            `)
            .eq('warehouse_id', warehouseId)
            .order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
        if (filters?.type && filters.type !== 'all') {
            query = query.eq('ticket_type', filters.type);
        }
        if (filters?.assignedTo) {
            query = query.eq('assigned_to', filters.assignedTo);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to fetch problem tickets:', error);
        throw new Error('Failed to fetch problem tickets');
    }
}

/**
 * Create a problem ticket
 */
export async function createProblemTicket(
    ticket: Omit<ProblemTicket, 'id' | 'created_at' | 'updated_at'>
): Promise<ProblemTicket> {
    try {
        const { data, error } = await supabase
            .from('problem_tickets')
            .insert({
                ...ticket,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Failed to create problem ticket:', error);
        throw new Error('Failed to create problem ticket');
    }
}

/**
 * Assign a ticket to a user
 */
export async function assignTicket(
    ticketId: string,
    userId: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('problem_tickets')
            .update({
                assigned_to: userId,
                assigned_at: new Date().toISOString(),
                status: 'in_progress',
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);

        if (error) throw error;
    } catch (error) {
        console.error('Failed to assign ticket:', error);
        throw new Error('Failed to assign ticket');
    }
}

/**
 * Resolve a ticket
 */
export async function resolveTicket(
    ticketId: string,
    userId: string,
    resolutionNotes: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('problem_tickets')
            .update({
                status: 'resolved',
                resolved_by: userId,
                resolved_at: new Date().toISOString(),
                resolution_notes: resolutionNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', ticketId);

        if (error) throw error;
    } catch (error) {
        console.error('Failed to resolve ticket:', error);
        throw new Error('Failed to resolve ticket');
    }
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(warehouseId: string) {
    try {
        const { data, error } = await supabase
            .from('problem_tickets')
            .select('status, ticket_type, priority')
            .eq('warehouse_id', warehouseId);

        if (error) throw error;

        const stats = {
            total: data.length,
            open: data.filter(t => t.status === 'open').length,
            in_progress: data.filter(t => t.status === 'in_progress').length,
            resolved: data.filter(t => t.status === 'resolved').length,
            by_type: {
                short_pick: data.filter(t => t.ticket_type === 'short_pick').length,
                damage: data.filter(t => t.ticket_type === 'damage').length,
                missing: data.filter(t => t.ticket_type === 'missing').length,
                quality: data.filter(t => t.ticket_type === 'quality').length,
            },
            by_priority: {
                critical: data.filter(t => t.priority === 'critical').length,
                high: data.filter(t => t.priority === 'high').length,
                medium: data.filter(t => t.priority === 'medium').length,
                low: data.filter(t => t.priority === 'low').length,
            }
        };

        return stats;
    } catch (error) {
        console.error('Failed to get ticket stats:', error);
        throw new Error('Failed to get ticket stats');
    }
}
