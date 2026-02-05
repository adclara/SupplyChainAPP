/**
 * User Management Service
 * @description Logic for managing WMS users and roles
 */

import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@/types';

export interface CreateUserInput {
    email: string;
    full_name: string;
    role: UserRole;
    warehouse_id: string;
    password?: string; // Optional if using invitation flow, but for now required for direct creation
}

/**
 * Get all users for a warehouse
 * @param warehouseId - Warehouse ID
 * @returns List of users
 */
export async function getUsers(warehouseId: string): Promise<User[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('warehouse_id', warehouseId)
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Failed to fetch users:', error);
        throw new Error('Failed to fetch users');
    }
}

/**
 * Create a new user (Admin only operation)
 * @description In a real scenario, this would use Supabase Admin Auth API via an Edge Function
 * For this MVP, we'll perform a dual insert or assume admin privileges.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
    try {
        // 1. Create Auth User (Note: This normally requires Service Role Key on backend)
        // Since we are frontend-side, we simulate or use a specific invite flow.
        // For the purposes of the MVP mock-up:
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: input.email,
            password: input.password || 'TemporaryPassword123!',
            options: {
                data: {
                    full_name: input.full_name,
                    role: input.role,
                    warehouse_id: input.warehouse_id
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create auth user');

        // 2. Insert into users table (Trigger usually handles this, but let's be explicit)
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: input.email,
                full_name: input.full_name,
                role: input.role,
                warehouse_id: input.warehouse_id,
                is_active: true
            })
            .select()
            .single();

        if (userError) throw userError;
        return userData;
    } catch (error) {
        console.error('Failed to create user:', error);
        throw new Error('Failed to create user. Please check permissions.');
    }
}

/**
 * Update user role or status
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Failed to update user:', error);
        throw new Error('Failed to update user');
    }
}
