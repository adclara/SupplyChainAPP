'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { getAvailablePicks, getMyActivePicks, pullPick, PickTask } from '@/services/pickingService';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import {
    ClipboardList,
    Play,
    Box,
    ArrowRight,
    Users,
    Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function PickingDashboard() {
    const { user } = useUserStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [activePicks, setActivePicks] = useState<PickTask[]>([]);
    const [availablePicks, setAvailablePicks] = useState<PickTask[]>([]);
    const loadData = async () => {
        if (!user?.warehouse_id || !user?.id) return;
        setIsLoading(true);
        try {
            const [active, available] = await Promise.all([
                getMyActivePicks(user.id),
                getAvailablePicks(user.warehouse_id)
            ]);
            setActivePicks(active);
            setAvailablePicks(available);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load picking tasks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user?.warehouse_id, user?.id]);

    const handlePullTask = async (lineId: string) => {
        if (!user?.id) return;
        try {
            await pullPick(lineId, user.id);
            toast.success('Task started!');
            await loadData(); // Refresh to move it to active
            router.push(`/outbound/picking/${lineId}`); // Navigate to session
        } catch (error: any) {
            toast.error(error.message);
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
                                <ClipboardList className="w-8 h-8 text-indigo-500" />
                                Picking Operations
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Manage and execute picking tasks for outbound orders
                            </p>
                        </div>
                        {/* Wave management moved to /outbound/waves */}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                                    <Box className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Tasks Available</p>
                                    <p className="text-2xl font-bold text-white">{availablePicks.length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-amber-500/20 bg-amber-500/10 text-amber-400">
                                    <Play className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">My Active Tasks</p>
                                    <p className="text-2xl font-bold text-white">{activePicks.length}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Active Pickers</p>
                                    <p className="text-2xl font-bold text-white">--</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Active Tasks (Priority) */}
                    {activePicks.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Play className="w-5 h-5 text-amber-500" />
                                My Active Tasks
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activePicks.map(task => (
                                    <Card key={task.id} className="bg-amber-500/5 border-amber-500/20 p-4 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                                        <div className="absolute top-0 right-0 p-2 opacity-50">
                                            <Clock className="w-16 h-16 text-amber-500/10" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="warning">In Progress</Badge>
                                                <span className="font-mono text-xs text-amber-300">{task.shipment?.order_number}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1">{task.location?.barcode}</h3>
                                            <p className="text-sm text-zinc-400 mb-4">
                                                {task.product?.name} ({task.quantity} units)
                                            </p>
                                            <Button
                                                variant="primary"
                                                className="w-full bg-amber-500 hover:bg-amber-600 border-none text-black font-bold"
                                                onClick={() => router.push(`/outbound/picking/${task.id}`)}
                                                rightIcon={<ArrowRight className="w-4 h-4" />}
                                            >
                                                Continue Picking
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available Tasks Table */}
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <h3 className="text-lg font-bold text-white">Available Queue</h3>
                        </div>
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Location</TH>
                                    <TH>Product</TH>
                                    <TH>Order</TH>
                                    <TH className="text-right">Qty</TH>
                                    <TH className="text-right">Action</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {isLoading ? (
                                    <TR>
                                        <TD colSpan={5} className="py-24 text-center text-zinc-500">Loading...</TD>
                                    </TR>
                                ) : availablePicks.length === 0 ? (
                                    <TR>
                                        <TD colSpan={5} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Box className="w-12 h-12 text-zinc-700" />
                                                <p className="text-zinc-500 font-bold uppercase">No tasks available</p>
                                                <p className="text-zinc-600 text-sm">Create a mock wave to test.</p>
                                            </div>
                                        </TD>
                                    </TR>
                                ) : (
                                    availablePicks.map((task) => (
                                        <TR key={task.id}>
                                            <TD>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-white">{task.location?.barcode}</span>
                                                    <span className="text-xs text-zinc-500">({task.location?.aisle})</span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-zinc-300">{task.product?.name}</span>
                                                    <span className="text-xs text-zinc-500 font-mono">{task.product?.sku}</span>
                                                </div>
                                            </TD>
                                            <TD>
                                                <span className="font-mono text-zinc-400">{task.shipment?.order_number}</span>
                                            </TD>
                                            <TD className="text-right">
                                                <span className="font-bold text-white text-lg">{task.quantity}</span>
                                            </TD>
                                            <TD className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    onClick={() => handlePullTask(task.id)}
                                                >
                                                    Start Pick
                                                </Button>
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
