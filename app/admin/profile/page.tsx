'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, Save, Globe, Key, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

export default function UserProfilePage() {
  const [profile, setProfile] = useState({
    id: '',
    email: 'admin@teacottage.com',
    firstName: 'Admin',
    lastName: 'User',
    globalRole: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    assignedSites: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        slug: 'tea-cottage',
        name: 'Tea Cottage Website',
        roleCode: 'SUPER_ADMIN',
        roleName: 'Super Administrator',
      },
    ],
  });

  // Personal Info Form State
  const [infoForm, setInfoForm] = useState({
    firstName: 'Admin',
    lastName: 'User',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileAlert, setProfileAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch active user profile from API on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/v1/admin/users/me');
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data?.user) {
            const u = result.data.user;
            setProfile(u);
            setInfoForm({
              firstName: u.firstName || '',
              lastName: u.lastName || '',
            });
          }
        } else if (response.status === 401) {
          // Unauthenticated or expired session -> redirect directly to login
          window.location.href = '/admin/login?logged_out=true&redirect=/admin/profile';
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    }
    fetchProfile();
  }, []);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInfoForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit Profile Info Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileAlert(null);

    try {
      const response = await fetch('/api/v1/admin/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(infoForm),
      });

      const result = await response.json();

      if (response.ok) {
        setProfileAlert({ type: 'success', message: 'Personal information updated successfully!' });
        setProfile((prev) => ({
          ...prev,
          firstName: infoForm.firstName,
          lastName: infoForm.lastName,
        }));
      } else {
        setProfileAlert({ type: 'error', message: result.message || 'Failed to update profile details' });
      }
    } catch (err) {
      setProfileAlert({ type: 'error', message: 'Network connection error. Please try again.' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordAlert(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordAlert({ type: 'error', message: 'New password and confirmation password do not match.' });
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/admin/users/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });

      const result = await response.json();

      if (response.ok) {
        setPasswordAlert({ type: 'success', message: 'Password changed successfully! Concurrent sessions revoked.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordAlert({ type: 'error', message: result.message || 'Failed to change password' });
      }
    } catch (err) {
      setPasswordAlert({ type: 'error', message: 'Network connection error. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100 font-sans space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-tea-amber bg-tea-800/30 px-3 py-1 rounded-full border border-tea-800/60 inline-flex items-center gap-1.5 mb-2">
              <User className="h-3.5 w-3.5" /> Account Profile
            </span>
            <h1 className="text-3xl font-bold text-white">Staff Member Profile</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your personal information, credentials, and security preferences.</p>
          </div>
        </div>

        {/* User Profile Overview Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-tea-800 to-tea-900 border border-tea-700/60 flex items-center justify-center text-tea-amber shadow-lg flex-shrink-0">
            <User className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h2 className="text-xl font-bold text-white">{profile.firstName} {profile.lastName}</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-tea-amber bg-tea-800/30 border border-tea-800/60 px-2.5 py-0.5 rounded-full">
                {profile.globalRole.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-400">{profile.email}</p>
            <p className="text-xs text-slate-500">
              Account Created: {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section 1: Personal Information Form */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <User className="h-5 w-5 text-tea-amber" />
              <h3 className="font-semibold text-lg text-slate-100">Personal Information</h3>
            </div>

            {profileAlert && (
              <Alert type={profileAlert.type} message={profileAlert.message} />
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={infoForm.firstName}
                  onChange={handleInfoChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tea-800 focus:ring-2 focus:ring-tea-800/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={infoForm.lastName}
                  onChange={handleInfoChange}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tea-800 focus:ring-2 focus:ring-tea-800/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address (Read Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full rounded-lg border border-slate-850 bg-slate-900/60 py-2.5 px-3 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-tea-800 hover:bg-tea-900 text-white font-medium text-sm py-2.5 px-4 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tea-500/50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isUpdatingProfile ? 'Saving...' : 'Save Personal Details'}</span>
              </button>
            </form>
          </div>

          {/* Section 2: Security & Password Management */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <Lock className="h-5 w-5 text-tea-amber" />
              <h3 className="font-semibold text-lg text-slate-100">Change Password</h3>
            </div>

            {passwordAlert && (
              <Alert type={passwordAlert.type} message={passwordAlert.message} />
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  placeholder="••••••••••••"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChangeInput}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tea-800 focus:ring-2 focus:ring-tea-800/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  placeholder="At least 12 chars (A-Z, a-z, 0-9, @#$%)"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChangeInput}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tea-800 focus:ring-2 focus:ring-tea-800/40 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChangeInput}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-tea-800 focus:ring-2 focus:ring-tea-800/40 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm py-2.5 px-4 shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                <span>{isChangingPassword ? 'Updating...' : 'Update Account Password'}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Section 3: Assigned Managed Sites & Security Summary */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Globe className="h-5 w-5 text-emerald-400" />
              <h3 className="font-semibold text-lg text-slate-100">Assigned Managed Sites & Roles</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {profile.assignedSites.length} Site(s) Authorized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.assignedSites.map((site) => (
              <div key={site.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-tea-800/20 text-tea-amber border border-tea-800/40">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-slate-100">{site.name}</h4>
                    <span className="text-xs text-slate-400">Slug: {site.slug}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                  {site.roleName}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
