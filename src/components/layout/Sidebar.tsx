/**
 * Sidebar Component
 * @description Modern navigation sidebar with module links and user profile
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PackageOpen,
  Truck,
  Box,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Warehouse,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { useUserStore } from '@/store/userStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Inbound',
    href: ROUTES.INBOUND,
    icon: PackageOpen,
    children: [
      { label: 'Receive', href: ROUTES.RECEIVE },
      { label: 'Dock', href: ROUTES.DOCK },
      { label: 'Putaway', href: ROUTES.PUTAWAY },
      { label: 'Replenishment', href: '/inbound/replenishment' },
    ],
  },
  {
    label: 'Outbound',
    href: ROUTES.OUTBOUND,
    icon: Truck,
    children: [
      { label: 'Waves', href: ROUTES.WAVES },
      { label: 'Picking', href: ROUTES.PICKING },
      { label: 'Packing', href: ROUTES.PACKING },
      { label: 'Shipping', href: ROUTES.SHIPPING },
    ],
  },
  {
    label: 'Inventory',
    href: ROUTES.INVENTORY,
    icon: Box,
    children: [
      { label: 'ICQA', href: ROUTES.ICQA },
      { label: 'Counts', href: ROUTES.COUNTS },
    ],
  },
  {
    label: 'Problem Solve',
    href: ROUTES.PROBLEM_SOLVE,
    icon: AlertTriangle,
  },
  {
    label: 'Admin',
    href: ROUTES.ADMIN,
    icon: Settings,
    children: [
      { label: 'Users', href: ROUTES.USERS },
      { label: 'Warehouse Settings', href: ROUTES.SETTINGS },
    ],
  },
];

export function Sidebar(): React.JSX.Element {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Inbound', 'Outbound', 'Inventory']);
  const pathname = usePathname();
  const { user, logout } = useUserStore();

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => pathname.startsWith(child.href)) ||
    pathname === item.href;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-[#141417] border-r border-[#27272a]',
        'transition-all duration-300 flex flex-col shadow-xl z-50',
        isCollapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#27272a]">
        {!isCollapsed && (
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight uppercase">{APP_NAME}</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-white/5 transition-colors text-zinc-500',
            isCollapsed && 'absolute -right-3 top-5 bg-[#141417] border border-[#27272a] shadow-lg rounded-full w-6 h-6 flex items-center justify-center p-0'
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedItems.includes(item.label);
            const active = isParentActive(item);

            return (
              <li key={item.label}>
                <button
                  onClick={() => item.children && toggleExpanded(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group text-left',
                    active
                      ? 'bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    active ? 'text-blue-500' : 'text-zinc-500 group-hover:text-zinc-300'
                  )} />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm flex-1">{item.label}</span>
                      {item.children && (
                        <ChevronDown className={cn(
                          'w-4 h-4 text-slate-400 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )} />
                      )}
                    </>
                  )}
                </button>

                {/* Children Items */}
                {item.children && isExpanded && !isCollapsed && (
                  <ul className="mt-1 ml-2 space-y-0.5 border-l border-zinc-800 pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive(child.href)
                              ? 'text-blue-400 font-medium'
                              : 'text-zinc-500 hover:text-white'
                          )}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#27272a] p-3">
        {/* User Profile */}
        {user && (
          <div className={cn(
            'mb-3 p-3 rounded-lg bg-white/5 border border-white/5',
            isCollapsed && 'px-2'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest font-bold">
                    {user.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings & Logout */}
        <div className="space-y-1">
          <Link
            href={ROUTES.SETTINGS}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'text-zinc-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-zinc-500" />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </Link>
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
              'text-red-400/80 hover:bg-red-500/10 hover:text-red-400'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-bold uppercase tracking-wider">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
