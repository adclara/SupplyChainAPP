/**
 * Outbound - Picking Page with Pull System
 * @description Users can pull picks to assign them, complete them, or release them
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    Package,
    CheckCircle,
    MapPin,
    Scan,
    XCircle,
    Clock,
    User,
    AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getAvailablePicks,
    getMyActivePicks,
    pullPick,
    completePick,
    releasePick,
    type PickTask,
} from '@/services/pickingService';
import { toast } from 'react-hot-toast';

export default function PickingPage(): React.JSX.Element {
    const { user } = useUserStore();
    const [activeTab, setActiveTab] = useState<'available' | 'my_picks'>('available');
    const [availablePicks, setAvailablePicks] = useState<PickTask[]>([]);
    const [myPicks, setMyPicks] = useState<PickTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [scanMode, setScanMode] = useState(false);
    const [selectedPick, setSelectedPick] = useState<PickTask | null>(null);

    useEffect(() => {
        if (user?.warehouse_id && user?.id) {
            fetchPicks();
        }
    }, [user?.warehouse_id, user?.id]);

    /**
     * Fetch available and user's active picks
     */
    async function fetchPicks() {
        if (!user?.warehouse_id || !user?.id) return;

        try {
            setLoading(true);
            const [available, active] = await Promise.all([
                getAvailablePicks(user.warehouse_id),
                getMyActivePicks(user.id),
            ]);
            setAvailablePicks(available);
            setMyPicks(active);
        } catch (error) {
            toast.error('Failed to load picks');
            console.error('Error fetching picks:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Pull a pick (assign to user)
     */
    async function handlePullPick(pickId: string) {
        if (!user?.id) return;

        try {
            setActioningId(pickId);
            await pullPick(pickId, user.id);
            toast.success('Pick assigned to you');
            await fetchPicks();
            setActiveTab('my_picks'); // Switch to my picks tab
        } catch (error) {
            toast.error('Failed to pull pick');
            console.error('Error pulling pick:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Complete a pick
     */
    async function handleCompletePick(pickId: string) {
        if (!user?.id) return;

        try {
            setActioningId(pickId);
            await completePick(pickId, user.id);
            toast.success('Pick completed successfully');
            await fetchPicks();
            setScanMode(false);
            setSelectedPick(null);
        } catch (error) {
            toast.error('Failed to complete pick');
            console.error('Error completing pick:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Release a pick (unassign from user)
     */
    async function handleReleasePick(pickId: string) {
        if (!user?.id) return;

        try {
            setActioningId(pickId);
            await releasePick(pickId, user.id);
            toast.success('Pick released');
            await fetchPicks();
        } catch (error) {
            toast.error('Failed to release pick');
            console.error('Error releasing pick:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Start scanning for a pick
     */
    function handleStartScan(pick: PickTask) {
        setSelectedPick(pick);
        setScanMode(true);
    }

    return (
        <div className="min-h-screen bg-white">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Picking</h1>
                            <p className="text-slate-600 mt-1">
                                Pull picks to work on and complete them
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-700">{availablePicks.length}</div>
                                    <div className="text-sm text-slate-600">Available Picks</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <User className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">{myPicks.length}</div>
                                    <div className="text-sm text-slate-600">My Active Picks</div>
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
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                )}
                            >
                                Available Picks ({availablePicks.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('my_picks')}
                                className={cn(
                                    'px-4 py-2 font-medium border-b-2 transition-colors',
                                    activeTab === 'my_picks'
                                        ? 'border-emerald-500 text-emerald-700'
                                        : 'border-transparent text-slate-600 hover:text-slate-900'
                                )}
                            >
                                My Picks ({myPicks.length})
                            </button>
                        </div>
                    </div>

                    {/* Scan Mode */}
                    {scanMode && selectedPick && (
                        <Card variant="elevated" className="mb-8 bg-white border border-blue-200 shadow-sm">
                            <div className="text-center py-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Scan Location to Confirm Pick
                                </h3>
                                <div className="text-6xl font-mono font-bold text-blue-500 my-6">
                                    {selectedPick.location.barcode}
                                </div>
                                <p className="text-slate-600 mb-6">
                                    Pick {selectedPick.quantity} units of {selectedPick.product.name}
                                </p>
                                <div className="max-w-md mx-auto space-y-4">
                                    <Input
                                        placeholder="Scan location barcode..."
                                        leftIcon={<Scan className="w-5 h-5" />}
                                        autoFocus
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleCompletePick(selectedPick.id);
                                            }
                                        }}
                                    />
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        onClick={() => {
                                            setScanMode(false);
                                            setSelectedPick(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Available Picks Tab */}
                    {activeTab === 'available' && (
                        <Card variant="elevated" padded={false} className="bg-white border border-slate-200 shadow-sm">
                            <div className="p-6 border-b border-slate-200">
                                <CardHeader
                                    title="Available Picks"
                                    subtitle={`${availablePicks.length} picks waiting to be assigned`}
                                />
                            </div>

                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    <p className="text-slate-600 mt-4">Loading picks...</p>
                                </div>
                            ) : availablePicks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No available picks</h3>
                                    <p className="text-slate-600">All picks are currently assigned</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {availablePicks.map((pick) => (
                                        <div key={pick.id} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-6 h-6 text-blue-600" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900 mb-1">
                                                                {pick.product.name}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                SKU: {pick.product.sku}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-slate-900">
                                                                {pick.quantity}
                                                            </div>
                                                            <div className="text-xs text-slate-600">units</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span className="font-mono">{pick.location.barcode}</span>
                                                        </div>
                                                        <div>Order: {pick.shipment.order_number}</div>
                                                    </div>

                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handlePullPick(pick.id)}
                                                        disabled={actioningId === pick.id}
                                                    >
                                                        {actioningId === pick.id ? 'Pulling...' : 'Pull Pick'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}

                    {/* My Picks Tab */}
                    {activeTab === 'my_picks' && (
                        <Card variant="elevated" padded={false} className="bg-white border border-slate-200 shadow-sm">
                            <div className="p-6 border-b border-slate-200">
                                <CardHeader
                                    title="My Active Picks"
                                    subtitle={`${myPicks.length} picks assigned to you`}
                                />
                            </div>

                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                    <p className="text-slate-600 mt-4">Loading your picks...</p>
                                </div>
                            ) : myPicks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No active picks</h3>
                                    <p className="text-slate-600 mb-6">Pull a pick from available picks to get started</p>
                                    <Button
                                        variant="primary"
                                        onClick={() => setActiveTab('available')}
                                    >
                                        View Available Picks
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200">
                                    {myPicks.map((pick) => (
                                        <div key={pick.id} className="p-6 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-6 h-6 text-emerald-600" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900 mb-1">
                                                                {pick.product.name}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                SKU: {pick.product.sku}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-slate-900">
                                                                {pick.quantity}
                                                            </div>
                                                            <div className="text-xs text-slate-600">units</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-4 h-4" />
                                                            <span className="font-mono">{pick.location.barcode}</span>
                                                        </div>
                                                        <div>Order: {pick.shipment.order_number}</div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleStartScan(pick)}
                                                        >
                                                            Start Picking
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleReleasePick(pick.id)}
                                                            disabled={actioningId === pick.id}
                                                        >
                                                            {actioningId === pick.id ? 'Releasing...' : 'Release Pick'}
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
                                <h4 className="font-semibold text-blue-900 mb-1">Picking Tips</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Pull picks from the available queue to start working</li>
                                    <li>• Scan location barcodes to confirm picks</li>
                                    <li>• Release picks if you can't complete them</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
