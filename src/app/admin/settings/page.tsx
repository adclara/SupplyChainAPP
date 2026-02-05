/**
 * Admin - Settings Page
 * @description System configuration and warehouse settings
 */

'use client';

import React, { useState } from 'react';
import {
    Settings,
    Warehouse,
    Bell,
    Shield,
    Database,
    Zap,
    Save,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

export default function SettingsPage(): React.JSX.Element {
    const [warehouseName, setWarehouseName] = useState('Main Warehouse');
    const [timezone, setTimezone] = useState('America/New_York');
    const [lowStockThreshold, setLowStockThreshold] = useState('10');

    const handleSave = () => {
        toast.success('Settings saved successfully');
    };

    return (
        <div className="min-h-screen bg-white">
            <Sidebar />

            <main className="main-content">
                <div className="page-container animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                            <p className="text-slate-600 mt-1">
                                Configure system and warehouse settings
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            leftIcon={<Save className="w-4 h-4" />}
                            onClick={handleSave}
                        >
                            Save Changes
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Warehouse Settings */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Warehouse Configuration"
                                subtitle="Basic warehouse information"
                                icon={<Warehouse className="w-5 h-5" />}
                            />
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Warehouse Name
                                    </label>
                                    <Input
                                        value={warehouseName}
                                        onChange={(e) => setWarehouseName(e.target.value)}
                                        placeholder="Enter warehouse name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="America/New_York">Eastern Time (ET)</option>
                                        <option value="America/Chicago">Central Time (CT)</option>
                                        <option value="America/Denver">Mountain Time (MT)</option>
                                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Inventory Settings */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Inventory Settings"
                                subtitle="Stock and alert configuration"
                                icon={<Database className="w-5 h-5" />}
                            />
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Low Stock Threshold
                                    </label>
                                    <Input
                                        type="number"
                                        value={lowStockThreshold}
                                        onChange={(e) => setLowStockThreshold(e.target.value)}
                                        placeholder="Enter threshold"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Alert when stock falls below this quantity
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Notifications */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Notifications"
                                subtitle="Alert preferences"
                                icon={<Bell className="w-5 h-5" />}
                            />
                            <div className="mt-6 space-y-4">
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700">Low stock alerts</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700">Shipment notifications</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700">Daily reports</span>
                                </label>
                            </div>
                        </Card>

                        {/* Security */}
                        <Card variant="elevated">
                            <CardHeader
                                title="Security"
                                subtitle="Access and permissions"
                                icon={<Shield className="w-5 h-5" />}
                            />
                            <div className="mt-6 space-y-4">
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700">Require 2FA for admins</span>
                                </label>
                                <label className="flex items-center gap-3">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm text-slate-700">Session timeout (30 min)</span>
                                </label>
                            </div>
                        </Card>
                    </div>

                    {/* System Info */}
                    <Card variant="elevated" className="mt-6">
                        <CardHeader
                            title="System Information"
                            subtitle="Application details"
                            icon={<Zap className="w-5 h-5" />}
                        />
                        <div className="mt-6 grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Version</div>
                                <div className="text-sm font-medium text-slate-900">1.0.0</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Environment</div>
                                <div className="text-sm font-medium text-slate-900">Development</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Database</div>
                                <div className="text-sm font-medium text-slate-900">Supabase</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
