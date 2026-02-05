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
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TH, TR, TD } from '@/components/ui/Table';
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
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Sidebar />

            <main className="main-content">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <Truck className="w-8 h-8 text-blue-500" />
                                Dock Management
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Operational control for inbound logistics and yard coordination
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Shipments', val: stats.total, icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { label: 'Assigned', val: stats.assigned, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { label: 'Unassigned', val: stats.unassigned, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
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

                    {/* Assignment Modal Console */}
                    {assigningShipment && (
                        <Card className="mb-8 border-blue-500/20 bg-blue-500/5 overflow-hidden">
                            <div className="p-6 border-b border-blue-500/20 bg-blue-500/10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                                        <MapPin className="w-5 h-5 text-blue-400" />
                                        Logistics Assignment: {assigningShipment.asn_number}
                                    </h3>
                                    <p className="text-xs text-blue-400 font-mono mt-0.5 uppercase">Supplier: {assigningShipment.supplier_name}</p>
                                </div>
                                <Badge variant="primary" glow>READY FOR DISPATCH</Badge>
                            </div>

                            <div className="p-8">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Dock Door Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                            Select Operational Dock Door
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            {dockDoors.map((door) => (
                                                <button
                                                    key={door}
                                                    onClick={() => setSelectedDoor(door)}
                                                    className={cn(
                                                        'p-4 rounded-xl border-2 transition-all group relative overflow-hidden',
                                                        selectedDoor === door
                                                            ? 'border-blue-500 bg-blue-500/10 text-white'
                                                            : 'border-[#27272a] bg-[#141417] text-zinc-500 hover:border-zinc-700'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute inset-0 bg-blue-500/5 opacity-0 transition-opacity",
                                                        selectedDoor === door && "opacity-100"
                                                    )} />
                                                    <MapPin className={cn(
                                                        "w-5 h-5 mx-auto mb-2 transition-colors",
                                                        selectedDoor === door ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400"
                                                    )} />
                                                    <span className="text-sm font-bold font-mono">{door}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Carrier Selection */}
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                                Assign Logistics Carrier
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {CARRIER_OPTIONS.map((carrier) => (
                                                    <button
                                                        key={carrier.value}
                                                        onClick={() => setSelectedCarrier(carrier.value)}
                                                        className={cn(
                                                            'flex items-center gap-3 p-3 rounded-lg border transition-all',
                                                            selectedCarrier === carrier.value
                                                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                                                : 'border-[#27272a] bg-[#141417] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                                        )}
                                                    >
                                                        <Truck className={cn("w-4 h-4", selectedCarrier === carrier.value ? "text-blue-400" : "text-zinc-600")} />
                                                        <span className="text-sm font-bold tracking-tight">{carrier.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Arrival Time */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                                                    Scheduled Arrival Window
                                                </label>
                                                <Input
                                                    type="datetime-local"
                                                    value={arrivalTime}
                                                    onChange={(e) => setArrivalTime(e.target.value)}
                                                    leftIcon={<Calendar className="w-5 h-5 text-blue-500" />}
                                                    className="bg-[#141417] border-[#27272a] text-white"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3 pt-4">
                                                <Button
                                                    variant="primary"
                                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                                    onClick={handleAssignToDock}
                                                    isLoading={actioningId === assigningShipment.id}
                                                    disabled={!selectedDoor || !selectedCarrier || !arrivalTime}
                                                >
                                                    Finalize Assignment
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    className="border-zinc-700 text-zinc-400 hover:bg-zinc-800"
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
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Shipments List */}
                    <Card className="overflow-hidden">
                        <CardHeader
                            title="Logistics Manifest Control"
                            subtitle={`${shipments.length} Active inbound shipments requiring dock assignment`}
                            action={<Button variant="ghost" size="sm" onClick={fetchData}><Clock className="w-4 h-4 mr-2" /> Refresh Manifest</Button>}
                        />
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Shipment / ASN</TH>
                                    <TH>Supplier</TH>
                                    <TH>Window</TH>
                                    <TH>Dock Door</TH>
                                    <TH>Carrier</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Action</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {loading ? (
                                    <TR>
                                        <TD colSpan={7} className="py-24 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-zinc-500 font-bold tracking-widest uppercase">Syncing Logistics Pipeline...</p>
                                        </TD>
                                    </TR>
                                ) : shipments.length === 0 ? (
                                    <TR>
                                        <TD colSpan={7} className="py-24 text-center">
                                            <Truck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                                            <h3 className="text-lg font-bold text-zinc-500 mb-1 uppercase tracking-wider">Yard is Clear</h3>
                                            <p className="text-zinc-600">No pending inbound shipments detected.</p>
                                        </TD>
                                    </TR>
                                ) : (
                                    shipments.map((shipment) => {
                                        const isAssigned = shipment.dock_door && shipment.carrier;
                                        return (
                                            <TR key={shipment.id}>
                                                <TD>
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center border",
                                                            isAssigned ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                                'bg-amber-500/10 border-amber-500/20 text-amber-500'
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
                                                <TD className="text-xs font-mono text-zinc-500">
                                                    {new Date(shipment.expected_date).toLocaleString()}
                                                </TD>
                                                <TD>
                                                    {shipment.dock_door ? (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3 h-3 text-blue-500" />
                                                            <span className="font-mono text-blue-400 font-bold">{shipment.dock_door}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-600 font-mono text-xs italic">Unassigned</span>
                                                    )}
                                                </TD>
                                                <TD>
                                                    {shipment.carrier ? (
                                                        <div className="flex items-center gap-2 text-zinc-300 capitalize">
                                                            <Truck className="w-3 h-3 text-zinc-600" />
                                                            <span className="text-xs font-bold tracking-tight">{shipment.carrier}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-600 text-xs italic">N/A</span>
                                                    )}
                                                </TD>
                                                <TD>
                                                    <Badge
                                                        variant={isAssigned ? 'success' : 'warning'}
                                                        glow={!isAssigned}
                                                    >
                                                        {isAssigned ? 'ASSIGNED' : 'PENDING'}
                                                    </Badge>
                                                </TD>
                                                <TD className="text-right">
                                                    <Button
                                                        variant={isAssigned ? "secondary" : "primary"}
                                                        size="sm"
                                                        className={cn(
                                                            isAssigned ? "border-zinc-700 text-zinc-400" : "bg-blue-600 hover:bg-blue-500"
                                                        )}
                                                        onClick={() => handleOpenAssignment(shipment)}
                                                    >
                                                        {isAssigned ? 'Edit Route' : 'Designate Dock'}
                                                    </Button>
                                                </TD>
                                            </TR>
                                        );
                                    })
                                )}
                            </TBody>
                        </Table>
                    </Card>

                    {/* Operational Protocols */}
                    <Card className="mt-8 border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-start gap-4 p-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white uppercase tracking-wider text-sm mb-1">Yard Management protocols</h4>
                                <ul className="text-xs text-zinc-400 space-y-1.5 list-none pl-0">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Prioritize high-velocity stock (Category A) for Docks 1-3 near the primary intake belt.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Verify carrier credentials and seal numbers before authorizing bay engagement.
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500">▶</span>
                                        Maintain active radio communication with yard hostlers during all bay movements.
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
