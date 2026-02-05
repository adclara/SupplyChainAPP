'use client';

import React, { useState } from 'react';
import { Inventory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { moveStock, adjustStock, getInventoryByLocation } from '@/services/inventoryService';
import { toast } from 'react-hot-toast';
import { ArrowRight, RefreshCw, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // For quick location lookup if needed, or stick to service

interface InventoryActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Inventory;
    mode: 'move' | 'adjust';
    onSuccess: () => void;
    userId: string;
    warehouseId: string;
}

export function InventoryActionModal({
    isOpen,
    onClose,
    item,
    mode,
    onSuccess,
    userId,
    warehouseId
}: InventoryActionModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Move State
    const [targetLocation, setTargetLocation] = useState('');
    const [moveQty, setMoveQty] = useState<number>(item.quantity);

    // Adjust State
    const [adjustQty, setAdjustQty] = useState<number>(0);
    const [reason, setReason] = useState('');

    const resolveLocationId = async (barcode: string) => {
        const { data, error } = await supabase
            .from('locations')
            .select('id')
            .eq('warehouse_id', warehouseId)
            .eq('barcode', barcode)
            .single();
        if (error || !data) throw new Error('Invalid Location Barcode');
        return data.id;
    };

    const handleMove = async () => {
        if (!targetLocation) return toast.error('Please enter a target location');
        if (moveQty <= 0 || moveQty > item.quantity) return toast.error('Invalid quantity');

        setIsLoading(true);
        try {
            const toLocationId = await resolveLocationId(targetLocation.toUpperCase());
            // Prevent move to same location
            if (toLocationId === item.location_id) throw new Error('Cannot move to same location');

            await moveStock(
                warehouseId,
                item.product_id,
                item.location_id,
                toLocationId,
                moveQty,
                userId
            );
            toast.success('Stock moved successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to move stock');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdjust = async () => {
        if (adjustQty === 0) return toast.error('Adjustment cannot be zero');
        if (!reason) return toast.error('Please provide a reason');

        setIsLoading(true);
        try {
            await adjustStock(
                warehouseId,
                item.product_id,
                item.location_id,
                adjustQty,
                userId,
                reason
            );
            toast.success('Stock adjusted successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to adjust stock');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === 'move' ? 'Move Inventory' : 'Adjust Stock (Cycle Count)'}
            description={`${item.product?.name} (${item.product?.sku}) at ${item.location?.barcode}`}
        >
            <div className="space-y-6 pt-2">
                {mode === 'move' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 uppercase font-bold">From</label>
                                <p className="text-lg font-mono font-bold text-white">{item.location?.barcode}</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-zinc-600" />
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">To (Scan)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        value={targetLocation}
                                        onChange={e => setTargetLocation(e.target.value)}
                                        placeholder="LOC-A-01-..."
                                        className="pl-9 bg-zinc-950 font-mono uppercase"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Quantity to Move (Max: {item.quantity})</label>
                            <Input
                                type="number"
                                value={moveQty}
                                onChange={e => setMoveQty(Number(e.target.value))}
                                max={item.quantity}
                                min={1}
                            />
                        </div>
                    </div>
                )}

                {mode === 'adjust' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200">
                                Adjustments directly impact inventory accuracy. Use only for corrections or damages.
                            </p>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Adjustment Quantity (+/-)</label>
                            <div className="flex gap-4 items-center">
                                <Input
                                    type="number"
                                    value={adjustQty}
                                    onChange={e => setAdjustQty(Number(e.target.value))}
                                    placeholder="+10 or -5"
                                    className={adjustQty < 0 ? 'text-red-400 border-red-900/50 focus:border-red-500' : 'text-emerald-400 border-emerald-900/50 focus:border-emerald-500'}
                                />
                                <span className="text-sm text-zinc-400">
                                    New Total: <strong className="text-white">{item.quantity + adjustQty}</strong>
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Reason Code / Notes</label>
                            <Input
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="Found extra, Damaged, Lost..."
                            />
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button
                        variant={mode === 'move' ? 'primary' : 'danger'} // Move = Primary, Adjust = Warning/Danger (Process wise)
                        onClick={mode === 'move' ? handleMove : handleAdjust}
                        disabled={isLoading}
                        isLoading={isLoading}
                    >
                        {mode === 'move' ? 'Confirm Move' : 'Confirm Adjustment'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
