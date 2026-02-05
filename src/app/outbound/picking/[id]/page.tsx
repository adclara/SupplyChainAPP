'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { completePick, releasePick, PickTask } from '@/services/pickingService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    ArrowLeft,
    Box,
    MapPin,
    CheckCircle,
    Scan,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageProps {
    params: {
        id: string;
    }
}

export default function ActivePickSession({ params }: PageProps) {
    const { id } = params;
    const { user } = useUserStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [task, setTask] = useState<PickTask | null>(null);
    const [confirmQty, setConfirmQty] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load Task
    useEffect(() => {
        const loadTask = async () => {
            if (!user?.id) return;
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('shipment_lines')
                    .select(`
                        *,
                        product:products(sku, name, image_url),
                        location:locations(barcode, aisle, section, level),
                        shipment:shipments(order_number, customer_name)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                // Verify it's ours and in progress
                if (data.picked_by !== user.id || data.status !== 'in_progress') {
                    toast.error('Task not active or assigned to another user');
                    router.push('/outbound/picking');
                    return;
                }
                setTask(data as any);
                setConfirmQty(data.quantity.toString()); // Default to expected qty
            } catch (error) {
                console.error(error);
                toast.error('Failed to load task');
                router.push('/outbound/picking');
            } finally {
                setIsLoading(false);
            }
        };

        loadTask();
    }, [id, user?.id, router]);

    const handleConfirm = async () => {
        if (!task || !user?.id) return;

        const qty = parseInt(confirmQty);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Invalid quantity');
            return;
        }

        if (qty !== task.quantity) {
            // For now, blocking short picks / over picks. 
            // In real app, we'd handle short pick exception.
            toast.error(`Quantity mismatch! Expected ${task.quantity}.`);
            return;
        }

        setIsSubmitting(true);
        try {
            await completePick(task.id, user.id);
            toast.success('Pick Confirmed!');
            // Play success sound?
            router.push('/outbound/picking'); // Go back to queue logic
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = async () => {
        if (!task || !user?.id) return;
        if (!confirm('Are you sure you want to release this task back to the queue?')) return;

        try {
            await releasePick(task.id, user.id);
            toast.success('Task Released');
            router.push('/outbound/picking');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Task...</div>;
    }

    if (!task) return null;

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col">
            {/* Nav */}
            <header className="bg-[#141417] border-b border-[#27272a] p-4 flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.push('/outbound/picking')} leftIcon={<ArrowLeft className="w-5 h-5" />}>
                    Back
                </Button>
                <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase font-bold">Order #{task.shipment?.order_number}</p>
                    <p className="text-sm font-bold text-white">{task.shipment?.customer_name}</p>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </header>

            <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full gap-6">

                {/* 1. LOCATION (Primary Focus) */}
                <Card className="bg-indigo-600 border-indigo-500 p-6 text-center animate-in zoom-in duration-300">
                    <p className="text-indigo-200 uppercase text-sm font-bold mb-2 flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" /> Go To Location
                    </p>
                    <h1 className="text-5xl font-mono font-bold text-white tracking-widest leading-tight">
                        {task.location?.barcode}
                    </h1>
                    <p className="text-indigo-200 mt-2 text-sm font-mono">
                        Aisle {task.location?.aisle} • Sec {task.location?.section} • Lvl {task.location?.level}
                    </p>
                </Card>

                {/* 2. PRODUCT */}
                <Card className="bg-[#1c1c21] border-[#27272a] p-6 flex flex-col items-center text-center">
                    <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                        <Box className="w-16 h-16 text-zinc-500" />
                        {/* {task.product?.image_url && <img src={task.product.image_url} ... />} */}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">{task.product?.name}</h2>
                    <Badge variant="default" className="font-mono text-lg px-4 py-1 mb-2">
                        {task.product?.sku}
                    </Badge>
                    <p className="text-zinc-500 text-sm max-w-xs">
                        Check UPC matches product label.
                    </p>
                </Card>

                {/* 3. CONFIRMATION */}
                <Card className="bg-[#1c1c21] border-[#27272a] p-6 mt-auto">
                    <div className="flex justify-between items-end mb-4">
                        <label className="text-sm text-zinc-400 font-bold uppercase">Confirm Quantity</label>
                        <span className="text-xs text-zinc-500">Target: <strong className="text-white text-lg">{task.quantity}</strong></span>
                    </div>

                    <div className="flex gap-4">
                        <Input
                            type="number"
                            className="bg-black border-zinc-700 text-3xl font-mono text-center h-16 w-32"
                            value={confirmQty}
                            onChange={e => setConfirmQty(e.target.value)}
                        />
                        <Button
                            variant="primary"
                            className="flex-1 h-16 text-xl bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleConfirm}
                            isLoading={isSubmitting}
                            leftIcon={<CheckCircle className="w-6 h-6" />}
                        >
                            CONFIRM
                        </Button>
                    </div>

                </Card>

                <div className="text-center">
                    <button
                        onClick={handleSkip}
                        className="text-zinc-500 text-sm hover:text-white underline decoration-zinc-700"
                    >
                        Problem? Skip Item
                    </button>
                </div>

            </main>
        </div>
    );
}
