'use client';

import React from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { NavigationItemNode } from '@/types/navigation';

interface NavItemProps {
  item: NavigationItemNode;
  isActive?: boolean;
  isCollapsed?: boolean;
}

export function NavItem({ item, isActive = false, isCollapsed = false }: NavItemProps) {
  // Dynamically resolve Lucide Icon
  const IconComponent = item.icon && (LucideIcons as any)[item.icon]
    ? (LucideIcons as any)[item.icon]
    : LucideIcons.FileText;

  if (isCollapsed) {
    return (
      <div className="relative group flex justify-center py-1">
        <Link
          href={item.path || '#'}
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isActive
              ? 'bg-tea-800/40 text-tea-amber border border-tea-800/60 shadow-sm'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
          }`}
          aria-label={item.label}
        >
          <IconComponent className="h-5 w-5" />
        </Link>

        {/* Accessible Hover Tooltip in Icon-Only Mode */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 px-3 py-1.5 bg-slate-800 text-slate-100 text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap">
          {item.label}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.path || '#'}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-tea-800/40 text-tea-amber border border-tea-800/60 font-semibold shadow-sm'
          : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/70'
      }`}
    >
      <IconComponent className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-tea-amber' : 'text-slate-400'}`} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default NavItem;
