/**
 * Outbound - Waves Management Page
 * @description Wave creation and release with full Supabase integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    Waves as WavesIcon,
    Plus,
    PlayCircle,
    Package,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { createWave, releaseWave, getWaves, type Wave } from '@/services/waveService';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const WAVE_STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: Clock,
        iconColor: 'text-amber-500',
    },
    picking: {
        label: 'Picking',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: Package,
        iconColor: 'text-blue-500',
    },
    packing: {
        label: 'Packing',
        color: 'text-purple-700 bg-purple-50 border-purple-200',
        icon: Package,
        iconColor: 'text-purple-500',
    },
    shipped: {
        label: 'Shipped',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
    },
};

export default function WavesPage(): React.JSX.Element {
    const { user } = useUserStore();
    const router = useRouter();
    const [waves, setWaves] = useState<Wave[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingWave, setCreatingWave] = useState(false);
    const [releasingWaveId, setReleasingWaveId] = useState<string | null>(null);

    // Fetch waves on mount
    useEffect(() => {
        if (user?.warehouse_id) {
            fetchWaves();
        }
    }, [user?.warehouse_id]);

    /**
     * Fetch waves from database
     */
    async function fetchWaves() {
        if (!user?.warehouse_id) return;

        try {
            setLoading(true);
            const data = await getWaves(user.warehouse_id);
            setWaves(data);
        } catch (error) {
            toast.error('Failed to load waves');
            console.error('Error fetching waves:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Create new wave
     */
    async function handleCreateWave() {
        if (!user?.warehouse_id) {
            toast.error('Warehouse not found');
            return;
        }

        try {
            setCreatingWave(true);
            const newWave = await createWave({
                warehouse_id: user.warehouse_id,
            });

            toast.success(`Wave ${newWave.wave_number} created successfully`);
            await fetchWaves(); // Refresh list
        } catch (error) {
            toast.error('Failed to create wave');
            console.error('Error creating wave:', error);
        } finally {
            setCreatingWave(false);
        }
    }

    /**
     * Release wave for picking
     */
    async function handleReleaseWave(waveId: string, waveNumber: string) {
        try {
            setReleasingWaveId(waveId);
            await releaseWave(waveId);

            toast.success(`Wave ${waveNumber} released for picking`);
            await fetchWaves(); // Refresh list
        } catch (error) {
            toast.error('Failed to release wave');
            console.error('Error releasing wave:', error);
        } finally {
            setReleasingWaveId(null);
        }
    }

    // Calculate stats
    const stats = {
        total: waves.length,
        pending: waves.filter(w => w.status === 'pending').length,
        picking: waves.filter(w => w.status === 'picking').length,
        packing: waves.filter(w => w.status === 'packing').length,
        shipped: waves.filter(w => w.status === 'shipped').length,
    };

    return (
        <div className="min-h-screen bg-white">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Wave Management</h1>
                            <p className="text-slate-600 mt-1">
                                Create and manage picking waves
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={handleCreateWave}
                            disabled={creatingWave}
                        >
                            {creatingWave ? 'Creating...' : 'New Wave'}
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <WavesIcon className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-700">{stats.total}</div>
                                    <div className="text-sm text-slate-600">Total Waves</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
                                    <div className="text-sm text-slate-600">Pending</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-700">{stats.picking}</div>
                                    <div className="text-sm text-slate-600">Picking</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-700">{stats.packing}</div>
                                    <div className="text-sm text-slate-600">Packing</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">{stats.shipped}</div>
                                    <div className="text-sm text-slate-600">Shipped</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Waves List */}
                    <Card variant="elevated" padded={false} className="bg-white border border-slate-200 shadow-sm">
                        <div className="p-6 border-b border-slate-200">
                            <CardHeader
                                title="Active Waves"
                                subtitle={`${waves.length} waves in the system`}
                            />
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                                <p className="text-slate-600 mt-4">Loading waves...</p>
                            </div>
                        ) : waves.length === 0 ? (
                            <div className="p-12 text-center">
                                <WavesIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No waves yet</h3>
                                <p className="text-slate-600 mb-6">Create your first wave to get started</p>
                                <Button
                                    variant="primary"
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    onClick={handleCreateWave}
                                    disabled={creatingWave}
                                >
                                    Create First Wave
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {waves.map((wave) => {
                                    const config = WAVE_STATUS_CONFIG[wave.status];
                                    const StatusIcon = config.icon;
                                    const isReleasing = releasingWaveId === wave.id;

                                    return (
                                        <div
                                            key={wave.id}
                                            className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/outbound/waves/${wave.id}`)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                                                    wave.status === 'pending' ? 'bg-amber-100' :
                                                        wave.status === 'picking' ? 'bg-blue-100' :
                                                            wave.status === 'packing' ? 'bg-purple-100' :
                                                                'bg-emerald-100'
                                                )}>
                                                    <StatusIcon className={cn('w-6 h-6', config.iconColor)} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-mono font-bold text-lg text-slate-900">
                                                                    {wave.wave_number}
                                                                </h3>
                                                                <span className={cn(
                                                                    'px-2.5 py-1 rounded-full text-xs font-semibold border',
                                                                    config.color
                                                                )}>
                                                                    {config.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-600">
                                                                Created {new Date(wave.created_at).toLocaleDateString()}
                                                                {wave.released_at && (
                                                                    <> • Released {new Date(wave.released_at).toLocaleDateString()}</>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-slate-900">
                                                                {wave.total_shipments}
                                                            </div>
                                                            <div className="text-xs text-slate-600">shipments</div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-3 mt-4">
                                                        {wave.status === 'pending' && (
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                leftIcon={<PlayCircle className="w-4 h-4" />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReleaseWave(wave.id, wave.wave_number);
                                                                }}
                                                                disabled={isReleasing}
                                                            >
                                                                {isReleasing ? 'Releasing...' : 'Release Wave'}
                                                            </Button>
                                                        )}
                                                        {wave.status === 'picking' && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/outbound/picking?wave=${wave.id}`);
                                                                }}
                                                            >
                                                                View Picks
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                        >
                                                            View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Info Card */}
                    <Card variant="elevated" className="mt-8 bg-purple-50 border border-purple-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-purple-900 mb-1">Wave Management Tips</h4>
                                <ul className="text-sm text-purple-800 space-y-1">
                                    <li>• Create waves during off-peak hours for better performance</li>
                                    <li>• Release waves when pickers are ready to start</li>
                                    <li>• Monitor picking progress in real-time</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
