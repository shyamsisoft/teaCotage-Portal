'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { NavItem } from './nav-item';
import { NavigationItemNode } from '@/types/navigation';

interface NavGroupProps {
  item: NavigationItemNode;
  currentPath: string;
  isCollapsed?: boolean;
}

export function NavGroup({ item, currentPath, isCollapsed = false }: NavGroupProps) {
  const hasChildren = item.children && item.children.length > 0;
  
  // Auto-expand accordion if a child link matches current URL route
  const isChildActive = Boolean(hasChildren && item.children!.some((child) => child.path === currentPath));
  const [isOpen, setIsOpen] = useState<boolean>(isChildActive || true);

  const isDirectActive = item.path === currentPath;

  if (!hasChildren) {
    return <NavItem item={item} isActive={isDirectActive} isCollapsed={isCollapsed} />;
  }

  const IconComponent = item.icon && (LucideIcons as any)[item.icon]
    ? (LucideIcons as any)[item.icon]
    : LucideIcons.Folder;

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        {item.children!.map((child) => (
          <NavItem
            key={child.id}
            item={child}
            isActive={child.path === currentPath}
            isCollapsed={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-slate-400" />
          <span>{item.label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="pl-3 space-y-1 border-l border-slate-800 ml-3">
          {item.children!.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              isActive={child.path === currentPath}
              isCollapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NavGroup;
