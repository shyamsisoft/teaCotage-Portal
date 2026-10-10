'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { NavSiteSwitcher } from './nav-site-switcher';
import { NavGroup } from './nav-group';
import { NavUserProfile } from './nav-user-profile';
import { NavigationItemNode, UserNavProfile } from '@/types/navigation';

interface NavDrawerProps {
  navItems: NavigationItemNode[];
  userProfile: UserNavProfile;
  initialCollapsed?: boolean;
}

export function NavDrawer({
  navItems: initialNavItems,
  userProfile: initialUserProfile,
  initialCollapsed = false,
}: NavDrawerProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavigationItemNode[]>(initialNavItems);
  const [userProfile, setUserProfile] = useState<UserNavProfile>(initialUserProfile);
  const pathname = usePathname();

  // Dynamically fetch authorized navigation nodes and active user profile from API
  useEffect(() => {
    let isMounted = true;
    async function fetchNavigationData() {
      try {
        const response = await fetch('/api/v1/admin/navigation/me');
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data && isMounted) {
            if (result.data.navigation && result.data.navigation.length > 0) {
              setNavItems(result.data.navigation);
            }
            if (result.data.user) {
              setUserProfile((prev) => ({
                ...prev,
                id: result.data.user.id || prev.id,
                email: result.data.user.email || prev.email,
                firstName: result.data.user.firstName || prev.firstName,
                lastName: result.data.user.lastName || prev.lastName,
                globalRole: result.data.user.globalRole || prev.globalRole,
                activeSite: result.data.user.activeSite || prev.activeSite,
                assignedSites: result.data.user.assignedSites || prev.assignedSites,
                permissions: result.data.user.permissions || prev.permissions,
              }));
            }
          }
        }
      } catch (err) {
        // Fallback to initial props on error
        console.error('Failed to fetch dynamic navigation nodes:', err);
      }
    }

    fetchNavigationData();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    document.cookie = `tea_drawer_collapsed=${nextState}; path=/; max-age=31536000`;
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 text-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-tea-amber">Tea Cottage</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay Sheet */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
          <aside className="w-72 bg-slate-900 h-full flex flex-col p-4 space-y-4 border-r border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-base text-tea-amber">Tea Cottage Portal</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavSiteSwitcher
              activeSite={userProfile.activeSite}
              assignedSites={userProfile.assignedSites}
              isCollapsed={false}
            />
            <nav className="flex-1 overflow-y-auto space-y-1">
              {navItems.map((item) => (
                <NavGroup
                  key={item.id}
                  item={item}
                  currentPath={pathname}
                  isCollapsed={false}
                />
              ))}
            </nav>
            <NavUserProfile profile={userProfile} isCollapsed={false} />
          </aside>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Collapsible Navigation Drawer */}
      <aside
        className={`hidden md:flex relative flex-col h-screen bg-slate-900 border-r border-slate-800 text-slate-100 transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Site Switcher Section */}
        <div className="p-3 border-b border-slate-800">
          <NavSiteSwitcher
            activeSite={userProfile.activeSite}
            assignedSites={userProfile.assignedSites}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavGroup
              key={item.id}
              item={item}
              currentPath={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand navigation drawer' : 'Collapse navigation drawer'}
          className="absolute -right-3 top-16 z-30 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full border border-slate-700 shadow-lg transition-transform hover:scale-110"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-tea-amber" /> : <ChevronLeft className="h-3.5 w-3.5 text-tea-amber" />}
        </button>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800">
          <NavUserProfile profile={userProfile} isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}

export default NavDrawer;
