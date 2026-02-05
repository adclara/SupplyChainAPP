-- =============================================================================
-- NEXUS WMS DATABASE SCHEMA
-- =============================================================================
-- This file documents all tables required by the Nexus WMS application.
-- Run this in Supabase SQL Editor to create the necessary structure.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
    warehouse_id UUID REFERENCES warehouses(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'USA',
    timezone TEXT DEFAULT 'America/New_York',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (product categories)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    unit_of_measure TEXT DEFAULT 'EA',
    weight_kg DECIMAL(10,3),
    dimensions_cm JSONB, -- {l: number, w: number, h: number}
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    reorder_point INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (storage locations in warehouse)
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    barcode TEXT UNIQUE NOT NULL,
    location_type TEXT NOT NULL CHECK (location_type IN ('rack', 'floor', 'staging', 'dock', 'shipping', 'receiving', 'qa', 'damaged')),
    zone TEXT,
    aisle TEXT,
    rack TEXT,
    level TEXT,
    position TEXT,
    max_units INTEGER,
    current_units INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INVENTORY TABLES
-- =============================================================================

-- Inventory (current stock levels)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    product_id UUID NOT NULL REFERENCES products(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    lot_number TEXT,
    expiry_date DATE,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'damaged', 'on_hold', 'quarantine')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id, location_id, lot_number)
);

-- Transactions (all inventory movements)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receive', 'putaway', 'pick', 'pack', 'ship', 'move', 'adjust', 'count', 'return')),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    location_id_from UUID REFERENCES locations(id),
    location_id_to UUID REFERENCES locations(id),
    quantity INTEGER,
    reference_id UUID, -- links to shipment, wave, etc.
    notes TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INBOUND TABLES
-- =============================================================================

-- Inbound Shipments (ASNs)
CREATE TABLE IF NOT EXISTS inbound_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    po_number TEXT,
    shipment_number TEXT UNIQUE NOT NULL,
    supplier_name TEXT,
    carrier TEXT,
    tracking_number TEXT,
    dock_door TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'arrived', 'receiving', 'completed', 'cancelled')),
    expected_arrival DATE,
    actual_arrival TIMESTAMPTZ,
    received_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound Lines (items in inbound shipment)
CREATE TABLE IF NOT EXISTS inbound_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inbound_shipment_id UUID NOT NULL REFERENCES inbound_shipments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    expected_quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    damaged_quantity INTEGER DEFAULT 0,
    lot_number TEXT,
    expiry_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'complete', 'over_received')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Putaway Tasks
CREATE TABLE IF NOT EXISTS putaway_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    inbound_line_id UUID REFERENCES inbound_lines(id),
    product_id UUID NOT NULL REFERENCES products(id),
    from_location_id UUID NOT NULL REFERENCES locations(id),
    to_location_id UUID NOT NULL REFERENCES locations(id),
    quantity INTEGER NOT NULL,
    assigned_to UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority INTEGER DEFAULT 5,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- OUTBOUND TABLES
-- =============================================================================

-- Waves (batch of shipments for picking)
CREATE TABLE IF NOT EXISTS waves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    wave_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'released', 'picking', 'completed', 'cancelled')),
    total_shipments INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    released_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments (outbound orders)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    wave_id UUID REFERENCES waves(id),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT,
    customer_address TEXT,
    carrier TEXT,
    service_level TEXT,
    tracking_number TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'allocated', 'picking', 'picked', 'packing', 'packed', 'shipped', 'cancelled')),
    ship_by_date DATE,
    shipped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Lines (items in shipment)
CREATE TABLE IF NOT EXISTS shipment_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    picked_quantity INTEGER DEFAULT 0,
    packed_quantity INTEGER DEFAULT 0,
    pick_location_id UUID REFERENCES locations(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'allocated', 'picking', 'picked', 'packed', 'short')),
    picked_by UUID REFERENCES users(id),
    picked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Hand Off Log (carrier handoff tracking)
CREATE TABLE IF NOT EXISTS shipment_hand_off_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id),
    wave_id UUID REFERENCES waves(id),
    carrier TEXT NOT NULL,
    tracking_number TEXT,
    handed_off_by UUID REFERENCES users(id),
    handed_off_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ICQA TABLES (Inventory Control & Quality Assurance)
-- =============================================================================

-- Count Tasks (cycle counts)
CREATE TABLE IF NOT EXISTS count_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    product_id UUID REFERENCES products(id),
    expected_quantity INTEGER,
    counted_quantity INTEGER,
    variance INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'recounted', 'approved')),
    assigned_to UUID REFERENCES users(id),
    counted_by UUID REFERENCES users(id),
    count_type TEXT DEFAULT 'cycle' CHECK (count_type IN ('cycle', 'spot', 'full', 'audit')),
    priority INTEGER DEFAULT 5,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem Tickets
CREATE TABLE IF NOT EXISTS problem_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    ticket_number TEXT UNIQUE NOT NULL,
    problem_type TEXT NOT NULL CHECK (problem_type IN ('shortage', 'damage', 'mispick', 'missing', 'quality', 'system', 'other')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed', 'escalated')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    reference_type TEXT, -- 'shipment', 'inbound', 'location', etc.
    reference_id UUID,
    product_id UUID REFERENCES products(id),
    location_id UUID REFERENCES locations(id),
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_warehouse ON users(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_warehouse ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_barcode ON locations(barcode);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_warehouse ON transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- Inbound
CREATE INDEX IF NOT EXISTS idx_inbound_shipments_warehouse ON inbound_shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inbound_shipments_status ON inbound_shipments(status);
CREATE INDEX IF NOT EXISTS idx_inbound_lines_shipment ON inbound_lines(inbound_shipment_id);

-- Putaway
CREATE INDEX IF NOT EXISTS idx_putaway_warehouse ON putaway_tasks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_putaway_status ON putaway_tasks(status);
CREATE INDEX IF NOT EXISTS idx_putaway_assigned ON putaway_tasks(assigned_to);

-- Waves
CREATE INDEX IF NOT EXISTS idx_waves_warehouse ON waves(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_waves_status ON waves(status);

-- Shipments
CREATE INDEX IF NOT EXISTS idx_shipments_warehouse ON shipments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_shipments_wave ON shipments(wave_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipment_lines_shipment ON shipment_lines(shipment_id);

-- ICQA
CREATE INDEX IF NOT EXISTS idx_count_tasks_warehouse ON count_tasks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_count_tasks_status ON count_tasks(status);
CREATE INDEX IF NOT EXISTS idx_problem_tickets_warehouse ON problem_tickets(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_problem_tickets_status ON problem_tickets(status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE putaway_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_hand_off_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE count_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_tickets ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow authenticated users - customize as needed)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Authenticated users can view warehouses" ON warehouses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view locations" ON locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view inventory" ON inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage inventory" ON inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view transactions" ON transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert transactions" ON transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view inbound_shipments" ON inbound_shipments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view inbound_lines" ON inbound_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage putaway_tasks" ON putaway_tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage waves" ON waves FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage shipments" ON shipments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage shipment_lines" ON shipment_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage shipment_hand_off_log" ON shipment_hand_off_log FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage count_tasks" ON count_tasks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage problem_tickets" ON problem_tickets FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Insert a default warehouse
INSERT INTO warehouses (id, name, code, address, city, state)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Main Warehouse',
    'WH-001',
    '123 Warehouse St',
    'Los Angeles',
    'CA'
) ON CONFLICT (code) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Apparel', 'Clothing and fashion items'),
    ('Home & Garden', 'Home improvement and garden supplies'),
    ('Food & Beverage', 'Consumable food and drink items')
ON CONFLICT DO NOTHING;

-- Insert sample dock locations
INSERT INTO locations (warehouse_id, barcode, location_type, zone)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'DOCK-' || generate_series,
    'dock',
    'RECEIVING'
FROM generate_series(1, 10)
ON CONFLICT (barcode) DO NOTHING;

-- Insert sample storage locations
INSERT INTO locations (warehouse_id, barcode, location_type, zone, aisle, rack, level)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'A' || LPAD(aisle::text, 2, '0') || '-' || LPAD(rack::text, 2, '0') || '-' || LPAD(level::text, 2, '0'),
    'rack',
    'STORAGE',
    LPAD(aisle::text, 2, '0'),
    LPAD(rack::text, 2, '0'),
    LPAD(level::text, 2, '0')
FROM generate_series(1, 5) AS aisle, generate_series(1, 10) AS rack, generate_series(1, 4) AS level
ON CONFLICT (barcode) DO NOTHING;

-- Insert staging locations
INSERT INTO locations (warehouse_id, barcode, location_type, zone)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'STAGE-' || generate_series,
    'staging',
    'STAGING'
FROM generate_series(1, 5)
ON CONFLICT (barcode) DO NOTHING;

-- Insert shipping locations
INSERT INTO locations (warehouse_id, barcode, location_type, zone)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'SHIP-' || generate_series,
    'shipping',
    'SHIPPING'
FROM generate_series(1, 10)
ON CONFLICT (barcode) DO NOTHING;
