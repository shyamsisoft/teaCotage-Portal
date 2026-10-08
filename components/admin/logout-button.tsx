'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'icon';
}

export function LogoutButton({ className = '', variant = 'header' }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Soft redirect to login page with logged_out parameter
        router.push('/admin/login?logged_out=true');
        router.refresh();
      } else {
        // Fallback hard redirect if API returned non-200
        window.location.href = '/admin/login?logged_out=true';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Hard redirect fallback on network error
      window.location.href = '/admin/login?logged_out=true';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label="Log out of CMS Admin Portal"
      className={`inline-flex items-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === 'header'
          ? 'px-3 py-1.5 bg-slate-900 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-800/80 shadow-sm'
          : variant === 'button'
          ? 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white shadow'
          : 'p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800'
      } ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-red-400" />
          <span>Logging out...</span>
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span>Logout</span>
        </>
      )}
    </button>
  );
}

export default LogoutButton;
