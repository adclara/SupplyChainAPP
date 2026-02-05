'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { getInventory, getInventoryStats, getCategoryStats } from '@/services/inventoryService';
import { Inventory, Product } from '@/types';
import { ProductDetailModal } from '@/components/inventory/ProductDetailModal';
import { InventoryActionModal } from '@/components/inventory/InventoryActionModal';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import {
    Search,
    Filter,
    Box,
    Layers,
    AlertTriangle,
    MapPin,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    ClipboardEdit,
    PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(true);
    const [inventory, setInventory] = useState<Inventory[]>([]);
    const [stats, setStats] = useState({
        totalUnits: 0,
        distinctSkus: 0,
        lowStockCount: 0,
        occupiedLocations: 0
    });
    const [categoryStats, setCategoryStats] = useState<{ name: string, count: number, percentage: number }[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState<string>('all');

    // Modal State
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
    const [actionState, setActionState] = useState<{
        isOpen: boolean;
        item: Inventory | null;
        mode: 'move' | 'adjust';
    }>({
        isOpen: false,
        item: null,
        mode: 'move'
    });

    const fetchInventory = async () => {
        if (!user?.warehouse_id) return;
        setIsLoading(true);
        try {
            const [fetchedInv, fetchedStats, fetchedCats] = await Promise.all([
                getInventory(user.warehouse_id, {
                    search: searchQuery,
                    location_type: locationFilter !== 'all' ? locationFilter : undefined
                }),
                getInventoryStats(user.warehouse_id),
                getCategoryStats(user.warehouse_id)
            ]);

            setInventory(fetchedInv);
            setStats(fetchedStats);
            setCategoryStats(fetchedCats);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            toast.error('Failed to load inventory data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchInventory();
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [user?.warehouse_id, searchQuery, locationFilter]);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Sidebar />

            <main className="main-content">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <Box className="w-8 h-8 text-indigo-500" />
                                Inventory Management
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Real-time visibility and stock control
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            leftIcon={<Layers className="w-4 h-4" />}
                            onClick={() => window.location.href = '/inventory/history'}
                        >
                            Audit Stock
                        </Button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                                    <Box className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Units</p>
                                    <p className="text-2xl font-bold text-white">{stats.totalUnits.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Occupied Bins</p>
                                    <p className="text-2xl font-bold text-white">{stats.occupiedLocations.toLocaleString()}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            {/* ANDON ALERT STYLE */}
                            <div className="flex items-center gap-4 relative overflow-hidden">
                                {stats.lowStockCount > 0 && (
                                    <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
                                )}
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center border",
                                    stats.lowStockCount > 0 ? "border-red-500/20 bg-red-500/10 text-red-500" : "border-zinc-800 bg-zinc-900 text-zinc-600"
                                )}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Low Stock Alerts</p>
                                    <p className={cn("text-2xl font-bold", stats.lowStockCount > 0 ? "text-red-500" : "text-zinc-600")}>
                                        {stats.lowStockCount}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Category Distribution Mini-Card */}
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="h-full flex flex-col justify-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                                    <PieChart className="w-3 h-3" /> Top Categories
                                </p>
                                <div className="space-y-1.5">
                                    {categoryStats.slice(0, 3).map((cat, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <div className="w-1 h-3 rounded-full bg-zinc-700 overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ height: '100%' /* Just a marker */ }} />
                                            </div>
                                            <span className="text-zinc-300 truncate flex-1">{cat.name}</span>
                                            <span className="text-zinc-500 font-mono">{Math.round(cat.percentage)}%</span>
                                        </div>
                                    ))}
                                    {categoryStats.length === 0 && <span className="text-zinc-600 text-xs italic">No data</span>}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Search & Toolbar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Search by SKU, Product Name, or Location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex bg-[#1c1c21] p-1 rounded-lg border border-white/5">
                            {(['all', 'prime', 'reserve', 'dock', 'problem'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setLocationFilter(type)}
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all",
                                        locationFilter === type
                                            ? "bg-indigo-600 text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <Card className="overflow-hidden">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Product Details</TH>
                                    <TH>Location</TH>
                                    <TH>Type</TH>
                                    <TH className="text-right">Quantity</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Action</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {isLoading ? (
                                    <TR>
                                        <TD colSpan={6} className="py-24 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-zinc-500 font-bold tracking-widest uppercase">Loading Inventory...</p>
                                        </TD>
                                    </TR>
                                ) : inventory.length === 0 ? (
                                    <TR>
                                        <TD colSpan={6} className="py-24 text-center">
                                            <Box className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-zinc-500 mb-1 uppercase tracking-wider">No Inventory Found</h3>
                                            <p className="text-zinc-600">Adjust filters or receive items to populate details.</p>
                                        </TD>
                                    </TR>
                                ) : (
                                    inventory.map((item) => (
                                        <TR key={item.id}>
                                            <TD>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                                        <Box className="w-5 h-5 text-zinc-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{item.product?.name || 'Unknown Product'}</p>
                                                        <p className="text-xs text-zinc-500 font-mono uppercase">SKU: {item.product?.sku}</p>
                                                    </div>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-zinc-500" />
                                                    <span className="font-mono text-zinc-300 font-bold">{item.location?.barcode}</span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <Badge
                                                    variant={
                                                        item.location?.location_type === 'prime' ? 'success' :
                                                            item.location?.location_type === 'problem' ? 'error' : 'default'
                                                    }
                                                >
                                                    {item.location?.location_type}
                                                </Badge>
                                            </TD>
                                            <TD className="text-right">
                                                <span className="text-white font-bold font-mono text-lg">
                                                    {item.quantity}
                                                </span>
                                            </TD>
                                            <TD>
                                                <Badge variant="success" className="text-zinc-400 border-zinc-700">
                                                    Available
                                                </Badge>
                                            </TD>
                                            <TD className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                                        title="Move Stock"
                                                        onClick={() => setActionState({ isOpen: true, item, mode: 'move' })}
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                                                        title="Adjust / Cycle Count"
                                                        onClick={() => setActionState({ isOpen: true, item, mode: 'adjust' })}
                                                    >
                                                        <ClipboardEdit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-zinc-400 hover:text-white"
                                                        onClick={() => setSelectedProduct(item.product)}
                                                    >
                                                        Details
                                                    </Button>
                                                </div>
                                            </TD>
                                        </TR>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </Card>

                    {/* Product Detail Modal */}
                    <ProductDetailModal
                        isOpen={!!selectedProduct}
                        onClose={() => setSelectedProduct(undefined)}
                        product={selectedProduct}
                        warehouseId={user?.warehouse_id || ''}
                    />

                    {/* Action Modal */}
                    {actionState.item && (
                        <InventoryActionModal
                            isOpen={actionState.isOpen}
                            onClose={() => setActionState(prev => ({ ...prev, isOpen: false }))}
                            item={actionState.item}
                            mode={actionState.mode}
                            onSuccess={() => {
                                fetchInventory(); // Refresh data
                            }}
                            userId={user?.id || ''}
                            warehouseId={user?.warehouse_id || ''}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
