/**
 * Supabase Connection Test Script
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔌 SUPABASE CONNECTION TEST\n');
console.log('='.repeat(50));

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
    process.exit(1);
}

console.log('📡 Supabase URL:', supabaseUrl);
console.log('🔑 API Key:', supabaseKey.substring(0, 20) + '...');
console.log('='.repeat(50));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    // Required tables for the WMS app
    const requiredTables = [
        'users', 'warehouses', 'products', 'categories', 'locations',
        'inventory', 'transactions', 'inbound_shipments', 'inbound_lines',
        'putaway_tasks', 'waves', 'shipments', 'shipment_lines',
        'shipment_hand_off_log', 'count_tasks', 'problem_tickets'
    ];

    console.log('\n📋 Checking required tables:\n');

    const results: { table: string; exists: boolean; count?: number }[] = [];

    for (const table of requiredTables) {
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error && error.code === '42P01') {
                // Table doesn't exist
                results.push({ table, exists: false });
                console.log(`   ❌ ${table.padEnd(25)} - NOT FOUND`);
            } else if (error) {
                results.push({ table, exists: false });
                console.log(`   ⚠️  ${table.padEnd(25)} - Error: ${error.message}`);
            } else {
                results.push({ table, exists: true, count: count ?? 0 });
                console.log(`   ✅ ${table.padEnd(25)} - ${count ?? 0} rows`);
            }
        } catch (e: any) {
            results.push({ table, exists: false });
            console.log(`   ❌ ${table.padEnd(25)} - ${e.message}`);
        }
    }

    // Summary
    const existing = results.filter(r => r.exists);
    const missing = results.filter(r => !r.exists);

    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`   ✅ Existing tables: ${existing.length}/${requiredTables.length}`);
    console.log(`   ❌ Missing tables:  ${missing.length}/${requiredTables.length}`);

    if (missing.length > 0) {
        console.log('\n⚠️  Missing tables:', missing.map(m => m.table).join(', '));
        console.log('\n📝 To create missing tables:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run the contents of: supabase/schema.sql');
    } else {
        console.log('\n🎉 All required tables exist!');
    }

    // Test auth config
    console.log('\n🔐 Testing auth configuration...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
        console.log('   ❌ Auth error:', authError.message);
    } else {
        console.log('   ✅ Auth is configured correctly');
    }

    console.log('\n' + '='.repeat(50) + '\n');
}

testConnection().catch(console.error);
