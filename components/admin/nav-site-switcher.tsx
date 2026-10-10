'use client';

import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { NavSiteOption } from '@/types/navigation';

interface NavSiteSwitcherProps {
  activeSite: NavSiteOption;
  assignedSites: NavSiteOption[];
  isCollapsed?: boolean;
}

export function NavSiteSwitcher({ activeSite, assignedSites, isCollapsed = false }: NavSiteSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<NavSiteOption>(activeSite);

  const handleSelectSite = (site: NavSiteOption) => {
    setSelectedSite(site);
    setIsOpen(false);
    // Set cookie for active site context
    document.cookie = `active_site_id=${site.id}; path=/; max-age=31536000`;
  };

  if (isCollapsed) {
    return (
      <div className="relative group flex justify-center py-2">
        <button
          type="button"
          aria-label={`Active site: ${selectedSite.name}`}
          className="p-2 rounded-lg bg-tea-800/20 text-tea-amber border border-tea-800/50 hover:bg-tea-800/40 transition-colors"
        >
          <Globe className="h-5 w-5 text-tea-amber" />
        </button>

        {/* Floating Tooltip in Collapsed Mode */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block z-50 px-3 py-1.5 bg-slate-800 text-slate-100 text-xs rounded-md shadow-lg border border-slate-700 whitespace-nowrap">
          <span className="font-semibold text-tea-amber">{selectedSite.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 transition-all text-left group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 rounded-md bg-tea-800/30 text-tea-amber border border-tea-800/50 flex-shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">Site Context</span>
            <span className="text-sm font-semibold text-slate-100 truncate group-hover:text-white">
              {selectedSite.name}
            </span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Site Context Selector Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-slate-850 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-800">
            Switch Managed Site
          </div>
          <ul role="listbox" className="max-h-48 overflow-y-auto">
            {assignedSites.map((site) => (
              <li key={site.id}>
                <button
                  type="button"
                  onClick={() => handleSelectSite(site)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    site.id === selectedSite.id ? 'bg-tea-800/20 text-tea-amber font-semibold' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{site.name}</span>
                  {site.id === selectedSite.id && <Check className="h-3.5 w-3.5 text-tea-amber flex-shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NavSiteSwitcher;
