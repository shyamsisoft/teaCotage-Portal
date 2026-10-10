'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, User, AlertCircle, Loader2, Power } from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: any | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

export function EditUserModal({ isOpen, user, onClose, onUserUpdated }: EditUserModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'SUSPENDED'>('ACTIVE');
  const [globalRole, setGlobalRole] = useState<'SUPER_ADMIN' | 'SITE_ADMIN' | 'CONTENT_EDITOR' | 'VIEWER'>('CONTENT_EDITOR');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setStatus(user.status || 'ACTIVE');
      setGlobalRole(user.globalRole || 'CONTENT_EDITOR');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          status,
          globalRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update user account');
        setLoading(false);
        return;
      }

      onUserUpdated();
      onClose();
    } catch (err: any) {
      setError('A network error occurred while updating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Edit Staff User</h3>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 rounded-lg hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-3.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-300">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full py-2 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-slate-300">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full py-2 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-slate-300">Account Status</label>
            <div className="relative">
              <Power className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full py-2 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              >
                <option value="ACTIVE">ACTIVE (Access Granted)</option>
                <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-slate-300">Global Role</label>
            <div className="relative">
              <Shield className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <select
                value={globalRole}
                onChange={(e: any) => setGlobalRole(e.target.value)}
                className="w-full py-2 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              >
                <option value="CONTENT_EDITOR">Content Editor</option>
                <option value="SITE_ADMIN">Site Administrator</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
                <option value="VIEWER">Viewer (Read Only)</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/10 font-semibold transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
