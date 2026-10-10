'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield } from 'lucide-react';
import { SiteSelector } from '@/components/admin/settings/site-selector';
import { SiteSettingsForm } from '@/components/admin/settings/site-settings-form';

export default function SiteSettingsPage() {
  const [sitesList, setSitesList] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/v1/admin/sites');
      const data = await res.json();
      if (data.status === 'success' && data.data?.sites) {
        setSitesList(data.data.sites);
        if (!selectedSiteId && data.data.sites.length > 0) {
          setSelectedSiteId(data.data.sites[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const selectedSite = sitesList.find((s) => s.id === selectedSiteId) || sitesList[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100 font-sans space-y-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-flex items-center gap-1.5 mb-2">
              <Settings className="h-3.5 w-3.5" /> Multi-Tenant Configuration
            </span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Site Settings</h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure property settings, custom domain mappings, and operational status for your managed sites.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Property Active</span>
            </div>
          </div>
        </div>

        {/* Site Selector Tabs */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading managed properties...</div>
        ) : (
          <div className="space-y-6">
            <SiteSelector
              sitesList={sitesList}
              selectedSiteId={selectedSiteId}
              onSelectSite={(id) => setSelectedSiteId(id)}
            />

            {selectedSite && (
              <SiteSettingsForm site={selectedSite} onSiteUpdated={fetchSites} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
