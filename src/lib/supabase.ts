/**
 * Supabase Client Configuration
 * @description Creates and exports Supabase client instances for browser and server usage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Get a required environment variable with proper error handling
 * @param name - Environment variable name
 * @returns The environment variable value
 * @throws Error in production if variable is missing
 */
function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        // In production, fail fast - don't allow placeholder values
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                `Missing required environment variable: ${name}. ` +
                `Please set this in your environment before deploying.`
            );
        }

        // In development, warn and use placeholder for local testing
        console.warn(
            `[DEV] Missing environment variable: ${name}. ` +
            `Using placeholder value. Set this before deploying.`
        );

        // Return appropriate placeholder based on variable type
        if (name.includes('URL')) {
            return 'https://placeholder.supabase.co';
        }
        return 'placeholder-anon-key';
    }

    return value;
}

const supabaseUrl = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

/**
 * Browser Supabase client for client-side operations
 * Uses the anonymous key with RLS policies
 */
export const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
);

/**
 * Creates a Supabase client for server-side operations
 * @param serviceRoleKey - Optional service role key for admin operations
 * @returns Supabase client instance
 */
export function createServerClient(serviceRoleKey?: string): SupabaseClient {
    const key = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!key && process.env.NODE_ENV === 'production') {
        throw new Error(
            'Missing SUPABASE_SERVICE_ROLE_KEY for server-side operations. ' +
            'This is required for admin operations in production.'
        );
    }

    return createClient(
        supabaseUrl,
        key || supabaseAnonKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    );
}

/**
 * Get the current user session
 * @returns User session or null
 */
export async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        return null;
    }

    return session;
}

/**
 * Get the current authenticated user
 * @returns User data or null
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error.message);
        return null;
    }

    return user;
}

export default supabase;
