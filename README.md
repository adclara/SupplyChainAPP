# Nexus WMS - Warehouse Management System

A modern, full-featured Warehouse Management System built with Next.js 15, TypeScript, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## Features

### Inbound Operations
- **Receiving** - Process incoming shipments with ASN support
- **Dock Management** - Assign and manage dock doors
- **Putaway** - Directed putaway with location suggestions
- **Replenishment** - Automated stock replenishment workflows

### Outbound Operations
- **Wave Planning** - Batch orders into optimized picking waves
- **Picking** - Mobile-friendly pick tasks with barcode scanning
- **Packing** - Cartonization and pack station management
- **Shipping** - Carrier integration and label generation

### Inventory Management
- **Real-time Tracking** - Live inventory levels across all locations
- **Stock Movements** - Add, move, adjust inventory with full audit trail
- **Transaction History** - Complete history of all inventory movements
- **Location Management** - Rack, floor, staging, and dock locations

### ICQA (Inventory Control & Quality Assurance)
- **Cycle Counts** - Scheduled and ad-hoc inventory counts
- **Problem Tickets** - Track and resolve inventory discrepancies
- **Adjustments** - Controlled inventory adjustments with approvals

### Dashboard & Analytics
- **Real-time KPIs** - Inbound, outbound, and inventory metrics
- **Activity Feed** - Live transaction monitoring
- **Alerts** - Low stock, overdue shipments, problem tickets

## Tech Stack

- **Framework**: Next.js 15 with App Router & Turbopack
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Validation**: Zod v4
- **Testing**: Vitest + React Testing Library
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adclara/SupplyChainAPP.git
   cd nexus-wms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**

   Run the schema in Supabase SQL Editor:
   ```bash
   # The schema file is located at:
   supabase/schema.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Supabase Connection

```bash
# Verify database connectivity
npm run test:connection
```

## Project Structure

```
nexus-wms/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/              # Admin settings
│   │   ├── dashboard/          # Main dashboard
│   │   ├── inbound/            # Receiving, putaway, dock, replenishment
│   │   ├── inventory/          # Stock management, history, counts
│   │   ├── outbound/           # Picking, packing, shipping
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── inventory/          # Inventory-specific components
│   │   ├── layout/             # Sidebar, navigation
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   ├── errors.ts           # Error handling utilities
│   │   ├── supabase.ts         # Supabase client
│   │   └── validations/        # Zod schemas
│   ├── services/               # Business logic & API calls
│   ├── store/                  # Zustand stores
│   ├── tests/                  # Test files
│   └── types/                  # TypeScript definitions
├── supabase/
│   └── schema.sql              # Database schema
├── scripts/
│   └── test-supabase-connection.ts
└── database/
    └── seed.sql                # Sample data
```

## Database Schema

The application uses 16 core tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts and roles |
| `warehouses` | Warehouse locations |
| `products` | Product catalog |
| `categories` | Product categories |
| `locations` | Storage locations (rack, floor, dock, etc.) |
| `inventory` | Current stock levels |
| `transactions` | All inventory movements |
| `inbound_shipments` | Incoming shipment headers |
| `inbound_lines` | Incoming shipment line items |
| `putaway_tasks` | Putaway work queue |
| `waves` | Outbound wave headers |
| `shipments` | Outbound order headers |
| `shipment_lines` | Outbound order line items |
| `shipment_hand_off_log` | Carrier handoff tracking |
| `count_tasks` | Cycle count tasks |
| `problem_tickets` | Issue tracking |

## Security Features

- **Authentication Middleware** - Server-side route protection
- **Row Level Security (RLS)** - Database-level access control
- **Security Headers** - X-Frame-Options, CSP, HSTS
- **Environment Validation** - Fail-fast in production
- **Input Validation** - Zod schemas for all inputs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/outbound/shipping/verify` | POST | Verify shipment for shipping |
| `/api/outbound/shipping/confirm` | POST | Confirm carrier handoff |

## Recent Updates (v2.0)

### Architecture Improvements
- Added authentication middleware for all protected routes
- Implemented comprehensive security headers
- Added fail-fast environment validation

### Type Safety
- Eliminated 35+ `any` types with proper TypeScript definitions
- Added database types for all Supabase queries
- Created RPC result types for stored procedures

### Error Handling
- Transaction logging now returns success/error status
- Dashboard uses Promise.allSettled for resilient data loading
- Standardized error classes (AppError, ValidationError, NotFoundError)

### Code Quality
- Removed mock data from production code
- Dynamic dock doors from database (was hardcoded)
- Added comprehensive test infrastructure

### New Features
- Inventory management page with stock movements
- Transaction history with filtering
- Admin settings panel
- Hardware configuration store

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Zod](https://zod.dev/) - Schema validation
