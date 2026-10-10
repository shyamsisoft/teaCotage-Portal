'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavDrawer } from '@/components/admin/nav-drawer';
import { DEFAULT_NAVIGATION_TREE } from '@/lib/navigation';
import { UserNavProfile } from '@/types/navigation';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/admin/activate'];

const mockUserProfile: UserNavProfile = {
  id: 'usr-admin-01',
  email: 'admin@teacottage.com',
  firstName: 'Admin',
  lastName: 'User',
  globalRole: 'SUPER_ADMIN',
  activeSite: {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'tea-cottage',
    name: 'Tea Cottage Website',
    roleCode: 'SUPER_ADMIN',
  },
  assignedSites: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      slug: 'tea-cottage',
      name: 'Tea Cottage Website',
      roleCode: 'SUPER_ADMIN',
    },
  ],
  permissions: ['content:pages:preview', 'media:upload', 'site:settings:update'],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If viewing a public authentication screen, do NOT render navigation drawer sidebar
  const isPublicRoute = PUBLIC_ADMIN_PATHS.some((path) => pathname?.startsWith(path));

  if (isPublicRoute) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 text-slate-100 font-sans">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <NavDrawer navItems={DEFAULT_NAVIGATION_TREE} userProfile={mockUserProfile} />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
