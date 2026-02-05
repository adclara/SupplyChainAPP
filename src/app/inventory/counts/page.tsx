/**
 * Inventory - Counts Page
 * @description View and manage inventory count history and reports
 */

'use client';

import React, { useState } from 'react';
import {
    ClipboardCheck,
    MapPin,
    Package,
    User,
    Clock,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Calendar,
    Download,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatRelativeTime } from '@/lib/utils';

// Mock count history
const countHistory = [
    {
        id: '1',
        location: 'A1101',
        product: 'iPhone 15 Pro Max 256GB Black',
        sku: 'APL-IP15PM-256-BK',
        systemQuantity: 25,
        physicalQuantity: 25,
        variance: 0,
        countedBy: 'James Wilson',
        countDate: '2026-01-24T15:30:00Z',
        isBlindCount: true,
        status: 'verified',
    },
    {
        id: '2',
        location: 'B2203',
        product: 'Samsung Galaxy S24 Ultra 512GB',
        sku: 'SAM-GS24U-512-BK',
        systemQuantity: 75,
        physicalQuantity: 73,
        variance: -2,
        countedBy: 'James Wilson',
        countDate: '2026-01-24T14:15:00Z',
        isBlindCount: true,
        status: 'discrepancy',
        notes: 'Shortage found, possible theft or miscount',
    },
    {
        id: '3',
        location: 'C3104',
        product: 'MacBook Pro 14" M3 512GB',
        sku: 'APL-MBP14-M3-512',
        systemQuantity: 30,
        physicalQuantity: 30,
        variance: 0,
        countedBy: 'James Wilson',
        countDate: '2026-01-24T13:45:00Z',
        isBlindCount: true,
        status: 'verified',
    },
    {
        id: '4',
        location: 'A2101',
        product: 'MacBook Air 15" M3 256GB',
        sku: 'APL-MBA15-M3-256',
        systemQuantity: 80,
        physicalQuantity: 82,
        variance: 2,
        countedBy: 'Maria Garcia',
        countDate: '2026-01-24T10:00:00Z',
        isBlindCount: false,
        status: 'discrepancy',
        notes: 'Overage found, investigating source',
    },
    {
        id: '5',
        location: 'B1201',
        product: 'Sony WH-1000XM5 Black',
        sku: 'SNY-WH1000-BK',
        systemQuantity: 40,
        physicalQuantity: 40,
        variance: 0,
        countedBy: 'James Wilson',
        countDate: '2026-01-23T16:20:00Z',
        isBlindCount: true,
        status: 'verified',
    },
];

const statusColors: Record<string, string> = {
    verified: 'text-emerald-400 bg-emerald-400/10',
    discrepancy: 'text-red-400 bg-red-400/10',
    pending: 'text-amber-400 bg-amber-400/10',
};

export default function CountsPage(): React.JSX.Element {
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCounts = countHistory.filter(count => {
        if (filter !== 'all' && count.status !== filter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                count.location.toLowerCase().includes(query) ||
                count.product.toLowerCase().includes(query) ||
                count.sku.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const stats = {
        totalCounts: countHistory.length,
        verified: countHistory.filter(c => c.status === 'verified').length,
        discrepancies: countHistory.filter(c => c.status === 'discrepancy').length,
        accuracy: Math.round((countHistory.filter(c => c.variance === 0).length / countHistory.length) * 100),
    };

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-100">Count History</h1>
                            <p className="text-slate-400 mt-1">
                                View and analyze inventory count records
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={<Download className="w-4 h-4" />}
                            >
                                Export Report
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<ClipboardCheck className="w-4 h-4" />}
                            >
                                New Count
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <Card variant="elevated">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-100">{stats.totalCounts}</div>
                                    <div className="text-sm text-slate-400">Total Counts</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-100">{stats.verified}</div>
                                    <div className="text-sm text-slate-400">Verified</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-100">{stats.discrepancies}</div>
                                    <div className="text-sm text-slate-400">Discrepancies</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-100">{stats.accuracy}%</div>
                                    <div className="text-sm text-slate-400">Accuracy</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3 mb-8">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                filter === 'all'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            )}
                        >
                            All Counts
                        </button>
                        <button
                            onClick={() => setFilter('verified')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                filter === 'verified'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            )}
                        >
                            Verified
                        </button>
                        <button
                            onClick={() => setFilter('discrepancy')}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                filter === 'discrepancy'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            )}
                        >
                            Discrepancies
                        </button>
                    </div>

                    {/* Count History Table */}
                    <Card variant="elevated" padded={false}>
                        <div className="p-6 border-b border-slate-700/50">
                            <CardHeader
                                title="Count Records"
                                subtitle={`Showing ${filteredCounts.length} count records`}
                                action={
                                    <Input
                                        placeholder="Search location, product..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        leftIcon={<Package className="w-4 h-4" />}
                                        fullWidth={false}
                                        className="w-64"
                                    />
                                }
                            />
                        </div>

                        <div className="divide-y divide-slate-700/30">
                            {filteredCounts.map((count) => (
                                <div
                                    key={count.id}
                                    className={cn(
                                        'p-6 transition-colors',
                                        count.status === 'discrepancy' ? 'bg-red-500/5' : 'hover:bg-slate-800/30'
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                                            count.status === 'verified' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                        )}>
                                            {count.status === 'verified' ? (
                                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                                            ) : (
                                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-mono font-bold text-slate-100">{count.location}</h3>
                                                        <span className={cn(
                                                            'px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                                                            statusColors[count.status]
                                                        )}>
                                                            {count.status}
                                                        </span>
                                                        {count.isBlindCount && (
                                                            <span className="px-2 py-0.5 rounded text-xs font-medium text-purple-400 bg-purple-400/10">
                                                                Blind Count
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-200">{count.product}</p>
                                                    <p className="text-xs text-slate-500 mt-1">SKU: {count.sku}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="bg-slate-800/50 rounded-lg p-3">
                                                    <div className="text-xs text-slate-400 mb-1">System Qty</div>
                                                    <div className="text-lg font-bold text-slate-100">{count.systemQuantity}</div>
                                                </div>
                                                <div className="bg-slate-800/50 rounded-lg p-3">
                                                    <div className="text-xs text-slate-400 mb-1">Physical Qty</div>
                                                    <div className="text-lg font-bold text-blue-400">{count.physicalQuantity}</div>
                                                </div>
                                                <div className={cn(
                                                    'rounded-lg p-3',
                                                    count.variance !== 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'
                                                )}>
                                                    <div className="text-xs text-slate-400 mb-1">Variance</div>
                                                    <div className={cn(
                                                        'text-lg font-bold',
                                                        count.variance !== 0 ? 'text-red-400' : 'text-emerald-400'
                                                    )}>
                                                        {count.variance > 0 ? `+${count.variance}` : count.variance}
                                                    </div>
                                                </div>
                                            </div>

                                            {count.notes && (
                                                <div className="bg-slate-800/30 rounded-lg p-3 mb-4">
                                                    <p className="text-sm text-slate-300">{count.notes}</p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-6 text-sm text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span>{count.countedBy}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{formatRelativeTime(count.countDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
