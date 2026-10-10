'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Shield, CheckCircle2, XCircle, Edit, Filter, Users } from 'lucide-react';
import { CreateUserModal } from './create-user-modal';
import { EditUserModal } from './edit-user-modal';

export function UserManagementTable() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/v1/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'success') {
        setUsersList(data.data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch user list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, statusFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SITE_ADMIN':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CONTENT_EDITOR':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name or email..."
            className="w-full py-2.5 pl-10 pr-4 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2.5 px-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="SITE_ADMIN">Site Admin</option>
            <option value="CONTENT_EDITOR">Content Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 text-xs bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-amber-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/10 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Account
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-medium">
                <th className="py-3.5 px-6">User Account</th>
                <th className="py-3.5 px-6">Global Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Assigned Sites</th>
                <th className="py-3.5 px-6">Created Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading user directory...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No staff user accounts found.
                  </td>
                </tr>
              ) : (
                usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* User info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full">
                          {user.firstName?.[0] || 'U'}
                          {user.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Global Role */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] ${getRoleBadge(
                          user.globalRole
                        )}`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.globalRole}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      {user.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px]">
                          <XCircle className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                    </td>

                    {/* Assigned Sites */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {user.assignedSites && user.assignedSites.length > 0
                            ? `${user.assignedSites.length} site(s)`
                            : 'Default (Tea Cottage)'}
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-slate-400">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onUserCreated={fetchUsers}
      />

      <EditUserModal
        isOpen={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
