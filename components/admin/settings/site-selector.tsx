'use client';

import React from 'react';
import { Globe, CheckCircle2 } from 'lucide-react';

interface SiteSelectorProps {
  sitesList: any[];
  selectedSiteId: string;
  onSelectSite: (siteId: string) => void;
}

export function SiteSelector({ sitesList, selectedSiteId, onSelectSite }: SiteSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {sitesList.map((site) => {
        const isSelected = site.id === selectedSiteId;
        return (
          <button
            key={site.id}
            onClick={() => onSelectSite(site.id)}
            className={`flex items-center justify-between gap-4 p-4 rounded-xl border text-left transition-all ${
              isSelected
                ? 'bg-amber-500/10 border-amber-500/40 text-slate-10 shadow-lg shadow-amber-500/5'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg border ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">{site.name}</h4>
                <p className="text-[11px] text-slate-400">
                  {site.domain ? `https://${site.domain}` : `Slug: ${site.slug}`}
                </p>
              </div>
            </div>

            {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}
