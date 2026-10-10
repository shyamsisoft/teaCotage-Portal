'use client';

import React from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { LogoutButton } from './logout-button';
import { UserNavProfile } from '@/types/navigation';

interface NavUserProfileProps {
  profile: UserNavProfile;
  isCollapsed?: boolean;
}

export function NavUserProfile({ profile, isCollapsed = false }: NavUserProfileProps) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Link
          href="/admin/profile"
          className="p-2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hover:text-tea-amber hover:border-tea-800 transition-colors"
          title="View My Profile"
          aria-label="View My Profile"
        >
          <User className="h-4 w-4" />
        </Link>
        <LogoutButton variant="icon" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-850 border border-slate-800">
      <Link
        href="/admin/profile"
        className="flex items-center gap-2.5 overflow-hidden flex-1 group hover:opacity-90 transition-opacity"
        title="View My Profile"
      >
        <div className="p-2 rounded-full bg-tea-800/30 text-tea-amber border border-tea-800/50 flex-shrink-0 group-hover:border-tea-800">
          <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-tea-amber transition-colors">
            {profile.firstName} {profile.lastName}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-tea-amber">
            {profile.globalRole.replace('_', ' ')}
          </span>
        </div>
      </Link>
      <LogoutButton variant="icon" />
    </div>
  );
}

export default NavUserProfile;
