'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Save, Power, Key, AlertCircle, CheckCircle2, Loader2, Sparkles, Hash } from 'lucide-react';

interface SiteSettingsFormProps {
  site: any;
  onSiteUpdated: () => void;
}

export function SiteSettingsForm({ site, onSiteUpdated }: SiteSettingsFormProps) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (site) {
      setName(site.name || '');
      setDomain(site.domain || '');
      setIsActive(site.isActive !== false);
      setAlert(null);
    }
  }, [site]);

  if (!site) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const res = await fetch(`/api/v1/admin/sites/${site.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          domain: domain.trim() || null,
          isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({ type: 'error', message: data.message || 'Failed to save site settings' });
        setSaving(false);
        return;
      }

      setAlert({ type: 'success', message: 'Site settings updated successfully!' });
      onSiteUpdated();
    } catch (err) {
      setAlert({ type: 'error', message: 'A network error occurred while updating site settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-100">{site.name} Configuration</h3>
            <p className="text-xs text-slate-400">Manage property details, custom domain, and operational status</p>
          </div>
        </div>
      </div>

      {alert && (
        <div
          className={`flex items-center gap-3 p-3.5 text-xs rounded-xl border ${
            alert.type === 'success'
              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
              : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Site Name & Slug */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
              Site Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tea Cottage Website"
              className="w-full py-2.5 px-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System Unique Slug (Immutable)
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                disabled
                value={site.slug}
                className="w-full py-2.5 pl-9 pr-3 text-sm bg-slate-950/50 border border-slate-850 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            Custom Domain Hostname
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="teacottage.com"
              className="w-full py-2.5 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Enter the canonical domain mapped to this property for public content delivery.
          </p>
        </div>

        {/* Operational Status */}
        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            Property Status
          </label>
          <div className="relative">
            <Power className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="w-full py-2.5 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            >
              <option value="true">Active (Property Online)</option>
              <option value="false">Inactive (Property Disabled)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/10 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Configuration...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Site Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
