/**
 * Table Component
 * @description Standardized industrial data grid with themed hover states and headers
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
}

export function Table({ children, className, ...props }: TableProps) {
    return (
        <div className="w-full overflow-x-auto">
            <table className={cn("w-full text-left border-collapse", className)} {...props}>
                {children}
            </table>
        </div>
    );
}

export function THead({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className={cn("bg-[#1c1c21] border-b border-[#27272a]", className)} {...props}>
            {children}
        </thead>
    );
}

export function TBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className={cn("divide-y divide-[#27272a]", className)} {...props}>
            {children}
        </tbody>
    );
}

export function TH({ children, className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={cn(
                "px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-widest",
                className
            )}
            {...props}
        >
            {children}
        </th>
    );
}

export function TR({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={cn(
                "hover:bg-white/[0.02] transition-colors group",
                className
            )}
            {...props}
        >
            {children}
        </tr>
    );
}

export function TD({ children, className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={cn("px-6 py-5", className)} {...props}>
            {children}
        </td>
    );
}
