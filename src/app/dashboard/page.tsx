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
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <main className="main-content">
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-slate-600">Loading dashboard...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-600 mt-1">
                            Welcome back, {user?.full_name || user?.email}
                        </p>
                    </div>

                    {/* Problem Alerts */}
                    {(stats.problems.critical > 0 || stats.problems.open > 5) && (
                        <Card variant="elevated" className="mb-6 bg-red-50 border border-red-200 shadow-sm">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-red-900 mb-1">Action Required</h4>
                                    <p className="text-sm text-red-700">
                                        {stats.problems.critical > 0 && `${stats.problems.critical} critical issues `}
                                        {stats.problems.critical > 0 && stats.problems.open > 5 && 'and '}
                                        {stats.problems.open > 5 && `${stats.problems.open} open tickets `}
                                        need attention.
                                    </p>
                                </div>
                                <Link href="/problem-solve">
                                    <Button variant="danger" size="sm">
                                        View Problems
                                    </Button>
                                </Link>
                            </div>
                        </Card>
                    )}

                    {/* Main KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Inbound */}
                        <Link href="/inbound/receive">
                            <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <PackageOpen className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-600 mb-1">Inbound</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {stats.inbound.receiving + stats.inbound.scheduled}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-amber-600 font-medium">
                                            {stats.inbound.receiving} receiving
                                        </span>
                                        <span className="text-slate-500">
                                            {stats.inbound.putaway_pending} putaway
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* Outbound */}
                        <Link href="/outbound/waves">
                            <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                                            <Truck className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-600 mb-1">Outbound</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {stats.outbound.waves_active}
                                        </div>
                                        <span className="text-sm text-slate-500">active waves</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-blue-600 font-medium">
                                            {stats.outbound.picking_active} picking
                                        </span>
                                        <span className="text-emerald-600 font-medium">
                                            {stats.outbound.shipped_today} shipped
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* Inventory */}
                        <Link href="/inventory/icqa">
                            <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                                            <Box className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-600 mb-1">Inventory</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {stats.inventory.total_units.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-slate-600">
                                            {stats.inventory.total_skus} SKUs
                                        </span>
                                        <span className="text-slate-500">
                                            {stats.inventory.locations_used} locations
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* Problems */}
                        <Link href="/problem-solve">
                            <Card variant="elevated" className={cn(
                                "bg-white border shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full",
                                stats.problems.critical > 0
                                    ? "border-red-200"
                                    : "border-slate-200"
                            )}>
                                <div className="p-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            stats.problems.critical > 0 ? "bg-red-50" : "bg-amber-50"
                                        )}>
                                            <AlertTriangle className={cn(
                                                "w-6 h-6",
                                                stats.problems.critical > 0 ? "text-red-600" : "text-amber-600"
                                            )} />
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-slate-600 mb-1">Problems</h3>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <div className="text-3xl font-bold text-slate-900">
                                            {stats.problems.open}
                                        </div>
                                        <span className="text-sm text-slate-500">open</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className={cn(
                                            "font-medium",
                                            stats.problems.critical > 0 ? "text-red-600" : "text-slate-500"
                                        )}>
                                            {stats.problems.critical} critical
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>

                    {/* Secondary Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Inbound Breakdown */}
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-5">Inbound Operations</h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                                <Clock className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Scheduled</p>
                                                <p className="text-xs text-slate-500">Awaiting receiving</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-amber-600">{stats.inbound.scheduled}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Receiving</p>
                                                <p className="text-xs text-slate-500">In progress</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">{stats.inbound.receiving}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                                <Box className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Putaway Pending</p>
                                                <p className="text-xs text-slate-500">Ready to store</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">{stats.inbound.putaway_pending}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Outbound Breakdown */}
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-5">Outbound Operations</h3>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Active Waves</p>
                                                <p className="text-xs text-slate-500">Released for picking</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">{stats.outbound.waves_active}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Box className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Picking</p>
                                                <p className="text-xs text-slate-500">Items being picked</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">{stats.outbound.picking_active}</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">Shipped Today</p>
                                                <p className="text-xs text-slate-500">Orders completed</p>
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-emerald-600">{stats.outbound.shipped_today}</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    {activity.length > 0 && (
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-5">Recent Activity</h3>
                                <div className="space-y-4">
                                    {activity.slice(0, 5).map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 py-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-900">{item.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    {item.user_name && <span>{item.user_name}</span>}
                                                    <span>•</span>
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
