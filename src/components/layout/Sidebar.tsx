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
        'fixed left-0 top-0 h-full bg-white border-r border-slate-200',
        'transition-all duration-300 flex flex-col shadow-sm z-50',
        isCollapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
        {!isCollapsed && (
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">{APP_NAME}</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm mx-auto">
            <Warehouse className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            'p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500',
            isCollapsed && 'absolute -right-3 top-5 bg-white border border-slate-200 shadow-sm rounded-full w-6 h-6 flex items-center justify-center p-0'
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
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className={cn(
                    'w-5 h-5 flex-shrink-0',
                    active ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
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
                  <ul className="mt-1 ml-2 space-y-0.5 border-l-2 border-slate-100 pl-3">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className={cn(
                            'block px-3 py-2 rounded-lg text-sm transition-colors',
                            isActive(child.href)
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
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
      <div className="border-t border-slate-100 p-3">
        {/* User Profile */}
        {user && (
          <div className={cn(
            'mb-3 p-3 rounded-lg bg-slate-50 border border-slate-100',
            isCollapsed && 'px-2'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-slate-500 truncate capitalize">
                    {user.role.replace('_', ' ')}
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
              'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-slate-500" />
            {!isCollapsed && <span className="text-sm">Settings</span>}
          </Link>
          <button
            onClick={logout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'text-red-600 hover:bg-red-50'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
