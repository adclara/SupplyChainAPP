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
    Search,
    Filter,
    AlertTriangle,
} from 'lucide-react';
import { addStock, getReceivingLocation, getQuarantineLocation } from '@/services/inventoryService';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TH, TR, TD } from '@/components/ui/Table';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getInboundShipments,
    startReceiving,
    receiveItem,
    completeReceiving,
    getInboundLines,
    createInboundShipment,
    type InboundShipment,
    type InboundLineWithDetails,
    type CreateInboundShipmentParams,
} from '@/services/inboundService';
import { Modal } from '@/components/ui/Modal';
import { createShipmentSchema, manualReceiveSchema, type CreateShipmentValues } from '@/lib/validations/inbound';
import { Plus, FileText } from 'lucide-react';
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

    // Create Shipment Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState<CreateShipmentValues>({
        asn_number: '',
        supplier_name: '',
        expected_date: new Date().toISOString().split('T')[0],
        carrier: '',
    });
    const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

    // Manual Receive Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualQty, setManualQty] = useState('');
    const [manualBarcode, setManualBarcode] = useState('');
    const [isDamaged, setIsDamaged] = useState(false);
    const [damageNotes, setDamageNotes] = useState('');

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'receiving' | 'received'>('all');

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

            // Update Inventory
            try {
                if (user?.warehouse_id && user?.id) {
                    const locId = await getReceivingLocation(user.warehouse_id);
                    await addStock(
                        user.warehouse_id,
                        matchingLine.product_id,
                        locId,
                        1,
                        user.id,
                        receivingShipment.id
                    );
                }
            } catch (invError) {
                console.error('Inventory sync failed:', invError);
                // Don't block the UI flow, but maybe warn?
            }

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

    async function handleCreateShipment() {
        if (!user?.warehouse_id) return;

        try {
            // Validate
            const validated = createShipmentSchema.parse(createForm);
            setCreateErrors({});

            await createInboundShipment({
                ...validated,
                warehouse_id: user.warehouse_id,
                carrier: validated.carrier || undefined
            });

            toast.success('Shipment created successfully');
            setIsCreateModalOpen(false);
            setCreateForm({
                asn_number: '',
                supplier_name: '',
                expected_date: new Date().toISOString().split('T')[0],
                carrier: '',
            });
            fetchShipments();
        } catch (error: any) {
            if (error.issues) {
                const errors: Record<string, string> = {};
                error.issues.forEach((issue: any) => {
                    errors[issue.path[0]] = issue.message;
                });
                setCreateErrors(errors);
            } else {
                toast.error('Failed to create shipment');
            }
        }
    }

    async function handleManualReceive() {
        if (!receivingShipment || !manualBarcode || !manualQty) return;

        try {
            const qty = parseInt(manualQty);
            if (isNaN(qty) || qty <= 0) {
                toast.error('Invalid quantity');
                return;
            }

            const matchingLine = lines.find(
                line => line.product.barcode === manualBarcode.trim() || line.product.sku === manualBarcode.trim()
            );

            if (!matchingLine) {
                toast.error('Item not found');
                return;
            }

            if ((matchingLine.received_quantity + qty) > matchingLine.expected_quantity) {
                if (!confirm(`Warning: You are receiving more than expected (${matchingLine.expected_quantity}). Continue?`)) {
                    return;
                }
            }

            await receiveItem(matchingLine.id, qty);

            const updatedLines = await getInboundLines(receivingShipment.id);
            setLines(updatedLines);

            // Update Inventory
            try {
                if (user?.warehouse_id && user?.id) {
                    let locId: string;

                    if (isDamaged) {
                        try {
                            locId = await getQuarantineLocation(user.warehouse_id);
                        } catch {
                            // If no quarantine, fallback to receiving but warn
                            toast.error('No Quarantine location found! Using Dock.');
                            locId = await getReceivingLocation(user.warehouse_id);
                        }
                    } else {
                        locId = await getReceivingLocation(user.warehouse_id);
                    }

                    await addStock(
                        user.warehouse_id,
                        matchingLine.product_id,
                        locId,
                        qty,
                        user.id,
                        receivingShipment.id
                    );
                }
            } catch (invError) {
                console.error('Inventory sync failed:', invError);
            }

            toast.success(isDamaged ? `Reported ${qty}x Damaged` : `Received ${qty}x ${matchingLine.product.name}`);
            setManualQty('');
            setManualBarcode('');
            setIsDamaged(false);
            setDamageNotes('');
            setIsManualModalOpen(false);
        } catch (error) {
            toast.error('Failed to receive items');
        }
    }

    const stats = {
        scheduled: shipments.filter(s => s.status === 'scheduled').length,
        receiving: shipments.filter(s => s.status === 'receiving').length,
        received: shipments.filter(s => s.status === 'received').length,
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
                                <PackageCheck className="w-8 h-8 text-blue-500" />
                                Inbound Receiving
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Secure personnel portal for shipment intake and inventory verification
                            </p>
                        </div>
                        <Button
                            leftIcon={<Plus className="w-5 h-5" />}
                            variant="primary"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Register Shipment
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Scheduled', val: stats.scheduled, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { label: 'Receiving', val: stats.receiving, icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { label: 'Received', val: stats.received, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        ].map((s, i) => (
                            <Card key={i} className="bg-[#141417] border-[#27272a] p-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border border-white/5", s.bg, s.color)}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{s.label}</p>
                                        <p className="text-2xl font-bold text-white">{s.val}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Receiving Mode Console */}
                    {scanMode && receivingShipment && (
                        <Card className="mb-8 border-blue-500/20 bg-blue-500/5 overflow-hidden">
                            <div className="p-6 border-b border-blue-500/20 bg-blue-500/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Scan className="w-5 h-5 text-blue-400" />
                                        ACTIVE CONSOLE: {receivingShipment.asn_number}
                                    </h3>
                                    <p className="text-xs text-blue-400 font-mono mt-0.5 uppercase tracking-tighter">Secure Protocol: Intake & Verification</p>
                                </div>
                                <Badge variant="primary" glow>IN PROGRESS</Badge>
                            </div>

                            <div className="p-8">
                                {/* Lines Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                                    {lines.map((line) => {
                                        const progress = (line.received_quantity / line.expected_quantity) * 100;
                                        const isComplete = line.status === 'received';

                                        return (
                                            <div key={line.id} className={cn(
                                                "p-4 rounded-xl border transition-all",
                                                isComplete
                                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                                    : "bg-[#1c1c21] border-[#27272a]"
                                            )}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-bold text-white">{line.product.name}</p>
                                                        <p className="text-xs text-zinc-500 font-mono uppercase">SKU: {line.product.sku}</p>
                                                    </div>
                                                    {isComplete && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all duration-500",
                                                                isComplete ? "bg-emerald-500" : "bg-blue-500"
                                                            )}
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={cn(
                                                        "text-sm font-bold font-mono",
                                                        isComplete ? "text-emerald-400" : "text-zinc-400"
                                                    )}>
                                                        {line.received_quantity}/{line.expected_quantity}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                    <div className="text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-400 hover:text-blue-300"
                                            onClick={() => setIsManualModalOpen(true)}
                                        >
                                            Switch to Manual Entry
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Search by ASN, Supplier..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex bg-[#1c1c21] p-1 rounded-lg border border-white/5">
                            {(['all', 'scheduled', 'receiving', 'received'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all",
                                        statusFilter === status
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Shipments List */}
                    <Card className="overflow-hidden">
                        <CardHeader
                            title="Personnel intake Protocol"
                            subtitle={`${shipments.length} Pending shipments requiring verification`}
                            action={<Button variant="ghost" size="sm" onClick={fetchShipments}><Clock className="w-4 h-4 mr-2" /> Refresh Data</Button>}
                        />
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Shipment / ASN</TH>
                                    <TH>Supplier</TH>
                                    <TH>Carrier</TH>
                                    <TH>ETA</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Action</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {loading ? (
                                    <TR>
                                        <TD colSpan={6} className="py-24 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-zinc-500 font-bold tracking-widest uppercase">Syncing Manifest Data...</p>
                                        </TD>
                                    </TR>
                                ) : shipments.length === 0 ? (
                                    <TR>
                                        <TD colSpan={6} className="py-24 text-center">
                                            <PackageCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-zinc-500 mb-1 uppercase tracking-wider">No Manifests Found</h3>
                                            <p className="text-zinc-600">All scheduled cargo has been processed.</p>
                                        </TD>
                                    </TR>
                                ) : (
                                    shipments
                                        .filter(s => {
                                            const matchesSearch =
                                                s.asn_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());
                                            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
                                            return matchesSearch && matchesStatus;
                                        })
                                        .map((shipment) => (
                                            <TR key={shipment.id}>
                                                <TD>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center border",
                                                            shipment.status === 'scheduled' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                                'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                        )}>
                                                            <Truck className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white font-mono">{shipment.asn_number}</p>
                                                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">ID: {shipment.id.split('-')[0]}</p>
                                                        </div>
                                                    </div>
                                                </TD>
                                                <TD>
                                                    <p className="text-sm font-medium text-zinc-300">{shipment.supplier_name}</p>
                                                </TD>
                                                <TD>
                                                    <div className="flex items-center gap-2 text-zinc-400">
                                                        <Truck className="w-4 h-4 text-zinc-600" />
                                                        <span className="text-xs uppercase font-bold tracking-tight">{shipment.carrier || 'Unassigned'}</span>
                                                    </div>
                                                </TD>
                                                <TD className="text-xs font-mono text-zinc-500">
                                                    {new Date(shipment.expected_date).toLocaleDateString()}
                                                </TD>
                                                <TD>
                                                    <Badge
                                                        variant={shipment.status === 'scheduled' ? 'warning' : 'primary'}
                                                        glow={shipment.status === 'receiving'}
                                                    >
                                                        {shipment.status}
                                                    </Badge>
                                                </TD>
                                                <TD className="text-right">
                                                    {shipment.status === 'scheduled' && (
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-500"
                                                            leftIcon={<PackageCheck className="w-4 h-4" />}
                                                            onClick={() => handleStartReceiving(shipment)}
                                                            isLoading={actioningId === shipment.id}
                                                        >
                                                            Initiate Intake
                                                        </Button>
                                                    )}
                                                    {shipment.status === 'receiving' && (
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="border-blue-500/30 bg-blue-500/10 text-blue-400"
                                                            onClick={() => {
                                                                setReceivingShipment(shipment);
                                                                setScanMode(true);
                                                                getInboundLines(shipment.id).then(setLines);
                                                            }}
                                                        >
                                                            Resume Console
                                                        </Button>
                                                    )}
                                                </TD>
                                            </TR>
                                        ))
                                )}
                            </TBody>
                        </Table>
                    </Card>

                    {/* Operational Alerts */}
                    <Card className="mt-8 border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-start gap-4 p-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">Standard Operating Procedures</h4>
                                <ul className="text-xs text-zinc-400 space-y-1.5 list-none pl-0">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Verify physical manifest against digital record before initiating intake.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Report any transit damages via the "Problem Solve" terminal immediately.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Ensure LPN labels are clearly visible on all received pallets.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Create Shipment Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Register Inbound Shipment"
                    description="Enter ASN details to schedule a new delivery."
                    footer={
                        <>
                            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleCreateShipment}>Register ASN</Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">ASN Number</label>
                                <Input
                                    placeholder="e.g. ASN-2024-001"
                                    value={createForm.asn_number}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, asn_number: e.target.value }))}
                                    error={createErrors.asn_number}
                                />
                                {!createErrors.asn_number && (
                                    <p className="text-xs text-zinc-500">
                                        Letters, numbers, and dashes only (auto-converted to uppercase)
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Expected Date</label>
                                <Input
                                    type="date"
                                    value={createForm.expected_date}
                                    onChange={(e) => setCreateForm(prev => ({ ...prev, expected_date: e.target.value }))}
                                    error={createErrors.expected_date}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Supplier Name</label>
                            <Input
                                placeholder="Supplier Name"
                                value={createForm.supplier_name}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, supplier_name: e.target.value }))}
                                error={createErrors.supplier_name}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">Carrier (Optional)</label>
                            <Input
                                placeholder="e.g. FedEx, UPS"
                                value={createForm.carrier}
                                onChange={(e) => setCreateForm(prev => ({ ...prev, carrier: e.target.value }))}
                            />
                        </div>
                    </div>
                </Modal>

                {/* Manual Receive Modal */}
                <Modal
                    isOpen={isManualModalOpen}
                    onClose={() => setIsManualModalOpen(false)}
                    title="Manual Reception"
                    description="Manually enter quantity for a specific SKU."
                >
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Product Barcode / SKU</label>
                            <Input
                                placeholder="Scan or type barcode..."
                                value={manualBarcode}
                                onChange={(e) => setManualBarcode(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Quantity</label>
                            <Input
                                type="number"
                                placeholder="Qty"
                                value={manualQty}
                                onChange={(e) => setManualQty(e.target.value)}
                            />
                        </div>

                        {/* Discrepancy / Damage Toggle */}
                        <div className="pt-2 border-t border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                <input
                                    type="checkbox"
                                    checked={isDamaged}
                                    onChange={(e) => setIsDamaged(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500/50"
                                />
                                <span className={cn("text-sm font-medium", isDamaged ? "text-red-400" : "text-zinc-400")}>
                                    Report as Damaged / Quality Issue
                                </span>
                            </label>

                            {isDamaged && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md mb-3">
                                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                                        <div className="text-xs text-red-200">
                                            Items will be flagged and routed to Quarantine for inspection.
                                        </div>
                                    </div>
                                    <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Damage Notes</label>
                                    <Input
                                        placeholder="Describe issue (e.g. crushed box)..."
                                        value={damageNotes}
                                        onChange={(e) => setDamageNotes(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="ghost" onClick={() => setIsManualModalOpen(false)}>Cancel</Button>
                            <Button
                                variant={isDamaged ? "danger" : "primary"}
                                onClick={handleManualReceive}
                            >
                                {isDamaged ? 'Flag Issue' : 'Confirm Receive'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </main>
        </div>
    );
}
