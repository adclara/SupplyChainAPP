/**
 * Inventory - ICQA (Cycle Counts) Page with Pull System
 * @description Users can pull count tasks, perform blind counts, and auto-create problem tickets for variances
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    Package,
    MapPin,
    AlertTriangle,
    CheckCircle,
    User,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getAvailableCountTasks,
    getMyActiveCountTasks,
    pullCountTask,
    completeCountTask,
    releaseCountTask,
    type CountTaskWithDetails,
} from '@/services/icqaService';
import { toast } from 'react-hot-toast';

export default function ICQAPage(): React.JSX.Element {
    const { user } = useUserStore();
    const [activeTab, setActiveTab] = useState<'available' | 'my_counts'>('available');
    const [availableTasks, setAvailableTasks] = useState<CountTaskWithDetails[]>([]);
    const [myTasks, setMyTasks] = useState<CountTaskWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [countingTask, setCountingTask] = useState<CountTaskWithDetails | null>(null);
    const [countedQuantity, setCountedQuantity] = useState('');

    useEffect(() => {
        if (user?.warehouse_id && user?.id) {
            fetchTasks();
        }
    }, [user?.warehouse_id, user?.id]);

    /**
     * Fetch available and user's active count tasks
     */
    async function fetchTasks() {
        if (!user?.warehouse_id || !user?.id) return;

        try {
            setLoading(true);
            const [available, active] = await Promise.all([
                getAvailableCountTasks(user.warehouse_id),
                getMyActiveCountTasks(user.id),
            ]);
            setAvailableTasks(available);
            setMyTasks(active);
        } catch (error) {
            toast.error('Failed to load count tasks');
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Pull a count task (assign to user)
     */
    async function handlePullTask(taskId: string) {
        if (!user?.id) return;

        try {
            setActioningId(taskId);
            await pullCountTask(taskId, user.id);
            toast.success('Count task assigned to you');
            await fetchTasks();
            setActiveTab('my_counts'); // Switch to my counts tab
        } catch (error) {
            toast.error('Failed to pull count task');
            console.error('Error pulling task:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Start counting (open counting modal)
     */
    function handleStartCount(task: CountTaskWithDetails) {
        setCountingTask(task);
        setCountedQuantity('');
    }

    /**
     * Submit count
     */
    async function handleSubmitCount() {
        if (!countingTask || !user?.id) return;

        const qty = parseInt(countedQuantity);
        if (isNaN(qty) || qty < 0) {
            toast.error('Please enter a valid quantity');
            return;
        }

        try {
            setActioningId(countingTask.id);
            const result = await completeCountTask(countingTask.id, user.id, qty);

            const variance = result.variance || 0;
            if (variance === 0) {
                toast.success('Count completed - No variance!');
            } else {
                toast.error(`Variance detected: ${Math.abs(variance)} units ${variance > 0 ? 'missing' : 'extra'}. Problem ticket created.`);
            }

            setCountingTask(null);
            setCountedQuantity('');
            await fetchTasks();
        } catch (error) {
            toast.error('Failed to complete count');
            console.error('Error completing count:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Release a count task (unassign from user)
     */
    async function handleReleaseTask(taskId: string) {
        if (!user?.id) return;

        try {
            setActioningId(taskId);
            await releaseCountTask(taskId, user.id);
            toast.success('Count task released');
            await fetchTasks();
        } catch (error) {
            toast.error('Failed to release count task');
            console.error('Error releasing task:', error);
        } finally {
            setActioningId(null);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">ICQA - Cycle Counts</h1>
                            <p className="text-slate-600 mt-1">
                                Pull count tasks and perform blind counts
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-700">{availableTasks.length}</div>
                                    <div className="text-sm text-slate-600">Available Tasks</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-emerald-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <User className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">{myTasks.length}</div>
                                    <div className="text-sm text-slate-600">My Active Counts</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-slate-200">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('available')}
                                className={cn(
                                    'px-4 py-2 font-medium border-b-2 transition-colors',
                                    activeTab === 'available'
                                        ? 'border-blue-500 text-blue-700'
                                        : 'border-transparent text-slate-600 hover:text-slate-800'
                                )}
                            >
                                Available Tasks ({availableTasks.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('my_counts')}
                                className={cn(
                                    'px-4 py-2 font-medium border-b-2 transition-colors',
                                    activeTab === 'my_counts'
                                        ? 'border-emerald-500 text-emerald-700'
                                        : 'border-transparent text-slate-600 hover:text-slate-800'
                                )}
                            >
                                My Counts ({myTasks.length})
                            </button>
                        </div>
                    </div>

                    {/* Counting Modal */}
                    {countingTask && (
                        <Card variant="elevated" className="mb-8 bg-white border border-blue-200">
                            <div className="text-center py-8">
                                <h3 className="text-xl font-bold text-slate-800 mb-4">
                                    Blind Count - Location {countingTask.location.barcode}
                                </h3>

                                {countingTask.product && (
                                    <div className="mb-6">
                                        <p className="text-slate-600">Product: {countingTask.product.name}</p>
                                        <p className="text-sm text-slate-500">SKU: {countingTask.product.sku}</p>
                                    </div>
                                )}

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800 text-left">
                                            <strong>Blind Count:</strong> Enter the count without looking at system quantity. This ensures accuracy.
                                        </p>
                                    </div>
                                </div>

                                <div className="max-w-md mx-auto space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Enter Counted Quantity
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="0"
                                            value={countedQuantity}
                                            onChange={(e) => setCountedQuantity(e.target.value)}
                                            className="text-center text-4xl font-bold"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={handleSubmitCount}
                                            disabled={!countedQuantity || actioningId === countingTask.id}
                                        >
                                            {actioningId === countingTask.id ? 'Submitting...' : 'Submit Count'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setCountingTask(null);
                                                setCountedQuantity('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Available Tasks Tab */}
                    {activeTab === 'available' && (
                        <Card variant="elevated" padded={false} className="bg-white border border-slate-200">
                            <div className="p-6 border-b border-slate-200">
                                <CardHeader
                                    title="Available Count Tasks"
                                    subtitle={`${availableTasks.length} tasks waiting to be assigned`}
                                />
                            </div>

                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    <p className="text-slate-600 mt-4">Loading tasks...</p>
                                </div>
                            ) : availableTasks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No available tasks</h3>
                                    <p className="text-slate-500">All count tasks are currently assigned</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {availableTasks.map((task) => (
                                        <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <ClipboardCheck className="w-6 h-6 text-blue-600" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h3 className="font-mono font-bold text-lg text-slate-900 mb-1">
                                                                {task.location.barcode}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                Aisle: {task.location.aisle}
                                                            </p>
                                                            {task.product && (
                                                                <p className="text-sm text-slate-500 mt-1">
                                                                    Product: {task.product.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={cn(
                                                            'px-3 py-1 rounded-full text-xs font-semibold border',
                                                            task.type === 'blind'
                                                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                                : 'text-blue-700 bg-blue-50 border-blue-200'
                                                        )}>
                                                            {task.type.toUpperCase()} COUNT
                                                        </span>
                                                    </div>

                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handlePullTask(task.id)}
                                                        disabled={actioningId === task.id}
                                                    >
                                                        {actioningId === task.id ? 'Pulling...' : 'Pull Task'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* My Counts Tab */}
                    {activeTab === 'my_counts' && (
                        <Card variant="elevated" padded={false} className="bg-white border border-slate-200">
                            <div className="p-6 border-b border-slate-200">
                                <CardHeader
                                    title="My Active Count Tasks"
                                    subtitle={`${myTasks.length} tasks assigned to you`}
                                />
                            </div>

                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                    <p className="text-slate-600 mt-4">Loading your tasks...</p>
                                </div>
                            ) : myTasks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No active tasks</h3>
                                    <p className="text-slate-500 mb-6">Pull a task from available tasks to get started</p>
                                    <Button
                                        variant="primary"
                                        onClick={() => setActiveTab('available')}
                                    >
                                        View Available Tasks
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {myTasks.map((task) => (
                                        <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <ClipboardCheck className="w-6 h-6 text-emerald-600" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h3 className="font-mono font-bold text-lg text-slate-900 mb-1">
                                                                {task.location.barcode}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                Aisle: {task.location.aisle}
                                                            </p>
                                                            {task.product && (
                                                                <p className="text-sm text-slate-500 mt-1">
                                                                    Product: {task.product.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className={cn(
                                                            'px-3 py-1 rounded-full text-xs font-semibold border',
                                                            task.type === 'blind'
                                                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                                : 'text-blue-700 bg-blue-50 border-blue-200'
                                                        )}>
                                                            {task.type.toUpperCase()} COUNT
                                                        </span>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleStartCount(task)}
                                                        >
                                                            Start Count
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleReleaseTask(task.id)}
                                                            disabled={actioningId === task.id}
                                                        >
                                                            {actioningId === task.id ? 'Releasing...' : 'Release Task'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Info Card */}
                    <Card variant="elevated" className="mt-8 bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-slate-900 mb-1">ICQA Tips</h4>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Pull tasks from the available queue to start counting</li>
                                    <li>• For blind counts, enter quantity without checking system</li>
                                    <li>• Variances automatically create problem tickets</li>
                                    <li>• Release tasks if you can't complete them</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
