'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[]; password?: string[] }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const emailVal = form.querySelector<HTMLInputElement>('input[name="email"]')?.value || formData.email;
    const passwordVal = form.querySelector<HTMLInputElement>('input[name="password"]')?.value || formData.password;

    const payload = {
      email: emailVal,
      password: passwordVal,
    };

    try {
      const response = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          setFieldErrors(result.errors);
        } else {
          setErrorMessage(result.message || 'Authentication failed');
        }
        setIsLoading(false);
        return;
      }

      // Success -> Perform clean hard navigation to Dashboard with active session cookie
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error('Login submit error:', err);
      setErrorMessage('Network connection error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="mb-4">
          <Alert type="error" message={errorMessage} />
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Email Address
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Mail className="h-4 w-4" />
          </div>
          <input
            type="email"
            name="email"
            required
            placeholder="admin@teacottage.com"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-slate-950/90 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
              fieldErrors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-tea-800 focus:ring-tea-800/40'
            }`}
          />
        </div>
        {fieldErrors.email && (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.email[0]}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            Password
          </label>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Lock className="h-4 w-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            required
            placeholder="••••••••••••"
            value={formData.password}
            onChange={handleChange}
            className={`w-full rounded-lg border bg-slate-950/90 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 transition-all focus:outline-none focus:ring-2 ${
              fieldErrors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-tea-800 focus:ring-tea-800/40'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.password[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        className="w-full mt-2 font-semibold text-sm bg-gradient-to-r from-tea-800 to-tea-900 hover:from-tea-900 hover:to-tea-950 border border-tea-700/50"
      >
        Sign In to Portal
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Ambient Glassmorphism Backdrops */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-tea-800/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-tea-amber/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4 py-8 sm:px-6">
        {/* Brand Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-tea-800 to-tea-900 shadow-xl shadow-tea-900/50 ring-1 ring-tea-500/30">
            <ShieldCheck className="h-8 w-8 text-tea-amber" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Tea Cottage Portal
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Management Portal for <span className="text-tea-amber font-semibold">Tea Cottage</span> & Managed Properties
          </p>
        </div>

        {/* Card Shell */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Staff Authentication</h2>
              <p className="text-xs text-slate-400">Sign in with your authorized credentials</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-tea-amber bg-tea-800/30 border border-tea-800/60 px-2 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> Secure SSO
            </div>
          </div>

          <Suspense fallback={<div className="p-4 text-center text-xs text-slate-500">Loading form...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Strictly for authorized staff. Tea Cottage Portal v1.0
        </p>
      </div>
    </div>
  );
}
