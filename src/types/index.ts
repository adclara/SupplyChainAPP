/**
 * Nexus Chain WMS - TypeScript Type Definitions
 * @description Core type definitions for the Warehouse Management System
 */

// =============================================================================
// USER & AUTH TYPES
// =============================================================================

export type UserRole = 'admin' | 'manager' | 'associate' | 'qa' | 'problem_solver';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  warehouse_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  user: User | null;
  accessToken: string | null;
}

// =============================================================================
// WAREHOUSE & LOCATION TYPES
// =============================================================================

export interface Warehouse {
  id: string;
  name: string;
  address: string | null;
  country_code: string | null;
  is_active: boolean;
  created_at: string;
}

export type LocationType = 'prime' | 'reserve' | 'dock' | 'problem';
export type LocationStatus = 'empty' | 'occupied' | 'blocked';

export interface Location {
  id: string;
  warehouse_id: string;
  barcode: string;
  aisle: string;
  level: number;
  section: number;
  position: number;
  location_type: LocationType;
  status: LocationStatus;
  capacity_units: number | null;
  current_units: number;
  last_counted_at: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// PRODUCT & CATEGORY TYPES
// =============================================================================

export interface Category {
  id: string;
  warehouse_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface Product {
  id: string;
  sku: string;
  upc: string;
  name: string;
  description: string | null;
  category_id: string | null;
  dimensions_cm: ProductDimensions | null;
  weight_kg: number | null;
  image_url: string | null;
  min_stock_level: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INVENTORY TYPES
// =============================================================================

export interface Inventory {
  id: string;
  warehouse_id: string;
  product_id: string;
  location_id: string;
  lpn: string | null;
  quantity: number;
  last_moved_at: string | null;
  last_moved_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  product?: Product;
  location?: Location;
}

// =============================================================================
// PURCHASE ORDER TYPES
// =============================================================================

export type POStatus = 'pending' | 'received' | 'completed';

export interface PurchaseOrder {
  id: string;
  warehouse_id: string;
  po_number: string;
  supplier: string | null;
  expected_arrival: string | null;
  status: POStatus;
  received_at: string | null;
  received_by: string | null;
  created_at: string;
  // Joined fields
  line_items?: POLineItem[];
}

export interface POLineItem {
  id: string;
  po_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number | null;
  created_at: string;
  // Joined fields
  product?: Product;
}

// =============================================================================
// WAVE & SHIPMENT TYPES
// =============================================================================

export type WaveStatus = 'pending' | 'picking' | 'packing' | 'shipped';
export type ShipmentStatus = 'pending' | 'picking' | 'packed' | 'shipped';

export interface Wave {
  id: string;
  warehouse_id: string;
  wave_number: string;
  status: WaveStatus;
  created_at: string;
  released_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  // Joined fields
  shipments?: Shipment[];
  shipment_count?: number;
}

export interface Shipment {
  id: string;
  wave_id: string;
  order_number: string;
  customer_name: string | null;
  shipping_address: string | null;
  status: ShipmentStatus;
  shipping_label_url: string | null;
  tracking_number: string | null;
  picked_at: string | null;
  picked_by: string | null;
  packed_at: string | null;
  packed_by: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  lines?: ShipmentLine[];
}

export interface ShipmentLine {
  id: string;
  shipment_id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  picked_at: string | null;
  picked_by: string | null;
  created_at: string;
  // Joined fields
  product?: Product;
  location?: Location;
}

// =============================================================================
// PROBLEM TICKET TYPES
// =============================================================================

export type TicketType = 'shortage' | 'damage' | 'mislabel' | 'wrong_location' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ProblemTicket {
  id: string;
  warehouse_id: string;
  ticket_type: TicketType;
  source_table: string | null;
  source_id: string | null;
  location_id: string | null;
  product_id: string | null;
  status: TicketStatus;
  description: string | null;
  image_url: string | null;
  created_by: string;
  assigned_to: string | null;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  location?: Location;
  product?: Product;
  creator?: User;
  assignee?: User;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export type TransactionType = 'receive' | 'putaway' | 'pick' | 'pack' | 'adjust' | 'inventory_update' | 'move';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  warehouse_id: string;
  transaction_type: TransactionType;
  user_id: string;
  product_id: string | null;
  location_id_from: string | null;
  location_id_to: string | null;
  quantity: number | null;
  reference_id: string | null;
  notes: string | null;
  status: TransactionStatus;
  created_at: string;
}

// =============================================================================
// ICQA TYPES
// =============================================================================

export interface ICQACount {
  id: string;
  warehouse_id: string;
  location_id: string;
  product_id: string;
  system_quantity: number | null;
  physical_quantity: number | null;
  variance: number | null;
  counted_by: string;
  count_date: string;
  is_blind_count: boolean;
  notes: string | null;
  created_at: string;
  // Joined fields
  location?: Location;
  product?: Product;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// KPI & ANALYTICS TYPES
// =============================================================================

export interface DashboardKPIs {
  wavesInProgress: number;
  pickRate: number;
  inventoryAccuracy: number;
  openTickets: number;
  shipmentsToday: number;
  unitsProcessed: number;
}

export interface LocationHeatmap {
  location_id: string;
  utilization: number;
  movement_count: number;
}
