/**
 * Inbound - Putaway Page with Pull System
 * @description Users can pull putaway tasks and complete them
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    MoveRight,
    Package,
    MapPin,
    CheckCircle,
    User,
    AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TH, TR, TD } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getAvailablePutawayTasks,
    pullPutawayTask,
    completePutawayTask,
    type PutawayTaskWithDetails,
} from '@/services/inboundService';
import { toast } from 'react-hot-toast';

export default function PutawayPage(): React.JSX.Element {
    const { user } = useUserStore();
    const [activeTab, setActiveTab] = useState<'available' | 'my_tasks'>('available');
    const [availableTasks, setAvailableTasks] = useState<PutawayTaskWithDetails[]>([]);
    const [myTasks, setMyTasks] = useState<PutawayTaskWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.warehouse_id) {
            fetchTasks();
        }
    }, [user?.warehouse_id]);

    /**
     * Fetch available putaway tasks
     */
    async function fetchTasks() {
        if (!user?.warehouse_id) return;

        try {
            setLoading(true);
            const data = await getAvailablePutawayTasks(user.warehouse_id);

            // Separate into available and my tasks
            const available = data.filter(t => t.status === 'pending');
            const mine = data.filter(t => t.assigned_to === user.id && t.status === 'in_progress');

            setAvailableTasks(available);
            setMyTasks(mine);
        } catch (error) {
            toast.error('Failed to load putaway tasks');
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Pull a putaway task (assign to user)
     */
    async function handlePullTask(taskId: string) {
        if (!user?.id) return;

        try {
            setActioningId(taskId);
            await pullPutawayTask(taskId, user.id);
            toast.success('Task assigned to you');
            await fetchTasks();
            setActiveTab('my_tasks'); // Switch to my tasks tab
        } catch (error) {
            toast.error('Failed to pull task');
            console.error('Error pulling task:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Complete putaway task
     */
    async function handleCompleteTask(taskId: string) {
        if (!user?.id) return;

        try {
            setActioningId(taskId);
            await completePutawayTask(taskId, user.id);
            toast.success('Putaway completed');
            await fetchTasks();
        } catch (error) {
            toast.error('Failed to complete putaway');
            console.error('Error completing task:', error);
        } finally {
            setActioningId(null);
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Sidebar />

            <main className="main-content">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <MoveRight className="w-8 h-8 text-blue-500" />
                                Putaway Operations
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Directed storage movement and inventory placement
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 bg-blue-500/10 text-blue-400">
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Unassigned Tasks</p>
                                    <p className="text-2xl font-bold text-white">{availableTasks.length}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-[#141417] border-[#27272a] p-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 bg-emerald-500/10 text-emerald-400">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">In-Progress (Me)</p>
                                    <p className="text-2xl font-bold text-white">{myTasks.length}</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-[#27272a]">
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('available')}
                                className={cn(
                                    'px-1 py-4 text-sm font-bold uppercase tracking-widest transition-all relative',
                                    activeTab === 'available'
                                        ? 'text-blue-400'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                )}
                            >
                                Available Tasks ({availableTasks.length})
                                {activeTab === 'available' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('my_tasks')}
                                className={cn(
                                    'px-1 py-4 text-sm font-bold uppercase tracking-widest transition-all relative',
                                    activeTab === 'my_tasks'
                                        ? 'text-emerald-400'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                )}
                            >
                                My Tasks ({myTasks.length})
                                {activeTab === 'my_tasks' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Available Tasks Tab */}
                    {activeTab === 'available' && (
                        <div className="space-y-4">
                            {loading ? (
                                <Card className="p-12 text-center bg-[#141417] border-[#27272a]">
                                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Synchronizing Task Queue...</p>
                                </Card>
                            ) : availableTasks.length === 0 ? (
                                <Card className="p-12 text-center bg-[#141417] border-[#27272a]">
                                    <Package className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-zinc-500 mb-1 uppercase tracking-wider text-xs">Queue Cleared</h3>
                                    <p className="text-zinc-600 text-sm">No pending putaway tasks available for assignment.</p>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {availableTasks.map((task) => (
                                        <Card key={task.id} className="bg-[#141417] border-[#27272a] hover:border-blue-500/30 transition-all overflow-hidden group">
                                            <div className="flex flex-col md:flex-row md:items-center">
                                                <div className="p-6 flex-1">
                                                    <div className="flex items-start justify-between gap-4 mb-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center shrink-0">
                                                                <Package className="w-6 h-6 text-blue-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight leading-none mb-2">
                                                                    {task.product.name}
                                                                </h3>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge outline variant="default" className="text-[10px] font-mono tracking-tighter opacity-70">SKU: {task.product.sku}</Badge>
                                                                    <span className="text-[10px] text-zinc-600 font-mono">TASK_ID: {task.id.split('-')[0]}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-3xl font-black text-white leading-none">
                                                                {task.quantity}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Units</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Source</span>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-3 h-3 text-amber-500" />
                                                                <span className="font-mono text-sm font-bold text-amber-400">{task.from_location.barcode}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-center flex-col items-center opacity-30">
                                                            <MoveRight className="w-4 h-4 text-blue-500" />
                                                            <span className="text-[8px] uppercase font-bold tracking-tighter mt-1">Directional flow</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 text-right md:text-left">
                                                            <span className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Destination</span>
                                                            <div className="flex items-center gap-2 justify-end md:justify-start">
                                                                <MapPin className="w-3 h-3 text-emerald-500" />
                                                                <span className="font-mono text-sm font-bold text-emerald-400">{task.to_location?.barcode || 'TBD'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-white/5 border-t md:border-t-0 md:border-l border-white/5 flex items-center justify-center">
                                                    <Button
                                                        variant="primary"
                                                        className="w-full md:w-32 bg-blue-600 hover:bg-blue-500"
                                                        onClick={() => handlePullTask(task.id)}
                                                        isLoading={actioningId === task.id}
                                                    >
                                                        Pull Task
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Tasks Tab */}
                    {activeTab === 'my_tasks' && (
                        <div className="space-y-4">
                            {loading ? (
                                <Card className="p-12 text-center bg-[#141417] border-[#27272a]">
                                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Syncing Your Assignments...</p>
                                </Card>
                            ) : myTasks.length === 0 ? (
                                <Card className="p-12 text-center bg-[#141417] border-[#27272a]">
                                    <User className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-zinc-500 mb-1 uppercase tracking-wider text-xs">No Active Duties</h3>
                                    <p className="text-zinc-600 text-sm mb-6">Pull a task from the available queue to begin intake operations.</p>
                                    <Button
                                        variant="primary"
                                        onClick={() => setActiveTab('available')}
                                        className="bg-blue-600 hover:bg-blue-500"
                                    >
                                        Inspect Available Tasks
                                    </Button>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {myTasks.map((task) => (
                                        <Card key={task.id} className="bg-[#141417] border-[#27272a] border-l-4 border-l-emerald-500 transition-all overflow-hidden group">
                                            <div className="flex flex-col md:flex-row md:items-center">
                                                <div className="p-6 flex-1">
                                                    <div className="flex items-start justify-between gap-4 mb-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center shrink-0">
                                                                <MoveRight className="w-6 h-6 text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors tracking-tight leading-none mb-2">
                                                                    {task.product.name}
                                                                </h3>
                                                                <div className="flex items-center gap-3">
                                                                    <Badge outline variant="success" className="text-[10px] font-mono tracking-tighter opacity-70 border-emerald-500/20 text-emerald-400">SKU: {task.product.sku}</Badge>
                                                                    <span className="text-[10px] text-zinc-600 font-mono italic">ASSIGNED TO YOU</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-3xl font-black text-white leading-none">
                                                                {task.quantity}
                                                            </div>
                                                            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-widest mt-1">Verified Payload</div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-black/40 p-5 rounded-xl border border-white/5 ring-1 ring-white/5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Intake Point</span>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-3 h-3 text-amber-500" />
                                                                <span className="font-mono text-base font-bold text-amber-500">{task.from_location.barcode}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-center flex-col items-center">
                                                            <div className="h-0.5 w-12 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 rounded-full mb-1" />
                                                            <span className="text-[8px] uppercase font-black tracking-tighter text-zinc-600">Transit</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 text-right md:text-left">
                                                            <span className="text-[10px] uppercase font-black text-zinc-600 tracking-widest">Storage Bin</span>
                                                            <div className="flex items-center gap-2 justify-end md:justify-start">
                                                                <MapPin className="w-3 h-3 text-emerald-400 animate-pulse" />
                                                                <span className="font-mono text-base font-bold text-emerald-400">{task.to_location?.barcode || 'TBD'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-emerald-500/5 border-t md:border-t-0 md:border-l border-emerald-500/10 flex items-center justify-center">
                                                    <Button
                                                        variant="primary"
                                                        className="w-full md:w-32 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                        leftIcon={<CheckCircle className="w-4 h-4" />}
                                                        onClick={() => handleCompleteTask(task.id)}
                                                        isLoading={actioningId === task.id}
                                                    >
                                                        Confirm
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Directives */}
                    <Card className="mt-8 border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-start gap-4 p-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">Operational Directives</h4>
                                <ul className="text-xs text-zinc-400 space-y-1.5 list-none pl-0">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Verify physical item count matches task manifest before confirming placement.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Ensure heavy items are placed on lower rack levels (Tiers 1-2) for safety compliance.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Report any damaged packaging immediately via the quality control exception flag.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
