import React from 'react';
import { Shield, CheckCircle, LayoutDashboard, Globe } from 'lucide-react';
import { LogoutButton } from '@/components/admin/logout-button';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-tea-amber bg-tea-800/30 px-3 py-1 rounded-full border border-tea-800/60 inline-flex items-center gap-1.5 mb-2">
              <Globe className="h-3.5 w-3.5" /> Site Context: Tea Cottage Website
            </span>
            <h1 className="text-3xl font-bold text-white">CMS Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Welcome to the Multi-Site CMS Management Portal.</p>
          </div>
          <div>
            <LogoutButton variant="header" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <LayoutDashboard className="h-6 w-6 text-tea-amber" />
            <h3 className="font-semibold text-base text-slate-200">Content Engine</h3>
            <p className="text-xs text-slate-400">Pages, catalog entries & blog posts</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <Globe className="h-6 w-6 text-emerald-400" />
            <h3 className="font-semibold text-base text-slate-200">Site Management</h3>
            <p className="text-xs text-slate-400">Tea Cottage & multi-site configurations</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <h3 className="font-semibold text-base text-slate-200">RBAC Security</h3>
            <p className="text-xs text-slate-400">Session authenticated & active</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <span>Authentication session verified successfully. SameSite Strict cookie active.</span>
        </div>
      </div>
    </div>
  );
}
