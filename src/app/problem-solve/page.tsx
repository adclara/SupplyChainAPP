/**
 * Problem Solve Page
 * @description Manage and resolve warehouse problem tickets
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    User,
    Package,
    MapPin,
    X,
    FileText,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import {
    getProblemTickets,
    getMyTickets,
    assignTicket,
    resolveTicket,
    reopenTicket,
    getTicketStats,
    type ProblemTicketWithDetails,
} from '@/services/problemService';
import { toast } from 'react-hot-toast';

const PRIORITY_CONFIG = {
    critical: {
        label: 'CRITICAL',
        color: 'text-red-700 bg-red-50 border-red-200',
        icon: AlertTriangle,
    },
    high: {
        label: 'HIGH',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: AlertTriangle,
    },
    medium: {
        label: 'MEDIUM',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: Clock,
    },
    low: {
        label: 'LOW',
        color: 'text-slate-700 bg-slate-50 border-slate-200',
        icon: Clock,
    },
};

const TYPE_LABELS = {
    count_variance: 'Count Variance',
    damage: 'Damage',
    missing: 'Missing Item',
    quality: 'Quality Issue',
    system_error: 'System Error',
    other: 'Other',
};

export default function ProblemSolvePage(): React.JSX.Element {
    const { user } = useUserStore();
    const [activeTab, setActiveTab] = useState<'all' | 'my_tickets'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [allTickets, setAllTickets] = useState<ProblemTicketWithDetails[]>([]);
    const [myTickets, setMyTickets] = useState<ProblemTicketWithDetails[]>([]);
    const [stats, setStats] = useState({
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        critical: 0,
        high: 0,
        total: 0,
    });
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [resolvingTicket, setResolvingTicket] = useState<ProblemTicketWithDetails | null>(null);
    const [resolution, setResolution] = useState('');

    useEffect(() => {
        if (user?.warehouse_id && user?.id) {
            fetchData();
        }
    }, [user?.warehouse_id, user?.id, filterStatus]);

    async function fetchData() {
        if (!user?.warehouse_id || !user?.id) return;

        try {
            setLoading(true);
            const [ticketsData, myTicketsData, statsData] = await Promise.all([
                getProblemTickets(user.warehouse_id, filterStatus === 'all' ? undefined : filterStatus as any),
                getMyTickets(user.id),
                getTicketStats(user.warehouse_id),
            ]);
            setAllTickets(ticketsData);
            setMyTickets(myTicketsData);
            setStats(statsData);
        } catch (error) {
            toast.error('Failed to load tickets');
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAssignToMe(ticketId: string) {
        if (!user?.id) return;

        try {
            setActioningId(ticketId);
            await assignTicket(ticketId, user.id);
            toast.success('Ticket assigned to you');
            await fetchData();
            setActiveTab('my_tickets');
        } catch (error) {
            toast.error('Failed to assign ticket');
            console.error('Error assigning ticket:', error);
        } finally {
            setActioningId(null);
        }
    }

    async function handleResolve() {
        if (!resolvingTicket || !user?.id || !resolution.trim()) {
            toast.error('Please enter a resolution');
            return;
        }

        try {
            setActioningId(resolvingTicket.id);
            await resolveTicket(resolvingTicket.id, {
                resolution: resolution.trim(),
                resolved_by: user.id,
            });
            toast.success('Ticket resolved');
            setResolvingTicket(null);
            setResolution('');
            await fetchData();
        } catch (error) {
            toast.error('Failed to resolve ticket');
            console.error('Error resolving ticket:', error);
        } finally {
            setActioningId(null);
        }
    }

    async function handleReopen(ticketId: string) {
        try {
            setActioningId(ticketId);
            await reopenTicket(ticketId);
            toast.success('Ticket reopened');
            await fetchData();
        } catch (error) {
            toast.error('Failed to reopen ticket');
            console.error('Error reopening ticket:', error);
        } finally {
            setActioningId(null);
        }
    }

    const displayTickets = activeTab === 'all' ? allTickets : myTickets;

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Problem Solve</h1>
                            <p className="text-slate-600 mt-1">
                                Manage and resolve warehouse problem tickets
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <Card variant="elevated" className="bg-white border border-red-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                                    <div className="text-sm text-slate-600">Critical</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-amber-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-amber-700">{stats.open}</div>
                                    <div className="text-sm text-slate-600">Open</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-700">{stats.in_progress}</div>
                                    <div className="text-sm text-slate-600">In Progress</div>
                                </div>
                            </div>
                        </Card>

                        <Card variant="elevated" className="bg-white border border-emerald-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-emerald-700">{stats.resolved}</div>
                                    <div className="text-sm text-slate-600">Resolved</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Tabs & Filters */}
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex gap-4 border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={cn(
                                    'px-4 py-2 font-medium border-b-2 transition-colors',
                                    activeTab === 'all'
                                        ? 'border-blue-500 text-blue-700'
                                        : 'border-transparent text-slate-600 hover:text-slate-800'
                                )}
                            >
                                All Tickets ({allTickets.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('my_tickets')}
                                className={cn(
                                    'px-4 py-2 font-medium border-b-2 transition-colors',
                                    activeTab === 'my_tickets'
                                        ? 'border-emerald-500 text-emerald-700'
                                        : 'border-transparent text-slate-600 hover:text-slate-800'
                                )}
                            >
                                My Tickets ({myTickets.length})
                            </button>
                        </div>

                        {activeTab === 'all' && (
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        )}
                    </div>

                    {/* Resolve Modal */}
                    {resolvingTicket && (
                        <Card variant="elevated" className="mb-8 bg-white border border-emerald-200">
                            <div className="py-8 px-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        Resolve Ticket #{resolvingTicket.id.slice(0, 8)}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setResolvingTicket(null);
                                            setResolution('');
                                        }}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-600" />
                                    </button>
                                </div>
                                <p className="text-slate-600 mb-4">{resolvingTicket.description}</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Resolution Notes
                                        </label>
                                        <textarea
                                            value={resolution}
                                            onChange={(e) => setResolution(e.target.value)}
                                            placeholder="Describe how the problem was resolved..."
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                                            rows={4}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            leftIcon={<CheckCircle className="w-4 h-4" />}
                                            onClick={handleResolve}
                                            disabled={actioningId === resolvingTicket.id || !resolution.trim()}
                                        >
                                            {actioningId === resolvingTicket.id ? 'Resolving...' : 'Mark as Resolved'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setResolvingTicket(null);
                                                setResolution('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Tickets List */}
                    <Card variant="elevated" padded={false} className="bg-white border border-slate-200">
                        <div className="p-6 border-b border-slate-200">
                            <CardHeader
                                title={activeTab === 'all' ? 'All Problem Tickets' : 'My Assigned Tickets'}
                                subtitle={`${displayTickets.length} tickets`}
                            />
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p className="text-slate-600 mt-4">Loading tickets...</p>
                            </div>
                        ) : displayTickets.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets</h3>
                                <p className="text-slate-500">
                                    {activeTab === 'all'
                                        ? 'No problem tickets found'
                                        : 'You have no assigned tickets'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200">
                                {displayTickets.map((ticket) => {
                                    const config = PRIORITY_CONFIG[ticket.priority];
                                    const Icon = config.icon;
                                    const isActioning = actioningId === ticket.id;

                                    return (
                                        <div
                                            key={ticket.id}
                                            className={cn(
                                                'p-6 hover:bg-slate-50 transition-colors',
                                                ticket.priority === 'critical' && 'bg-red-50/30 border-l-4 border-l-red-500'
                                            )}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                                    ticket.status === 'resolved' ? 'bg-emerald-100' :
                                                        ticket.priority === 'critical' ? 'bg-red-100' :
                                                            ticket.priority === 'high' ? 'bg-amber-100' :
                                                                'bg-blue-100'
                                                )}>
                                                    {ticket.status === 'resolved' ? (
                                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                                    ) : (
                                                        <Icon className={cn(
                                                            "w-6 h-6",
                                                            ticket.priority === 'critical' ? 'text-red-600' :
                                                                ticket.priority === 'high' ? 'text-amber-600' :
                                                                    'text-blue-600'
                                                        )} />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={cn(
                                                                    'px-2.5 py-1 rounded-full text-xs font-bold border',
                                                                    config.color
                                                                )}>
                                                                    {config.label}
                                                                </span>
                                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                                    {TYPE_LABELS[ticket.ticket_type]}
                                                                </span>
                                                                {ticket.status === 'resolved' && (
                                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                                        Resolved
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm font-medium text-slate-900 mt-2">
                                                                {ticket.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {(ticket.product || ticket.location) && (
                                                        <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
                                                            {ticket.product && (
                                                                <div className="flex items-center gap-2">
                                                                    <Package className="w-4 h-4 text-blue-500" />
                                                                    <span>{ticket.product.sku} - {ticket.product.name}</span>
                                                                </div>
                                                            )}
                                                            {ticket.location && (
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-4 h-4 text-amber-500" />
                                                                    <span>{ticket.location.barcode}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {ticket.resolution && (
                                                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                                            <div className="flex items-start gap-2 text-sm">
                                                                <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="font-medium text-emerald-900 mb-1">Resolution:</p>
                                                                    <p className="text-emerald-800">{ticket.resolution}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        {ticket.status === 'open' && (
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => handleAssignToMe(ticket.id)}
                                                                disabled={isActioning}
                                                            >
                                                                {isActioning ? 'Assigning...' : 'Assign to Me'}
                                                            </Button>
                                                        )}
                                                        {ticket.status === 'in_progress' && ticket.assigned_to === user?.id && (
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                leftIcon={<CheckCircle className="w-4 h-4" />}
                                                                onClick={() => setResolvingTicket(ticket)}
                                                            >
                                                                Resolve
                                                            </Button>
                                                        )}
                                                        {ticket.status === 'resolved' && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleReopen(ticket.id)}
                                                                disabled={isActioning}
                                                            >
                                                                Reopen
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
