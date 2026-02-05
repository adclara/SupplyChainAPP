-- =====================================================================
-- WAVE-BASED PICKING OPTIMIZATION
-- =====================================================================
-- Purpose: Group picks by zone/aisle to minimize travel time
-- =====================================================================

-- Add zone optimization fields to waves table
ALTER TABLE waves ADD COLUMN IF NOT EXISTS pick_strategy TEXT DEFAULT 'zone_sequential';
ALTER TABLE waves ADD COLUMN IF NOT EXISTS zone_sequence TEXT[]; -- e.g., ['A', 'B', 'C']

-- =====================================================================
-- FUNCTION: Get Optimized Pick Queue
-- =====================================================================
-- Returns picks sorted by zone/aisle for efficient path
-- =====================================================================

CREATE OR REPLACE FUNCTION get_optimized_pick_queue(
    p_warehouse_id UUID,
    p_wave_id UUID DEFAULT NULL
)
RETURNS TABLE (
    line_id UUID,
    shipment_id UUID,
    order_number TEXT,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    location_id UUID,
    location_barcode TEXT,
    zone TEXT,
    aisle TEXT,
    section TEXT,
    quantity INTEGER,
    priority INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id AS line_id,
        s.id AS shipment_id,
        s.order_number,
        p.id AS product_id,
        p.name AS product_name,
        p.sku AS product_sku,
        l.id AS location_id,
        l.barcode AS location_barcode,
        l.zone,
        l.aisle,
        l.section,
        sl.quantity,
        s.priority
    FROM shipment_lines sl
    JOIN shipments s ON s.id = sl.shipment_id
    JOIN products p ON p.id = sl.product_id
    JOIN locations l ON l.id = sl.location_id
    WHERE s.warehouse_id = p_warehouse_id
      AND sl.status = 'pending'
      AND (p_wave_id IS NULL OR s.wave_id = p_wave_id)
    ORDER BY 
        l.zone ASC,          -- Group by zone first
        l.aisle ASC,         -- Then by aisle
        l.section ASC,       -- Then by section
        s.priority DESC,     -- Higher priority first within same location
        s.created_at ASC;    -- FIFO within same priority
END;
$$;

-- =====================================================================
-- SHORT PICK EXCEPTION HANDLING
-- =====================================================================
-- Purpose: Handle cases where full quantity cannot be picked
-- =====================================================================

-- Create problem_tickets table for exceptions
CREATE TABLE IF NOT EXISTS problem_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    ticket_type TEXT NOT NULL, -- 'short_pick', 'damage', 'missing', 'quality'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'cancelled'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Reference Data
    reference_type TEXT, -- 'shipment_line', 'inbound_line', 'inventory'
    reference_id UUID,
    
    -- Details
    product_id UUID REFERENCES products(id),
    location_id UUID REFERENCES locations(id),
    expected_quantity INTEGER,
    actual_quantity INTEGER,
    shortage_quantity INTEGER,
    
    -- Assignment
    assigned_to UUID REFERENCES users_public(id),
    assigned_at TIMESTAMPTZ,
    
    -- Resolution
    resolved_by UUID REFERENCES users_public(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Metadata
    description TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users_public(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_problem_tickets_warehouse ON problem_tickets(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_problem_tickets_status ON problem_tickets(status);
CREATE INDEX IF NOT EXISTS idx_problem_tickets_type ON problem_tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_problem_tickets_assigned ON problem_tickets(assigned_to);

-- =====================================================================
-- FUNCTION: Complete Pick with Short Pick Support
-- =====================================================================
-- Enhanced version that handles partial picks
-- =====================================================================

CREATE OR REPLACE FUNCTION complete_pick_with_shortage(
    p_line_id UUID,
    p_user_id UUID,
    p_actual_quantity INTEGER,
    p_shortage_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_line RECORD;
    v_inventory RECORD;
    v_warehouse_id UUID;
    v_new_qty INTEGER;
    v_shortage INTEGER;
    v_ticket_id UUID;
BEGIN
    -- 1. Get Line Details with Lock
    SELECT sl.*, s.warehouse_id, s.order_number
    INTO v_line
    FROM shipment_lines sl
    JOIN shipments s ON s.id = sl.shipment_id
    WHERE sl.id = p_line_id
      AND sl.picked_by = p_user_id
      AND sl.status = 'in_progress'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pick not found or not assigned to you';
    END IF;

    v_warehouse_id := v_line.warehouse_id;
    v_shortage := v_line.quantity - p_actual_quantity;

    -- Validate actual quantity
    IF p_actual_quantity < 0 THEN
        RAISE EXCEPTION 'Actual quantity cannot be negative';
    END IF;

    IF p_actual_quantity > v_line.quantity THEN
        RAISE EXCEPTION 'Actual quantity cannot exceed expected quantity';
    END IF;

    -- 2. Get and Lock Inventory
    SELECT id, quantity
    INTO v_inventory
    FROM inventory
    WHERE location_id = v_line.location_id
      AND product_id = v_line.product_id
      AND warehouse_id = v_warehouse_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory record not found';
    END IF;

    -- 3. Calculate New Quantity
    v_new_qty := v_inventory.quantity - p_actual_quantity;
    
    IF v_new_qty < 0 THEN
        RAISE EXCEPTION 'Insufficient stock at location';
    END IF;

    -- 4. Update Inventory
    UPDATE inventory
    SET quantity = v_new_qty,
        updated_at = NOW()
    WHERE id = v_inventory.id;

    -- 5. Update Shipment Line
    IF v_shortage > 0 THEN
        -- Partial pick - update quantity and mark as short
        UPDATE shipment_lines
        SET quantity = p_actual_quantity,
            status = 'short_picked',
            picked_at = NOW(),
            notes = COALESCE(notes || E'\n', '') || 'Short picked: ' || v_shortage || ' units missing'
        WHERE id = p_line_id;

        -- Create Problem Ticket
        INSERT INTO problem_tickets (
            warehouse_id,
            ticket_type,
            status,
            priority,
            reference_type,
            reference_id,
            product_id,
            location_id,
            expected_quantity,
            actual_quantity,
            shortage_quantity,
            description,
            notes,
            created_by
        ) VALUES (
            v_warehouse_id,
            'short_pick',
            'open',
            'high',
            'shipment_line',
            p_line_id,
            v_line.product_id,
            v_line.location_id,
            v_line.quantity,
            p_actual_quantity,
            v_shortage,
            'Short pick for order ' || v_line.order_number,
            p_shortage_reason,
            p_user_id
        ) RETURNING id INTO v_ticket_id;
    ELSE
        -- Full pick
        UPDATE shipment_lines
        SET status = 'picked',
            picked_at = NOW()
        WHERE id = p_line_id;
    END IF;

    -- 6. Log Transaction
    INSERT INTO transactions (
        warehouse_id,
        transaction_type,
        user_id,
        product_id,
        location_id_from,
        quantity,
        reference_id,
        status,
        notes,
        created_at
    ) VALUES (
        v_warehouse_id,
        'pick',
        p_user_id,
        v_line.product_id,
        v_line.location_id,
        p_actual_quantity,
        v_line.shipment_id,
        'completed',
        CASE WHEN v_shortage > 0 THEN 'Short pick: ' || v_shortage || ' units short' ELSE NULL END,
        NOW()
    );

    -- 7. Return Success
    RETURN json_build_object(
        'success', true,
        'line_id', p_line_id,
        'actual_quantity', p_actual_quantity,
        'shortage', v_shortage,
        'ticket_id', v_ticket_id,
        'new_inventory_qty', v_new_qty
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Pick failed: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_optimized_pick_queue TO authenticated;
GRANT EXECUTE ON FUNCTION complete_pick_with_shortage TO authenticated;

-- Enable RLS on problem_tickets
ALTER TABLE problem_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see tickets for their warehouse
CREATE POLICY problem_tickets_select_policy ON problem_tickets
    FOR SELECT
    USING (
        warehouse_id IN (
            SELECT warehouse_id FROM users_public WHERE id = auth.uid()
        )
    );

-- RLS Policy: Users can create tickets
CREATE POLICY problem_tickets_insert_policy ON problem_tickets
    FOR INSERT
    WITH CHECK (
        warehouse_id IN (
            SELECT warehouse_id FROM users_public WHERE id = auth.uid()
        )
    );

-- RLS Policy: Users can update tickets in their warehouse
CREATE POLICY problem_tickets_update_policy ON problem_tickets
    FOR UPDATE
    USING (
        warehouse_id IN (
            SELECT warehouse_id FROM users_public WHERE id = auth.uid()
        )
    );
