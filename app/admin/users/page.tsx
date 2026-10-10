'use client';

import React from 'react';
import { Users, Shield, UserPlus, Sparkles } from 'lucide-react';
import { UserManagementTable } from '@/components/admin/users/user-management-table';

export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100 font-sans space-y-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5" /> Identity & Access Control
            </span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Staff User Directory</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage staff accounts, assign multi-site RBAC roles, and regulate access permissions across Tea Cottage Portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>RBAC Policy Enforced</span>
            </div>
          </div>
        </div>

        {/* User Directory Table Component */}
        <UserManagementTable />
      </div>
    </div>
  );
}
