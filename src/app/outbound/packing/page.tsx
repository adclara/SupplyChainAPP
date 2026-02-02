/**
 * Outbound - Packing Page
 * @description Pack shipments and generate shipping labels
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    Package,
    PrinterIcon,
    CheckCircle,
    Box,
    Truck,
    AlertCircle,
    Scan,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getPackableShipments,
    startPacking,
    generateLabel,
    type PackableShipment,
} from '@/services/packingService';
import { toast } from 'react-hot-toast';

const CARRIER_OPTIONS = [
    { value: 'fedex', label: 'FedEx', color: 'text-purple-700' },
    { value: 'ups', label: 'UPS', color: 'text-amber-700' },
    { value: 'dhl', label: 'DHL', color: 'text-red-700' },
    { value: 'usps', label: 'USPS', color: 'text-blue-700' },
];

export default function PackingPage(): React.JSX.Element {
    const { user } = useUserStore();
    const [shipments, setShipments] = useState<PackableShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [packingId, setPackingId] = useState<string | null>(null);
    const [generatingLabelId, setGeneratingLabelId] = useState<string | null>(null);
    const [selectedShipment, setSelectedShipment] = useState<PackableShipment | null>(null);
    const [selectedCarrier, setSelectedCarrier] = useState('');
    const [scanMode, setScanMode] = useState(false);

    useEffect(() => {
        if (user?.warehouse_id) {
            fetchShipments();
        }
    }, [user?.warehouse_id]);

    /**
     * Fetch packable shipments
     */
    async function fetchShipments() {
        if (!user?.warehouse_id) return;

        try {
            setLoading(true);
            const data = await getPackableShipments(user.warehouse_id);
            setShipments(data);
        } catch (error) {
            toast.error('Failed to load shipments');
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Start packing a shipment
     */
    async function handleStartPacking(shipment: PackableShipment) {
        try {
            setPackingId(shipment.id);
            await startPacking(shipment.id);
            toast.success(`Packing started for ${shipment.order_number}`);
            setSelectedShipment(shipment);
            setScanMode(true);
            await fetchShipments();
        } catch (error) {
            toast.error('Failed to start packing');
            console.error('Error starting packing:', error);
        } finally {
            setPackingId(null);
        }
    }

    /**
     * Generate shipping label
     */
    async function handleGenerateLabel(shipmentId: string, orderNumber: string) {
        if (!selectedCarrier) {
            toast.error('Please select a carrier');
            return;
        }

        try {
            setGeneratingLabelId(shipmentId);
            const labelUrl = await generateLabel(shipmentId, selectedCarrier);
            toast.success(`Label generated for ${orderNumber}`);

            // Open label in new window
            window.open(labelUrl, '_blank');

            setScanMode(false);
            setSelectedShipment(null);
            setSelectedCarrier('');
            await fetchShipments();
        } catch (error) {
            toast.error('Failed to generate label');
            console.error('Error generating label:', error);
        } finally {
            setGeneratingLabelId(null);
        }
    }

    const stats = {
        ready: shipments.length,
        packed: shipments.filter(s => s.status === 'packed').length,
    };

    return (
        <div className="min-h-screen bg-white">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Packing</h1>
                            <p className="text-slate-600 mt-1">
                                Pack shipments and generate shipping labels
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <Box className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-700">{stats.ready}</div>
                                    <div className="text-sm text-slate-600">Ready to Pack</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">{stats.packed}</div>
                                    <div className="text-sm text-slate-600">Packed Today</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Packing Workflow */}
                    {scanMode && selectedShipment && (
                        <Card variant="elevated" className="mb-8 bg-white border border-slate-200 shadow-sm">
                            <div className="text-center py-8">
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    Packing {selectedShipment.order_number}
                                </h3>

                                {/* Items to Pack */}
                                <div className="max-w-2xl mx-auto mb-6">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-slate-900 mb-3">Items in this shipment:</h4>
                                        <div className="space-y-2">
                                            {selectedShipment.shipment_lines.map((line) => (
                                                <div key={line.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                                    <div className="text-left">
                                                        <p className="font-medium text-slate-900">{line.product.name}</p>
                                                        <p className="text-sm text-slate-600">SKU: {line.product.sku}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-slate-900">{line.quantity}</p>
                                                        <p className="text-xs text-slate-600">units</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Carrier Selection */}
                                <div className="max-w-md mx-auto space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Select Carrier
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {CARRIER_OPTIONS.map((carrier) => (
                                                <button
                                                    key={carrier.value}
                                                    onClick={() => setSelectedCarrier(carrier.value)}
                                                    className={cn(
                                                        'p-4 rounded-lg border-2 transition-all text-center font-semibold',
                                                        selectedCarrier === carrier.value
                                                            ? 'border-emerald-500 bg-emerald-50'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    )}
                                                >
                                                    <span className={selectedCarrier === carrier.value ? 'text-emerald-700' : carrier.color}>
                                                        {carrier.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            leftIcon={<PrinterIcon className="w-4 h-4" />}
                                            onClick={() => handleGenerateLabel(selectedShipment.id, selectedShipment.order_number)}
                                            disabled={!selectedCarrier || generatingLabelId === selectedShipment.id}
                                        >
                                            {generatingLabelId === selectedShipment.id ? 'Generating...' : 'Print Label'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setScanMode(false);
                                                setSelectedShipment(null);
                                                setSelectedCarrier('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Shipments List */}
                    <Card variant="elevated" padded={false} className="bg-white border border-slate-200 shadow-sm">
                        <div className="p-6 border-b border-slate-200">
                            <CardHeader
                                title="Ready to Pack"
                                subtitle={`${shipments.length} shipments waiting`}
                            />
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-slate-600 mt-4">Loading shipments...</p>
                            </div>
                        ) : shipments.length === 0 ? (
                            <div className="p-12 text-center">
                                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No shipments ready</h3>
                                <p className="text-slate-600">All shipments are picked or packed</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {shipments.map((shipment) => {
                                    const isPacking = packingId === shipment.id;

                                    return (
                                        <div
                                            key={shipment.id}
                                            className="p-6 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Package className="w-6 h-6 text-blue-600" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h3 className="font-mono font-bold text-lg text-slate-900 mb-1">
                                                                {shipment.order_number}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                Customer: {shipment.customer_name}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-slate-900">
                                                                {shipment.shipment_lines.length}
                                                            </div>
                                                            <div className="text-xs text-slate-600">items</div>
                                                        </div>
                                                    </div>

                                                    {/* Items Preview */}
                                                    <div className="mb-4">
                                                        <div className="text-xs text-slate-600 mb-2">Items:</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {shipment.shipment_lines.slice(0, 3).map((line) => (
                                                                <span key={line.id} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                                                    {line.quantity}x {line.product.sku}
                                                                </span>
                                                            ))}
                                                            {shipment.shipment_lines.length > 3 && (
                                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                                                                    +{shipment.shipment_lines.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        leftIcon={<Box className="w-4 h-4" />}
                                                        onClick={() => handleStartPacking(shipment)}
                                                        disabled={isPacking}
                                                    >
                                                        {isPacking ? 'Starting...' : 'Start Packing'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Info Card */}
                    <Card variant="elevated" className="mt-8 bg-emerald-50 border border-emerald-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-emerald-900 mb-1">Packing Tips</h4>
                                <ul className="text-sm text-emerald-800 space-y-1">
                                    <li>• Verify all items before packing</li>
                                    <li>• Select appropriate carrier for destination</li>
                                    <li>• Print label and attach to package</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
