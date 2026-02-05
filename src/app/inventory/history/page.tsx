'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { getTransactionHistory } from '@/services/inventoryService';
import { TransactionHistoryRow } from '@/types/database';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import {
    History,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    ArrowRightLeft,
    RotateCcw,
    Search,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function InventoryHistoryPage() {
    const { user } = useUserStore();
    const [isLoading, setIsLoading] = useState(true);
    const [history, setHistory] = useState<TransactionHistoryRow[]>([]);

    // Filters
    const [filterType, setFilterType] = useState<string>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchHistory = async () => {
        if (!user?.warehouse_id) return;
        setIsLoading(true);
        try {
            const data = await getTransactionHistory(user.warehouse_id, {
                limit: 100, // Reasonable limit
                type: filterType,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            });
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
            toast.error('Failed to load transaction history');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user?.warehouse_id, filterType, startDate, endDate]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'receive': return <ArrowDownLeft className="w-4 h-4 text-emerald-500" />;
            case 'pick': return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
            case 'move': return <ArrowRightLeft className="w-4 h-4 text-indigo-500" />;
            case 'adjust': return <RotateCcw className="w-4 h-4 text-amber-500" />;
            default: return <History className="w-4 h-4 text-zinc-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'receive': return 'success';
            case 'pick': return 'info';
            case 'move': return 'purple'; // purple isn't in badge variants, fallback to default or add it. Let's use 'default' or a customized class.
            case 'adjust': return 'warning';
            default: return 'default';
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Sidebar />

            <main className="main-content">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <History className="w-8 h-8 text-indigo-500" />
                                Transaction History
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Audit trail of all inventory movements and adjustments
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            leftIcon={<Filter className="w-4 h-4" />}
                            onClick={() => {
                                setFilterType('all');
                                setStartDate('');
                                setEndDate('');
                            }}
                        >
                            Clear Filters
                        </Button>
                    </div>

                    {/* Filters Toolbar */}
                    <Card className="bg-[#141417] border-[#27272a] p-4 mb-6">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Transaction Type</label>
                                <div className="flex bg-[#1c1c21] p-1 rounded-lg border border-white/5">
                                    {(['all', 'receive', 'pick', 'move', 'adjust'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={cn(
                                                "flex-1 px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all",
                                                filterType === type
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="w-40">
                                <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        type="date"
                                        className="pl-9 text-sm"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="w-40">
                                <label className="text-xs text-zinc-500 font-bold uppercase mb-1 block">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <Input
                                        type="date"
                                        className="pl-9 text-sm"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Transactions Table */}
                    <Card className="overflow-hidden">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Timestamp</TH>
                                    <TH>Type</TH>
                                    <TH>Product</TH>
                                    <TH>From / To</TH>
                                    <TH className="text-right">Quantity</TH>
                                    <TH>User / Notes</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {isLoading ? (
                                    <TR>
                                        <TD colSpan={6} className="py-24 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-zinc-500 font-bold tracking-widest uppercase">Loading History...</p>
                                        </TD>
                                    </TR>
                                ) : history.length === 0 ? (
                                    <TR>
                                        <TD colSpan={6} className="py-24 text-center">
                                            <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-zinc-500 mb-1 uppercase tracking-wider">No Transactions Found</h3>
                                            <p className="text-zinc-600">Try adjusting your filters.</p>
                                        </TD>
                                    </TR>
                                ) : (
                                    history.map((tx) => (
                                        <TR key={tx.id}>
                                            <TD>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-mono text-sm">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-zinc-500 text-xs">
                                                        {new Date(tx.created_at).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex items-center gap-2">
                                                    {getTypeIcon(tx.transaction_type)}
                                                    <Badge variant={getTypeColor(tx.transaction_type) as any} className="capitalize">
                                                        {tx.transaction_type}
                                                    </Badge>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm">{(tx as any).product?.name || 'Unknown'}</span>
                                                    <span className="text-zinc-500 text-xs font-mono">{(tx as any).product?.sku}</span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex flex-col gap-1">
                                                    {tx.location_id_from && (
                                                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                                                            <span className="uppercase text-[10px] w-8">From:</span>
                                                            <span className="font-mono text-white">{(tx as any).location_from?.barcode || tx.location_id_from}</span>
                                                        </div>
                                                    )}
                                                    {tx.location_id_to && (
                                                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                                                            <span className="uppercase text-[10px] w-8">To:</span>
                                                            <span className="font-mono text-white">{(tx as any).location_to?.barcode || tx.location_id_to}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TD>
                                            <TD className="text-right">
                                                <span className={cn(
                                                    "font-bold font-mono text-lg",
                                                    tx.quantity && tx.quantity > 0 ? "text-emerald-400" : "text-zinc-400"
                                                )}>
                                                    {tx.quantity}
                                                </span>
                                            </TD>
                                            <TD>
                                                <div className="flex flex-col">
                                                    <span className="text-zinc-300 text-sm">{(tx as any).user?.full_name || 'System'}</span>
                                                    {tx.notes && (
                                                        <span className="text-zinc-500 text-xs italic">{tx.notes}</span>
                                                    )}
                                                </div>
                                            </TD>
                                        </TR>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </Card>
                </div>
            </main>
        </div>
    );
}
