/**
 * Badge Component
 * @description Premium industrial status indicators with glowing accents
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple';
    size?: 'xs' | 'sm' | 'md';
    outline?: boolean;
    glow?: boolean;
}

export function Badge({
    children,
    variant = 'default',
    size = 'sm',
    outline = false,
    glow = false,
    className,
    ...props
}: BadgeProps): React.JSX.Element {
    const baseStyles = 'inline-flex items-center justify-center font-bold uppercase tracking-widest rounded-md border transition-all';

    const sizeStyles = {
        xs: 'px-1.5 py-0.5 text-[9px]',
        sm: 'px-2 py-1 text-[10px]',
        md: 'px-2.5 py-1.5 text-[11px]',
    };

    const variantStyles = {
        default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        primary: cn(
            'bg-blue-500/10 text-blue-400 border-blue-500/30',
            glow && 'shadow-[0_0_8px_rgba(59,130,246,0.2)]'
        ),
        success: cn(
            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            glow && 'shadow-[0_0_8px_rgba(16,185,129,0.2)]'
        ),
        warning: cn(
            'bg-amber-500/10 text-amber-400 border-amber-500/30',
            glow && 'shadow-[0_0_8px_rgba(245,158,11,0.2)]'
        ),
        error: cn(
            'bg-red-500/10 text-red-400 border-red-500/30',
            glow && 'shadow-[0_0_8px_rgba(239,68,68,0.2)]'
        ),
        info: cn(
            'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
            glow && 'shadow-[0_0_8px_rgba(6,182,212,0.2)]'
        ),
        purple: cn(
            'bg-purple-500/10 text-purple-400 border-purple-500/30',
            glow && 'shadow-[0_0_8px_rgba(168,85,247,0.2)]'
        ),
    };

    const outlineStyles = outline ? 'bg-transparent' : '';

    return (
        <span
            className={cn(
                baseStyles,
                sizeStyles[size],
                variantStyles[variant],
                outlineStyles,
                className
            )}
            {...props}
        >
            {glow && <span className={cn(
                "mr-1.5 h-1 w-1 rounded-full animate-pulse",
                variant === 'primary' && "bg-blue-400",
                variant === 'success' && "bg-emerald-400",
                variant === 'warning' && "bg-amber-400",
                variant === 'error' && "bg-red-400",
                variant === 'info' && "bg-cyan-400",
                variant === 'purple' && "bg-purple-400",
                variant === 'default' && "bg-zinc-500"
            )} />}
            {children}
        </span>
    );
}

export default Badge;
