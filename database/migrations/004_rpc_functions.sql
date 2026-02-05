-- =====================================================================
-- NEXUS WMS - DATABASE FUNCTIONS (RPCs)
-- Purpose: Atomic operations for critical inventory transactions
-- =====================================================================

-- =====================================================================
-- 1. COMPLETE PICK (Atomic Transaction)
-- =====================================================================
-- This function ensures that inventory decrement, line update, and 
-- transaction logging happen atomically (all or nothing).
-- =====================================================================

CREATE OR REPLACE FUNCTION complete_pick(
    p_line_id UUID,
    p_user_id UUID
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
BEGIN
    -- 1. Get Line Details with Lock
    SELECT sl.*, s.warehouse_id
    INTO v_line
    FROM shipment_lines sl
    JOIN shipments s ON s.id = sl.shipment_id
    WHERE sl.id = p_line_id
      AND sl.picked_by = p_user_id
      AND sl.status = 'in_progress'
    FOR UPDATE; -- Lock the row

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pick not found or not assigned to you';
    END IF;

    v_warehouse_id := v_line.warehouse_id;

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
    v_new_qty := v_inventory.quantity - v_line.quantity;
    
    IF v_new_qty < 0 THEN
        RAISE EXCEPTION 'Insufficient stock at location';
    END IF;

    -- 4. Update Inventory
    UPDATE inventory
    SET quantity = v_new_qty,
        updated_at = NOW()
    WHERE id = v_inventory.id;

    -- 5. Update Shipment Line
    UPDATE shipment_lines
    SET status = 'picked',
        picked_at = NOW()
    WHERE id = p_line_id;

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
        created_at
    ) VALUES (
        v_warehouse_id,
        'pick',
        p_user_id,
        v_line.product_id,
        v_line.location_id,
        v_line.quantity,
        v_line.shipment_id,
        'completed',
        NOW()
    );

    -- 7. Return Success
    RETURN json_build_object(
        'success', true,
        'line_id', p_line_id,
        'new_inventory_qty', v_new_qty
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Pick failed: %', SQLERRM;
END;
$$;

-- =====================================================================
-- 2. MOVE STOCK (Atomic Transaction)
-- =====================================================================
-- Moves stock from one location to another atomically
-- =====================================================================

CREATE OR REPLACE FUNCTION move_stock(
    p_warehouse_id UUID,
    p_product_id UUID,
    p_from_location_id UUID,
    p_to_location_id UUID,
    p_quantity INTEGER,
    p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_source RECORD;
    v_dest RECORD;
    v_new_source_qty INTEGER;
BEGIN
    -- 1. Validate Quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive';
    END IF;

    -- 2. Get and Lock Source Inventory
    SELECT id, quantity
    INTO v_source
    FROM inventory
    WHERE warehouse_id = p_warehouse_id
      AND location_id = p_from_location_id
      AND product_id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source inventory not found';
    END IF;

    IF v_source.quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock at source location';
    END IF;

    -- 3. Calculate New Source Quantity
    v_new_source_qty := v_source.quantity - p_quantity;

    -- 4. Update Source
    UPDATE inventory
    SET quantity = v_new_source_qty,
        updated_at = NOW()
    WHERE id = v_source.id;

    -- 5. Get or Create Destination
    SELECT id, quantity
    INTO v_dest
    FROM inventory
    WHERE warehouse_id = p_warehouse_id
      AND location_id = p_to_location_id
      AND product_id = p_product_id
    FOR UPDATE;

    IF FOUND THEN
        -- Update existing destination
        UPDATE inventory
        SET quantity = v_dest.quantity + p_quantity,
            updated_at = NOW()
        WHERE id = v_dest.id;
    ELSE
        -- Create new destination record
        INSERT INTO inventory (
            warehouse_id,
            product_id,
            location_id,
            quantity,
            created_at,
            updated_at
        ) VALUES (
            p_warehouse_id,
            p_product_id,
            p_to_location_id,
            p_quantity,
            NOW(),
            NOW()
        );
    END IF;

    -- 6. Log Transaction
    INSERT INTO transactions (
        warehouse_id,
        transaction_type,
        user_id,
        product_id,
        location_id_from,
        location_id_to,
        quantity,
        status,
        created_at
    ) VALUES (
        p_warehouse_id,
        'move',
        p_user_id,
        p_product_id,
        p_from_location_id,
        p_to_location_id,
        p_quantity,
        'completed',
        NOW()
    );

    -- 7. Return Success
    RETURN json_build_object(
        'success', true,
        'from_location', p_from_location_id,
        'to_location', p_to_location_id,
        'quantity_moved', p_quantity
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Move failed: %', SQLERRM;
END;
$$;

-- =====================================================================
-- 3. ADJUST STOCK (Atomic Transaction)
-- =====================================================================
-- Adjusts stock quantity (cycle count) atomically
-- =====================================================================

CREATE OR REPLACE FUNCTION adjust_stock(
    p_warehouse_id UUID,
    p_product_id UUID,
    p_location_id UUID,
    p_delta_quantity INTEGER,
    p_user_id UUID,
    p_reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current RECORD;
    v_new_qty INTEGER;
BEGIN
    -- 1. Get Current Inventory
    SELECT id, quantity
    INTO v_current
    FROM inventory
    WHERE warehouse_id = p_warehouse_id
      AND location_id = p_location_id
      AND product_id = p_product_id
    FOR UPDATE;

    -- 2. Calculate New Quantity
    IF FOUND THEN
        v_new_qty := v_current.quantity + p_delta_quantity;
    ELSE
        v_new_qty := p_delta_quantity;
    END IF;

    IF v_new_qty < 0 THEN
        RAISE EXCEPTION 'Adjustment would result in negative stock';
    END IF;

    -- 3. Update or Insert
    IF FOUND THEN
        UPDATE inventory
        SET quantity = v_new_qty,
            updated_at = NOW()
        WHERE id = v_current.id;
    ELSE
        IF p_delta_quantity <= 0 THEN
            RAISE EXCEPTION 'Cannot reduce stock that does not exist';
        END IF;

        INSERT INTO inventory (
            warehouse_id,
            product_id,
            location_id,
            quantity,
            created_at,
            updated_at
        ) VALUES (
            p_warehouse_id,
            p_product_id,
            p_location_id,
            v_new_qty,
            NOW(),
            NOW()
        );
    END IF;

    -- 4. Log Transaction
    INSERT INTO transactions (
        warehouse_id,
        transaction_type,
        user_id,
        product_id,
        location_id_from,
        location_id_to,
        quantity,
        notes,
        status,
        created_at
    ) VALUES (
        p_warehouse_id,
        'adjust',
        p_user_id,
        p_product_id,
        p_location_id,
        p_location_id,
        p_delta_quantity,
        p_reason,
        'completed',
        NOW()
    );

    -- 5. Return Success
    RETURN json_build_object(
        'success', true,
        'new_quantity', v_new_qty,
        'delta', p_delta_quantity
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Adjustment failed: %', SQLERRM;
END;
$$;

-- =====================================================================
-- GRANT PERMISSIONS
-- =====================================================================
-- Grant execute permissions to authenticated users
-- Adjust based on your RLS policies

GRANT EXECUTE ON FUNCTION complete_pick TO authenticated;
GRANT EXECUTE ON FUNCTION move_stock TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_stock TO authenticated;
