/**
 * Inbound - Receive Page
 * @description Receive inbound shipments and scan items
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    PackageCheck,
    Scan,
    CheckCircle,
    Clock,
    Package,
    AlertCircle,
    Truck,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getInboundShipments,
    startReceiving,
    receiveItem,
    completeReceiving,
    getInboundLines,
    type InboundShipment,
    type InboundLineWithDetails,
} from '@/services/inboundService';
import { toast } from 'react-hot-toast';

export default function ReceivePage(): React.JSX.Element {
    const { user } = useUserStore();
    const [shipments, setShipments] = useState<InboundShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [receivingShipment, setReceivingShipment] = useState<InboundShipment | null>(null);
    const [lines, setLines] = useState<InboundLineWithDetails[]>([]);
    const [scanMode, setScanMode] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [actioningId, setActioningId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.warehouse_id) {
            fetchShipments();
        }
    }, [user?.warehouse_id]);

    /**
     * Fetch inbound shipments
     */
    async function fetchShipments() {
        if (!user?.warehouse_id) return;

        try {
            setLoading(true);
            const data = await getInboundShipments(user.warehouse_id);
            setShipments(data);
        } catch (error) {
            toast.error('Failed to load shipments');
            console.error('Error fetching shipments:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Start receiving a shipment
     */
    async function handleStartReceiving(shipment: InboundShipment) {
        try {
            setActioningId(shipment.id);
            await startReceiving(shipment.id);

            // Load lines for this shipment
            const shipmentLines = await getInboundLines(shipment.id);
            setLines(shipmentLines);
            setReceivingShipment(shipment);
            setScanMode(true);

            toast.success(`Started receiving ${shipment.asn_number}`);
        } catch (error) {
            toast.error('Failed to start receiving');
            console.error('Error starting receiving:', error);
        } finally {
            setActioningId(null);
        }
    }

    /**
     * Handle barcode scan
     */
    async function handleScan(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter' || !scannedBarcode || !receivingShipment) return;

        try {
            // Find matching line by product barcode
            const matchingLine = lines.find(
                line => line.product.barcode === scannedBarcode.trim()
            );

            if (!matchingLine) {
                toast.error('Item not found in this shipment');
                setScannedBarcode('');
                return;
            }

            if (matchingLine.status === 'received') {
                toast.error('Item already fully received');
                setScannedBarcode('');
                return;
            }

            // Receive 1 unit
            await receiveItem(matchingLine.id, 1);

            // Refresh lines
            const updatedLines = await getInboundLines(receivingShipment.id);
            setLines(updatedLines);

            toast.success(`Received 1x ${matchingLine.product.name}`);
            setScannedBarcode('');
        } catch (error) {
            toast.error('Failed to receive item');
            console.error('Error receiving item:', error);
        }
    }

    /**
     * Complete receiving
     */
    async function handleCompleteReceiving() {
        if (!receivingShipment) return;

        try {
            await completeReceiving(receivingShipment.id);
            toast.success('Receiving completed');

            setScanMode(false);
            setReceivingShipment(null);
            setLines([]);
            await fetchShipments();
        } catch (error) {
            toast.error('Failed to complete receiving');
            console.error('Error completing receiving:', error);
        }
    }

    const stats = {
        scheduled: shipments.filter(s => s.status === 'scheduled').length,
        receiving: shipments.filter(s => s.status === 'receiving').length,
        received: shipments.filter(s => s.status === 'received').length,
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Receiving</h1>
                            <p className="text-slate-600 mt-1">
                                Receive inbound shipments and scan items
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.scheduled}</div>
                                    <div className="text-sm text-slate-600">Scheduled</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.receiving}</div>
                                    <div className="text-sm text-slate-600">Receiving</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.received}</div>
                                    <div className="text-sm text-slate-600">Received</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Receiving Mode */}
                    {scanMode && receivingShipment && (
                        <Card variant="elevated" className="mb-8 bg-white border border-slate-200 shadow-sm">
                            <div className="py-8">
                                <h3 className="text-xl font-bold text-slate-900 text-center mb-4">
                                    Receiving {receivingShipment.asn_number}
                                </h3>

                                {/* Progress */}
                                <div className="max-w-2xl mx-auto mb-6">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="space-y-2">
                                            {lines.map((line) => {
                                                const progress = (line.received_quantity / line.expected_quantity) * 100;
                                                const isComplete = line.status === 'received';

                                                return (
                                                    <div key={line.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-slate-900">{line.product.name}</p>
                                                            <p className="text-sm text-slate-600">SKU: {line.product.sku}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className={cn(
                                                                    "text-lg font-bold",
                                                                    isComplete ? "text-emerald-600" : "text-slate-900"
                                                                )}>
                                                                    {line.received_quantity} / {line.expected_quantity}
                                                                </p>
                                                                <div className="w-24 h-2 bg-slate-200 rounded-full mt-1">
                                                                    <div
                                                                        className={cn(
                                                                            "h-full rounded-full transition-all",
                                                                            isComplete ? "bg-emerald-500" : "bg-blue-500"
                                                                        )}
                                                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            {isComplete && (
                                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Scan Input */}
                                <div className="max-w-md mx-auto space-y-4">
                                    <Input
                                        placeholder="Scan item barcode..."
                                        value={scannedBarcode}
                                        onChange={(e) => setScannedBarcode(e.target.value)}
                                        onKeyPress={handleScan}
                                        leftIcon={<Scan className="w-5 h-5" />}
                                        autoFocus
                                        className="text-center text-lg"
                                    />
                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={handleCompleteReceiving}
                                        >
                                            Complete Receiving
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setScanMode(false);
                                                setReceivingShipment(null);
                                                setLines([]);
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
                                title="Inbound Shipments"
                                subtitle={`${shipments.length} shipments to receive`}
                            />
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-slate-600 mt-4">Loading shipments...</p>
                            </div>
                        ) : shipments.length === 0 ? (
                            <div className="p-12 text-center">
                                <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No inbound shipments</h3>
                                <p className="text-slate-600">All shipments have been received</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {shipments.map((shipment) => {
                                    const isActioning = actioningId === shipment.id;

                                    return (
                                        <div
                                            key={shipment.id}
                                            className="p-6 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                                    shipment.status === 'scheduled' ? 'bg-amber-100' :
                                                        shipment.status === 'receiving' ? 'bg-blue-100' :
                                                            'bg-emerald-100'
                                                )}>
                                                    {shipment.status === 'scheduled' ? (
                                                        <Clock className="w-6 h-6 text-amber-600" />
                                                    ) : shipment.status === 'receiving' ? (
                                                        <Package className="w-6 h-6 text-blue-600" />
                                                    ) : (
                                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <h3 className="font-mono font-bold text-lg text-slate-900 mb-1">
                                                                {shipment.asn_number}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                Supplier: {shipment.supplier_name}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                                                                <span>Expected: {new Date(shipment.expected_date).toLocaleDateString()}</span>
                                                                {shipment.carrier && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Truck className="w-4 h-4" />
                                                                        {shipment.carrier}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className={cn(
                                                            'px-3 py-1 rounded-full text-xs font-semibold border',
                                                            shipment.status === 'scheduled'
                                                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                                                : shipment.status === 'receiving'
                                                                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                                                                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                        )}>
                                                            {shipment.status.toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {shipment.status === 'scheduled' && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            leftIcon={<PackageCheck className="w-4 h-4" />}
                                                            onClick={() => handleStartReceiving(shipment)}
                                                            disabled={isActioning}
                                                        >
                                                            {isActioning ? 'Starting...' : 'Start Receiving'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>

                    {/* Info Card */}
                    <Card variant="elevated" className="mt-8 bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Receiving Tips</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Start receiving to begin scanning items</li>
                                    <li>• Scan each item's barcode to record receipt</li>
                                    <li>• Complete receiving when all items are scanned</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
