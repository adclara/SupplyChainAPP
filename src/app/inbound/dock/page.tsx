/**
 * Inbound - Dock Management Page
 * @description Assign inbound shipments to dock doors and carriers
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    Truck,
    MapPin,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getInboundShipments,
    assignToDock,
    getAvailableDockDoors,
    type InboundShipment,
    type DockAssignment,
} from '@/services/inboundService';
import { toast } from 'react-hot-toast';

const CARRIER_OPTIONS = [
    { value: 'fedex', label: 'FedEx', color: 'text-purple-700' },
    { value: 'ups', label: 'UPS', color: 'text-amber-700' },
    { value: 'dhl', label: 'DHL', color: 'text-red-700' },
    { value: 'usps', label: 'USPS', color: 'text-blue-700' },
    { value: 'private', label: 'Private Fleet', color: 'text-emerald-700' },
];

export default function DockPage(): React.JSX.Element {
    const { user } = useUserStore();
    const [shipments, setShipments] = useState<InboundShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [dockDoors, setDockDoors] = useState<string[]>([]);
    const [assigningShipment, setAssigningShipment] = useState<InboundShipment | null>(null);
    const [selectedDoor, setSelectedDoor] = useState('');
    const [selectedCarrier, setSelectedCarrier] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [actioningId, setActioningId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.warehouse_id) {
            fetchData();
        }
    }, [user?.warehouse_id]);

    /**
     * Fetch shipments and dock doors
     */
    async function fetchData() {
        if (!user?.warehouse_id) return;

        try {
            setLoading(true);
            const [shipmentsData, doorsData] = await Promise.all([
                getInboundShipments(user.warehouse_id),
                getAvailableDockDoors(user.warehouse_id),
            ]);
            setShipments(shipmentsData);
            setDockDoors(doorsData);
        } catch (error) {
            toast.error('Failed to load data');
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Open assignment modal
     */
    function handleOpenAssignment(shipment: InboundShipment) {
        setAssigningShipment(shipment);
        setSelectedDoor(shipment.dock_door || '');
        setSelectedCarrier(shipment.carrier || '');

        // Set default arrival time to shipment's expected date
        const expectedDate = new Date(shipment.expected_date);
        setArrivalTime(expectedDate.toISOString().slice(0, 16));
    }

    /**
     * Assign to dock
     */
    async function handleAssignToDock() {
        if (!assigningShipment || !selectedDoor || !selectedCarrier || !arrivalTime) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            setActioningId(assigningShipment.id);

            const assignment: DockAssignment = {
                dock_door: selectedDoor,
                carrier: selectedCarrier,
                arrival_time: new Date(arrivalTime).toISOString(),
            };

            await assignToDock(assigningShipment.id, assignment);
            toast.success(`Assigned ${assigningShipment.asn_number} to ${selectedDoor}`);

            setAssigningShipment(null);
            setSelectedDoor('');
            setSelectedCarrier('');
            setArrivalTime('');
            await fetchData();
        } catch (error) {
            toast.error('Failed to assign to dock');
            console.error('Error assigning to dock:', error);
        } finally {
            setActioningId(null);
        }
    }

    const stats = {
        total: shipments.length,
        assigned: shipments.filter(s => s.dock_door && s.carrier).length,
        unassigned: shipments.filter(s => !s.dock_door || !s.carrier).length,
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Dock Management</h1>
                            <p className="text-slate-600 mt-1">
                                Assign inbound shipments to dock doors and carriers
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                                    <div className="text-sm text-slate-600">Total Shipments</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.assigned}</div>
                                    <div className="text-sm text-slate-600">Assigned</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-slate-900">{stats.unassigned}</div>
                                    <div className="text-sm text-slate-600">Unassigned</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Assignment Modal */}
                    {assigningShipment && (
                        <Card variant="elevated" className="mb-8 bg-white border border-slate-200 shadow-sm">
                            <div className="py-8">
                                <h3 className="text-xl font-bold text-slate-900 text-center mb-4">
                                    Assign {assigningShipment.asn_number}
                                </h3>
                                <p className="text-center text-slate-600 mb-6">
                                    Supplier: {assigningShipment.supplier_name}
                                </p>

                                <div className="max-w-2xl mx-auto space-y-6">
                                    {/* Dock Door Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Select Dock Door
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {dockDoors.map((door) => (
                                                <button
                                                    key={door}
                                                    onClick={() => setSelectedDoor(door)}
                                                    className={cn(
                                                        'p-4 rounded-lg border-2 transition-all text-center font-semibold',
                                                        selectedDoor === door
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                                                    )}
                                                >
                                                    <MapPin className="w-5 h-5 mx-auto mb-1" />
                                                    {door}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Carrier Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Select Carrier
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {CARRIER_OPTIONS.map((carrier) => (
                                                <button
                                                    key={carrier.value}
                                                    onClick={() => setSelectedCarrier(carrier.value)}
                                                    className={cn(
                                                        'p-4 rounded-lg border-2 transition-all text-center font-semibold',
                                                        selectedCarrier === carrier.value
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    )}
                                                >
                                                    <Truck className="w-5 h-5 mx-auto mb-1" />
                                                    <span className={selectedCarrier === carrier.value ? '' : carrier.color}>
                                                        {carrier.label}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Arrival Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Scheduled Arrival Time
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={arrivalTime}
                                            onChange={(e) => setArrivalTime(e.target.value)}
                                            leftIcon={<Calendar className="w-5 h-5" />}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={handleAssignToDock}
                                            disabled={actioningId === assigningShipment.id || !selectedDoor || !selectedCarrier || !arrivalTime}
                                        >
                                            {actioningId === assigningShipment.id ? 'Assigning...' : 'Assign to Dock'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setAssigningShipment(null);
                                                setSelectedDoor('');
                                                setSelectedCarrier('');
                                                setArrivalTime('');
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
                                subtitle={`${shipments.length} shipments to manage`}
                            />
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-slate-600 mt-4">Loading shipments...</p>
                            </div>
                        ) : shipments.length === 0 ? (
                            <div className="p-12 text-center">
                                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No shipments</h3>
                                <p className="text-slate-600">No inbound shipments to assign</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {shipments.map((shipment) => {
                                    const isAssigned = shipment.dock_door && shipment.carrier;

                                    return (
                                        <div
                                            key={shipment.id}
                                            className="p-6 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                                    isAssigned ? 'bg-emerald-100' : 'bg-amber-100'
                                                )}>
                                                    {isAssigned ? (
                                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                                    ) : (
                                                        <Clock className="w-6 h-6 text-amber-600" />
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
                                                            <p className="text-sm text-slate-600 mt-1">
                                                                Expected: {new Date(shipment.expected_date).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <span className={cn(
                                                            'px-3 py-1 rounded-full text-xs font-semibold border',
                                                            isAssigned
                                                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                                : 'text-amber-700 bg-amber-50 border-amber-200'
                                                        )}>
                                                            {isAssigned ? 'ASSIGNED' : 'PENDING'}
                                                        </span>
                                                    </div>

                                                    {isAssigned ? (
                                                        <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                                <span className="font-medium">{shipment.dock_door}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Truck className="w-4 h-4 text-blue-500" />
                                                                <span className="font-medium capitalize">{shipment.carrier}</span>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    <Button
                                                        variant={isAssigned ? "secondary" : "primary"}
                                                        size="sm"
                                                        onClick={() => handleOpenAssignment(shipment)}
                                                    >
                                                        {isAssigned ? 'Reassign' : 'Assign to Dock'}
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
                    <Card variant="elevated" className="mt-8 bg-blue-50 border border-blue-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-900 mb-1">Dock Management Tips</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Assign dock doors based on shipment size and priority</li>
                                    <li>• Schedule arrival times to avoid dock congestion</li>
                                    <li>• Coordinate with carriers for accurate ETAs</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
