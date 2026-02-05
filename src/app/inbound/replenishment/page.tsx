/**
 * Inbound - Replenishment Page
 * @description Auto-triggered replenishment queue for PRIME locations
 */

'use client';

import React, { useState } from 'react';
import {
    RefreshCw,
    MapPin,
    Package,
    Scan,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    ArrowRight,
    Clock,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/lib/utils';

// Mock replenishment requests - auto-generated when PRIME < 30%
const replenishmentQueue = [
    {
        id: '1',
        location: 'A1101',
        productName: 'iPhone 15 Pro Max 256GB Black',
        sku: 'APL-IP15PM-256-BK',
        currentUnits: 2,
        targetUnits: 10,
        capacityUnits: 10,
        priority: 'urgent', // 0-10% = urgent
        sourceLocation: 'A2103',
        sourceUnits: 40,
        status: 'pending',
        requestedAt: '2026-01-24T19:30:00Z',
    },
    {
        id: '2',
        location: 'B1202',
        productName: 'AirPods Pro 2nd Gen',
        sku: 'APL-AIRPM2-WH',
        currentUnits: 5,
        targetUnits: 20,
        capacityUnits: 20,
        priority: 'high', // 10-30% = high
        sourceLocation: 'B2204',
        sourceUnits: 80,
        status: 'pending',
        requestedAt: '2026-01-24T18:45:00Z',
    },
    {
        id: '3',
        location: 'C1301',
        productName: 'Samsung Galaxy S24 Ultra',
        sku: 'SAM-GS24U-512-BK',
        currentUnits: 8,
        targetUnits: 30,
        capacityUnits: 30,
        priority: 'medium',
        sourceLocation: 'C3204',
        sourceUnits: 50,
        status: 'in_progress',
        requestedAt: '2026-01-24T17:00:00Z',
    },
];

const priorityConfig = {
    urgent: {
        label: 'URGENT',
        color: 'text-red-400 bg-red-400/10 border-red-400/30',
        icon: AlertTriangle,
        description: '0-10% capacity - Immediate action required',
    },
    high: {
        label: 'HIGH',
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
        icon: AlertTriangle,
        description: '10-30% capacity - Replenish soon',
    },
    medium: {
        label: 'MEDIUM',
        color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
        icon: RefreshCw,
        description: '30-50% capacity - Schedule replenishment',
    },
    low: {
        label: 'LOW',
        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
        icon: CheckCircle,
        description: '>50% capacity - Monitor',
    },
};

export default function ReplenishmentPage(): React.JSX.Element {
    const [scanMode, setScanMode] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [step, setStep] = useState<'scan_source' | 'enter_qty' | 'scan_target'>('scan_source');
    const [quantityToMove, setQuantityToMove] = useState('');

    const stats = {
        pending: replenishmentQueue.filter(r => r.status === 'pending').length,
        inProgress: replenishmentQueue.filter(r => r.status === 'in_progress').length,
        urgent: replenishmentQueue.filter(r => r.priority === 'urgent').length,
        completed: 0,
    };

    const activeRequest = selectedRequest
        ? replenishmentQueue.find(r => r.id === selectedRequest)
        : null;

    const handleStartReplenishment = (requestId: string) => {
        setSelectedRequest(requestId);
        setScanMode(true);
        setStep('scan_source');
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
                                <RefreshCw className="w-8 h-8 text-blue-500" />
                                Inventory Replenishment
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                High-priority stock movement from Reserve to Prime locations
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-[#141417] border-[#27272a] hover:bg-[#1a1a1d]"
                            leftIcon={<RefreshCw className="w-4 h-4" />}
                        >
                            Sync Queue
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card className="bg-[#141417] border-red-500/20 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-12 h-12 text-red-500" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-red-500/20 bg-red-500/10 text-red-400">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Urgent</p>
                                    <p className="text-2xl font-bold text-red-500">{stats.urgent}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#141417] border-amber-500/20 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Clock className="w-12 h-12 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Pending</p>
                                    <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#141417] border-blue-500/20 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <RefreshCw className="w-12 h-12 text-blue-500" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                    <RefreshCw className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Active</p>
                                    <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#141417] border-emerald-500/20 p-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-12 h-12 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Completed</p>
                                    <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Replenishment Workflow */}
                    {scanMode && activeRequest && (
                        <Card className="mb-8 bg-[#141417] border-blue-500/20 p-0 overflow-hidden">
                            <div className="bg-blue-500/5 px-6 py-4 border-b border-[#27272a] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Scan className="w-4 h-4" />
                                    </div>
                                    <h2 className="font-bold text-white tracking-wide uppercase">Active Replenishment</h2>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-500 hover:text-white"
                                    onClick={() => setScanMode(false)}
                                >
                                    Cancel Mission
                                </Button>
                            </div>

                            <div className="p-8">
                                {/* Step Indicator */}
                                <div className="flex items-center justify-center gap-4 mb-12">
                                    <div className={cn(
                                        'flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all duration-300',
                                        step === 'scan_source'
                                            ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105'
                                            : 'bg-[#1a1a1d] border-[#27272a] text-zinc-500'
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                                            step === 'scan_source' ? "bg-white/20" : "bg-zinc-800"
                                        )}>1</div>
                                        <span className="text-sm font-bold uppercase tracking-widest">Source</span>
                                    </div>

                                    <div className="w-12 h-px bg-zinc-800" />

                                    <div className={cn(
                                        'flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all duration-300',
                                        step === 'enter_qty'
                                            ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105'
                                            : 'bg-[#1a1a1d] border-[#27272a] text-zinc-500'
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                                            step === 'enter_qty' ? "bg-white/20" : "bg-zinc-800"
                                        )}>2</div>
                                        <span className="text-sm font-bold uppercase tracking-widest">Transfer</span>
                                    </div>

                                    <div className="w-12 h-px bg-zinc-800" />

                                    <div className={cn(
                                        'flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all duration-300',
                                        step === 'scan_target'
                                            ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105'
                                            : 'bg-[#1a1a1d] border-[#27272a] text-zinc-500'
                                    )}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                                            step === 'scan_target' ? "bg-white/20" : "bg-zinc-800"
                                        )}>3</div>
                                        <span className="text-sm font-bold uppercase tracking-widest">Target</span>
                                    </div>
                                </div>

                                <div className="max-w-2xl mx-auto text-center">
                                    {/* Step 1: Scan Source */}
                                    {step === 'scan_source' && (
                                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                                            <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">
                                                Pull Stock from Reserve
                                            </h3>
                                            <div className="text-7xl font-mono font-black text-blue-400 mb-6 tracking-tighter">
                                                {activeRequest.sourceLocation}
                                            </div>
                                            <div className="bg-[#1a1a1d] border border-[#27272a] rounded-2xl p-6 mb-8 text-left">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-xl border border-[#27272a] flex items-center justify-center bg-[#0a0a0c]">
                                                        <Package className="w-6 h-6 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white leading-tight">{activeRequest.productName}</h4>
                                                        <p className="text-xs text-zinc-500 font-mono mt-1">SKU: {activeRequest.sku}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                    Available: <span className="text-white font-bold">{activeRequest.sourceUnits} units</span>
                                                </div>
                                            </div>
                                            <div className="max-w-md mx-auto relative">
                                                <Input
                                                    placeholder="VERIFY SOURCE LOCATION..."
                                                    className="bg-[#0a0a0c] border-[#27272a] text-center text-xl font-mono focus:border-blue-500 h-16"
                                                    autoFocus
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') setStep('enter_qty');
                                                    }}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                                                    <Scan className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-4 uppercase tracking-widest">Awaiting scanner input... (Mock: Press Enter)</p>
                                        </div>
                                    )}

                                    {/* Step 2: Enter Quantity */}
                                    {step === 'enter_qty' && (
                                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                                            <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">
                                                Transfer Allocation
                                            </h3>
                                            <div className="text-4xl font-bold text-white mb-8">
                                                Quantity to Transfer
                                            </div>

                                            <div className="flex items-center justify-center gap-8 mb-10">
                                                <div className="text-center">
                                                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Target Deficit</p>
                                                    <p className="text-3xl font-bold text-amber-500">
                                                        {activeRequest.targetUnits - activeRequest.currentUnits}
                                                    </p>
                                                </div>
                                                <div className="w-px h-12 bg-zinc-800" />
                                                <div className="text-center">
                                                    <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Max Available</p>
                                                    <p className="text-3xl font-bold text-blue-500">{activeRequest.sourceUnits}</p>
                                                </div>
                                            </div>

                                            <div className="max-w-md mx-auto space-y-6">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={quantityToMove}
                                                        onChange={(e) => setQuantityToMove(e.target.value)}
                                                        className="bg-[#0a0a0c] border-[#27272a] text-center text-6xl font-black h-24 focus:border-blue-500"
                                                        autoFocus
                                                    />
                                                    <div className="absolute top-2 right-4 text-xs font-bold text-zinc-600 uppercase">Input Qty</div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button
                                                        variant="secondary"
                                                        className="h-14 bg-[#1a1a1d] border-[#27272a] text-zinc-300 hover:text-white"
                                                        onClick={() => setQuantityToMove((activeRequest.targetUnits - activeRequest.currentUnits).toString())}
                                                    >
                                                        Fill Target ({activeRequest.targetUnits - activeRequest.currentUnits})
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        className="h-14 font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                                                        onClick={() => setStep('scan_target')}
                                                        disabled={!quantityToMove || parseInt(quantityToMove) <= 0}
                                                    >
                                                        Confirm Move
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step 3: Scan Target */}
                                    {step === 'scan_target' && (
                                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                                            <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">
                                                Deposit at Prime Location
                                            </h3>
                                            <div className="text-7xl font-mono font-black text-emerald-400 mb-6 tracking-tighter">
                                                {activeRequest.location}
                                            </div>

                                            <div className="bg-[#1a1a1d] border border-[#27272a] rounded-2xl p-6 mb-8 flex justify-between items-center text-left">
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase font-extrabold mb-1">Transfer Mission</p>
                                                    <p className="text-xl font-bold text-white">
                                                        Moving <span className="text-blue-400">{quantityToMove}</span> units
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-500 uppercase font-extrabold mb-1">New Fill Level</p>
                                                    <p className="text-xl font-bold text-emerald-400">
                                                        {Math.min(100, ((parseInt(activeRequest.currentUnits.toString()) + parseInt(quantityToMove)) / activeRequest.capacityUnits) * 100).toFixed(0)}%
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="max-w-md mx-auto relative">
                                                <Input
                                                    placeholder="VERIFY TARGET LOCATION..."
                                                    className="bg-[#0a0a0c] border-[#27272a] text-center text-xl font-mono focus:border-emerald-500 h-16"
                                                    autoFocus
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            alert(`Replenishment completed! Moved ${quantityToMove} units from ${activeRequest.sourceLocation} to ${activeRequest.location}`);
                                                            setScanMode(false);
                                                            setSelectedRequest(null);
                                                            setStep('scan_source');
                                                            setQuantityToMove('');
                                                        }
                                                    }}
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                                                    <Scan className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-4 uppercase tracking-widest">Scan target bin to finalize... (Mock: Press Enter)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Replenishment Queue */}
                    <Card className="bg-[#141417] border-[#27272a] p-0 overflow-hidden">
                        <div className="px-6 py-5 border-b border-[#27272a] bg-[#1a1a1d] flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">Active Priority Queue</h2>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mt-1">
                                    {replenishmentQueue.length} replenishment missions identified
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>URGENT (&lt; 10%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span>HIGH (&lt; 30%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-[#27272a]">
                            {replenishmentQueue.map((request) => {
                                const fillPercentage = (request.currentUnits / request.capacityUnits) * 100;

                                return (
                                    <div
                                        key={request.id}
                                        className={cn(
                                            'p-6 group transition-all duration-300 hover:bg-[#1a1a1d]',
                                            request.priority === 'urgent' && 'border-l-4 border-l-red-500 bg-red-500/[0.02]',
                                            selectedRequest === request.id && 'bg-blue-500/[0.05] border-l-4 border-l-blue-500'
                                        )}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                            {/* Priority & Location */}
                                            <div className="lg:w-48">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge
                                                        variant={
                                                            request.priority === 'urgent' ? 'error' :
                                                                request.priority === 'high' ? 'warning' : 'primary'
                                                        }
                                                        glow={request.priority === 'urgent'}
                                                        size="xs"
                                                    >
                                                        {request.priority}
                                                    </Badge>
                                                    {request.status === 'in_progress' && (
                                                        <Badge variant="info" size="xs" glow>ACTIVE</Badge>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-mono font-black text-white tracking-tighter">
                                                    {request.location}
                                                </h3>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.1em]">Prime Bin</p>
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-[#0a0a0c] border border-[#27272a] flex items-center justify-center group-hover:border-zinc-700 transition-colors">
                                                        <Package className="w-6 h-6 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors">{request.productName}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-xs font-mono text-zinc-500">SKU: {request.sku}</span>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                                                <Clock className="w-3 h-3" />
                                                                <span>{formatRelativeTime(request.requestedAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Inventory Status */}
                                            <div className="lg:w-64">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] uppercase font-extrabold text-zinc-500">Inventory Density</span>
                                                    <span className={cn(
                                                        'text-xs font-bold',
                                                        fillPercentage < 10 ? 'text-red-400' :
                                                            fillPercentage < 30 ? 'text-amber-400' : 'text-emerald-400'
                                                    )}>
                                                        {fillPercentage.toFixed(0)}% FULL
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-[#0a0a0c] rounded-full overflow-hidden border border-[#27272a]">
                                                    <div
                                                        className={cn(
                                                            'h-full rounded-full transition-all duration-1000',
                                                            fillPercentage < 10 ? 'bg-red-500' :
                                                                fillPercentage < 30 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        )}
                                                        style={{ width: `${fillPercentage}%` }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 mt-3">
                                                    <div className="text-center bg-[#0a0a0c] border border-[#27272a] rounded-lg p-1.5 px-2">
                                                        <p className="text-[8px] text-zinc-600 font-bold uppercase">Bin</p>
                                                        <p className="text-xs font-black text-red-400">{request.currentUnits}</p>
                                                    </div>
                                                    <div className="text-center bg-[#0a0a0c] border border-[#27272a] rounded-lg p-1.5 px-2">
                                                        <p className="text-[8px] text-zinc-600 font-bold uppercase">Need</p>
                                                        <p className="text-xs font-black text-blue-400">{request.targetUnits - request.currentUnits}</p>
                                                    </div>
                                                    <div className="text-center bg-[#0a0a0c] border border-[#27272a] rounded-lg p-1.5 px-2">
                                                        <p className="text-[8px] text-zinc-600 font-bold uppercase">Reserve</p>
                                                        <p className="text-xs font-black text-emerald-400">{request.sourceUnits}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="lg:w-48 text-right">
                                                {request.status === 'pending' ? (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="w-full font-bold uppercase tracking-widest text-[10px] h-10 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                                                        onClick={() => handleStartReplenishment(request.id)}
                                                    >
                                                        Execute Task
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="w-full bg-[#1a1a1d] border-[#27272a] text-zinc-500 h-10 cursor-not-allowed"
                                                        disabled
                                                    >
                                                        In Progress
                                                    </Button>
                                                )}
                                                <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-zinc-600">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>Reserve: <span className="font-mono">{request.sourceLocation}</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
