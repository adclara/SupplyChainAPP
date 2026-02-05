/**
 * User Management Page
 * @description Admin page for creating and managing warehouse users
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    UserPlus,
    Shield,
    User as UserIcon,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Mail,
    Warehouse as WarehouseIcon
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, TBody, TH, TR, TD } from '@/components/ui/Table';
import { useUserStore } from '@/store/userStore';
import { getUsers, createUser, type CreateUserInput } from '@/services/userService';
import type { User, UserRole } from '@/types';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants';

export default function UsersPage(): React.JSX.Element {
    const { user: currentUser } = useUserStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Role check - Only admins can access this page
    const isAdmin = currentUser?.role === 'admin';

    // New User Form State
    const [formData, setFormData] = useState<CreateUserInput>({
        email: '',
        full_name: '',
        role: 'associate',
        warehouse_id: '',
        password: ''
    });

    useEffect(() => {
        if (currentUser?.warehouse_id) {
            setFormData(prev => ({ ...prev, warehouse_id: currentUser.warehouse_id! }));
            fetchUsers();
        }
    }, [currentUser?.warehouse_id]);

    async function fetchUsers() {
        if (!currentUser?.warehouse_id) return;
        try {
            setLoading(true);
            const data = await getUsers(currentUser.warehouse_id);
            setUsers(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault();
        try {
            setLoading(true);
            await createUser(formData);
            toast.success('User created successfully');
            setIsAddModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    // Protected route logic
    if (currentUser && !isAdmin) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-8">
                <Card className="max-w-md border-red-500/20 bg-red-500/5">
                    <CardHeader
                        title="Access Restricted"
                        subtitle="You do not have administrative privileges to access this console."
                        action={<Shield className="w-8 h-8 text-red-500" />}
                    />
                    <CardContent>
                        <p className="text-zinc-400 text-sm mb-6">
                            Personnel management is restricted to authorized System Administrators only. If you believe this is an error, please contact your shift manager.
                        </p>
                        <Button variant="primary" fullWidth onClick={() => window.location.href = '/'}>
                            Return to Safety
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white">
            <Sidebar />

            <main className="main-content">
                <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                <Shield className="w-8 h-8 text-blue-500" />
                                User Management
                            </h1>
                            <p className="text-zinc-400 mt-1">Manage personnel, roles, and warehouse access</p>
                        </div>
                        <Button
                            variant="primary"
                            className="bg-blue-600 hover:bg-blue-700 h-11"
                            leftIcon={<UserPlus className="w-5 h-5" />}
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            Add New User
                        </Button>
                    </div>

                    {/* Stats bar */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Users', val: users.length, icon: UserIcon, color: 'text-blue-400' },
                            { label: 'Admins', val: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-purple-400' },
                            { label: 'Associates', val: users.filter(u => u.role === 'associate').length, icon: UserPlus, color: 'text-green-400' },
                            { label: 'Solvers', val: users.filter(u => u.role === 'problem_solver').length, icon: AlertTriangle, color: 'text-amber-400' },
                        ].map((s, i) => (
                            <Card key={i} className="bg-[#141417] border-[#27272a] p-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg bg-white/5", s.color)}>
                                        <s.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</p>
                                        <p className="text-xl font-bold">{s.val}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="w-full bg-[#141417] border border-[#27272a] rounded-lg h-11 pl-10 pr-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="secondary" className="bg-[#141417] border-[#27272a] text-zinc-300" leftIcon={<Filter className="w-4 h-4" />}>
                            Filters
                        </Button>
                    </div>

                    {/* Users Table */}
                    <Card className="overflow-hidden">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>User</TH>
                                    <TH>Role</TH>
                                    <TH>Status</TH>
                                    <TH>Joined</TH>
                                    <TH></TH>
                                </TR>
                            </THead>
                            <TBody>
                                {loading ? (
                                    <TR>
                                        <TD colSpan={5} className="py-24 text-center">
                                            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            <p className="text-zinc-500 font-medium tracking-wide">SECURE ACCESS: SYNCING CLEARANCE DATA...</p>
                                        </TD>
                                    </TR>
                                ) : filteredUsers.length === 0 ? (
                                    <TR>
                                        <TD colSpan={5} className="py-12 text-center text-zinc-500">
                                            No users found matching your criteria.
                                        </TD>
                                    </TR>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <TR key={u.id}>
                                            <TD>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                                        {u.full_name?.charAt(0) || u.email.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-200 group-hover:text-white transition-colors">{u.full_name || 'N/A'}</p>
                                                        <p className="text-xs text-zinc-500">{u.email}</p>
                                                    </div>
                                                </div>
                                            </TD>
                                            <TD>
                                                <Badge
                                                    variant={u.role === 'admin' ? 'purple' : u.role === 'problem_solver' ? 'warning' : 'primary'}
                                                    glow
                                                >
                                                    {ROLE_LABELS[u.role] || u.role}
                                                </Badge>
                                            </TD>
                                            <TD>
                                                <Badge
                                                    variant={u.is_active ? 'success' : 'default'}
                                                    glow={u.is_active}
                                                >
                                                    {u.is_active ? 'Operational' : 'Deactivated'}
                                                </Badge>
                                            </TD>
                                            <TD className="text-sm text-zinc-500 font-mono">
                                                {new Date(u.created_at).toLocaleDateString()}
                                            </TD>
                                            <TD className="text-right">
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4 text-zinc-500" />
                                                </Button>
                                            </TD>
                                        </TR>
                                    ))
                                )}
                            </TBody>
                        </Table>
                    </Card>
                </div>
            </main>

            {/* Creation Modal Overlay */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg bg-[#141417] border-[#27272a] shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="border-b border-[#27272a] pb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-500" />
                                    Register New User
                                </h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-500 hover:text-white">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="mt-6">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        placeholder="John Doe"
                                        className="bg-[#0a0a0c] border-[#27272a] text-white"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        placeholder="john@nexus-wms.com"
                                        className="bg-[#0a0a0c] border-[#27272a]"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-400">Functional Role</label>
                                    <select
                                        className="w-full bg-[#0a0a0c] border border-[#27272a] rounded-lg h-11 px-4 text-sm focus:border-blue-500 outline-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    >
                                        <option value="associate">Associate (Picker/Packer)</option>
                                        <option value="problem_solver">Problem Solver</option>
                                        <option value="manager">Warehouse Manager</option>
                                        <option value="admin">System Admin</option>
                                        <option value="qa">QA / Auditor</option>
                                    </select>
                                </div>

                                <Input
                                    label="Initial Password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-[#0a0a0c] border-[#27272a]"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />

                                <div className="pt-4 flex gap-3">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 border border-[#27272a] hover:bg-white/5"
                                        onClick={() => setIsAddModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1 bg-blue-600"
                                        isLoading={loading}
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Internal icons for the stats cards
function AlertTriangle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </svg>
    )
}
