/**
 * Dashboard Page
 * @description Main dashboard with warehouse KPIs and analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    TrendingUp,
    TrendingDown,
    PackageOpen,
    Truck,
    Box,
    AlertTriangle,
    Clock,
    CheckCircle,
    ArrowRight,
    Activity,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getDashboardStats,
    getRecentActivity,
    type DashboardStats,
    type RecentActivity,
} from '@/services/dashboardService';
import { toast } from 'react-hot-toast';

export default function DashboardPage(): React.JSX.Element {
    const { user } = useUserStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.warehouse_id) {
            fetchDashboardData();
        }
    }, [user?.warehouse_id]);

    async function fetchDashboardData() {
        if (!user?.warehouse_id) return;

        try {
            setLoading(true);
            const [statsData, activityData] = await Promise.all([
                getDashboardStats(user.warehouse_id),
                getRecentActivity(user.warehouse_id, 10),
            ]);
            setStats(statsData);
            setActivity(activityData);
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading || !stats) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] text-white">
                <Sidebar />
                <main className="main-content">
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-zinc-400">Loading dashboard...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in py-8 px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="text-zinc-400 mt-1">
                            Welcome back, {user?.full_name || user?.email}
                        </p>
                    </div>

                    {/* Problem Alerts */}
                    {(stats.problems.critical > 0 || stats.problems.open > 5) && (
                        <Card variant="elevated" className="mb-6 bg-red-950/20 border-red-500/20 shadow-lg shadow-red-500/5">
                            <div className="flex items-start gap-4 p-1">
                                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-red-400 mb-0.5">Critical Attention Required</h4>
                                    <p className="text-sm text-red-300/70">
                                        {stats.problems.critical > 0 && `${stats.problems.critical} critical issues `}
                                        {stats.problems.critical > 0 && stats.problems.open > 5 && 'and '}
                                        {stats.problems.open > 5 && `${stats.problems.open} open tickets `}
                                        need immediate resolution to prevent floor bottlenecks.
                                    </p>
                                </div>
                                <Link href="/problem-solve">
                                    <Button variant="danger" size="sm" className="bg-red-600 hover:bg-red-700">
                                        View Tickets
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Main KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Inbound */}
                        <Link href="/inbound/receive">
                            <Card variant="elevated" className="border-[#27272a] shadow-lg hover:border-blue-500/50 hover:bg-white/[0.02] transition-all cursor-pointer h-full group">
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                            <PackageOpen className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Inbound</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-white">
                                            {stats.inbound.receiving + stats.inbound.scheduled}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-amber-400 font-bold">
                                            {stats.inbound.receiving} RECEIVING
                                        </span>
                                        <span className="text-zinc-500">
                                            {stats.inbound.putaway_pending} PUTAWAY
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* Outbound */}
                        {/* Outbound */}
                        <Link href="/outbound/waves">
                            <Card variant="elevated" className="border-[#27272a] shadow-lg hover:border-purple-500/50 hover:bg-white/[0.02] transition-all cursor-pointer h-full group">
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                                            <Truck className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Outbound</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-white">
                                            {stats.outbound.waves_active}
                                        </div>
                                        <span className="text-sm text-zinc-500 uppercase tracking-tight">Active Waves</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <span className="text-blue-400">
                                            {stats.outbound.picking_active} PICKING
                                        </span>
                                        <span className="text-emerald-400">
                                            {stats.outbound.shipped_today} SHIPPED
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* Inventory */}
                        <Link href="/inventory/icqa">
                            <Card variant="elevated" className="border-[#27272a] shadow-lg hover:border-emerald-500/50 hover:bg-white/[0.02] transition-all cursor-pointer h-full group">
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                                            <Box className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Inventory</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-white">
                                            {stats.inventory.total_units.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <span className="text-zinc-500">
                                            {stats.inventory.total_skus} SKUS
                                        </span>
                                        <span className="text-zinc-500">
                                            {stats.inventory.locations_used} LOCATIONS
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* Problems */}
                        <Link href="/problem-solve">
                            <Card variant="elevated" className={cn(
                                "shadow-lg transition-all cursor-pointer h-full group",
                                stats.problems.critical > 0
                                    ? "border-red-500/50 bg-red-500/5 hover:bg-red-500/10"
                                    : "border-[#27272a] hover:border-amber-500/50 hover:bg-white/[0.02]"
                            )}>
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center border",
                                            stats.problems.critical > 0
                                                ? "bg-red-500/20 border-red-500/30"
                                                : "bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20"
                                        )}>
                                            <AlertTriangle className={cn(
                                                "w-6 h-6",
                                                stats.problems.critical > 0 ? "text-red-400" : "text-amber-400"
                                            )} />
                                        </div>
                                        <ArrowRight className={cn(
                                            "w-5 h-5 transition-colors",
                                            stats.problems.critical > 0 ? "text-red-400" : "text-zinc-600 group-hover:text-amber-400"
                                        )} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-1">Problems</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-white">
                                            {stats.problems.open}
                                        </div>
                                        <span className="text-sm text-zinc-500 uppercase tracking-tight">Open Issues</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-bold">
                                        <span className={cn(
                                            stats.problems.critical > 0 ? "text-red-400" : "text-zinc-500"
                                        )}>
                                            {stats.problems.critical} CRITICAL
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Inbound Breakdown */}
                        <Card variant="elevated" className="border-[#27272a] shadow-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                    <PackageOpen className="w-5 h-5 text-blue-400" />
                                    Inbound Operations
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                                <Clock className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Scheduled</p>
                                                <p className="text-xs text-zinc-500">Awaiting receiving</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-amber-400">{stats.inbound.scheduled}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Activity className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Receiving</p>
                                                <p className="text-xs text-zinc-500">In progress</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-400">{stats.inbound.receiving}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                <Box className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Putaway Pending</p>
                                                <p className="text-xs text-zinc-500">Ready to store</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-400">{stats.inbound.putaway_pending}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Outbound Breakdown */}
                        <Card variant="elevated" className="border-[#27272a] shadow-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-purple-400" />
                                    Outbound Operations
                                </h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                                <Activity className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Active Waves</p>
                                                <p className="text-xs text-zinc-500">Released for picking</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-400">{stats.outbound.waves_active}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Box className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Picking</p>
                                                <p className="text-xs text-zinc-500">Items being picked</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-400">{stats.outbound.picking_active}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Shipped Today</p>
                                                <p className="text-xs text-zinc-500">Orders completed</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-400">{stats.outbound.shipped_today}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    {activity.length > 0 && (
                        <Card variant="elevated" className="border-[#27272a] shadow-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    {activity.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors rounded-lg px-2 -mx-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-zinc-300">{item.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                                    {item.user_name && <span className="text-blue-400/80">{item.user_name}</span>}
                                                    <span className="opacity-30">•</span>
                                                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
