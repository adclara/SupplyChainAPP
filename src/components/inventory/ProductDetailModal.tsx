import React, { useEffect, useState } from 'react';
import { Inventory, Product } from '@/types';
import { TransactionHistoryRow } from '@/types/database';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getInventory, getTransactionHistory } from '@/services/inventoryService';
import {
    Box,
    MapPin,
    Clock,
    ArrowUpRight,
    ArrowDownLeft,
    History,
    Ruler
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assumed utils location based on previous context

interface ProductDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | undefined; // Passed from parent to avoid re-fetch if possible
    warehouseId: string;
}

export function ProductDetailModal({ isOpen, onClose, product, warehouseId }: ProductDetailModalProps) {
    const [locations, setLocations] = useState<Inventory[]>([]);
    const [history, setHistory] = useState<TransactionHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && product && warehouseId) {
            loadData();
        }
    }, [isOpen, product, warehouseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Parallel fetch: Inventory locations for this product AND History
            const [invData, histData] = await Promise.all([
                getInventory(warehouseId, { search: product?.sku }), // Re-using search as a quick filter for now, ideally strictly by ID
                getTransactionHistory(warehouseId, { limit: 10, productId: product?.id })
            ]);

            // Filter inventory to exact product match to be safe
            setLocations(invData.filter(i => i.product_id === product?.id));
            setHistory(histData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!product) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Product Details"
            description={`SKU: ${product.sku}`}
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="w-16 h-16 bg-zinc-800 rounded-md flex items-center justify-center border border-zinc-700">
                        <Box className="w-8 h-8 text-zinc-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{product.name}</h3>
                        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{product.description || 'No description available.'}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="default" className="text-xs border border-zinc-700 bg-transparent text-zinc-400">
                                <Ruler className="w-3 h-3 mr-1" />
                                {product.dimensions_cm
                                    ? `${product.dimensions_cm.length}x${product.dimensions_cm.width}x${product.dimensions_cm.height} cm`
                                    : 'N/A'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Stock Distribution */}
                <div>
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Stock Distribution
                    </h4>
                    <div className="space-y-2">
                        {loading ? (
                            <div className="h-20 bg-zinc-900 animate-pulse rounded-lg" />
                        ) : locations.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 bg-zinc-900 rounded-lg text-sm">
                                No stock currently held in this warehouse.
                            </div>
                        ) : (
                            locations.map(loc => (
                                <div key={loc.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-2 h-2 rounded-full",
                                            loc.location?.location_type === 'prime' ? 'bg-emerald-500' :
                                                loc.location?.location_type === 'problem' ? 'bg-red-500' : 'bg-blue-500'
                                        )} />
                                        <div>
                                            <p className="font-mono font-bold text-white">{loc.location?.barcode}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">{loc.location?.location_type}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-white">{loc.quantity}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent History */}
                <div>
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <History className="w-4 h-4" /> Recent Activity
                    </h4>
                    <div className="space-y-2">
                        {loading ? (
                            <div className="h-20 bg-zinc-900 animate-pulse rounded-lg" />
                        ) : history.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500 bg-zinc-900 rounded-lg text-sm">
                                No recent activity recorded.
                            </div>
                        ) : (
                            history.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-2 text-sm border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-1.5 rounded-md",
                                            tx.transaction_type === 'receive' ? 'bg-emerald-500/10 text-emerald-500' :
                                                tx.transaction_type === 'pick' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-zinc-500/10 text-zinc-500'
                                        )}>
                                            {tx.transaction_type === 'receive' ? <ArrowDownLeft className="w-3 h-3" /> :
                                                tx.transaction_type === 'pick' ? <ArrowUpRight className="w-3 h-3" /> :
                                                    <Clock className="w-3 h-3" />}
                                        </div>
                                        <div>
                                            <p className="text-zinc-300 capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                                            <p className="text-[10px] text-zinc-600">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={cn("font-mono font-bold",
                                        tx.transaction_type === 'receive' || tx.transaction_type === 'adjust' ? 'text-emerald-400' : 'text-zinc-400'
                                    )}>
                                        {tx.quantity}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                </div>
            </div>
        </Modal>
    );
}
