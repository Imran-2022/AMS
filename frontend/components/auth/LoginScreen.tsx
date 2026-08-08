"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredUser, setStoredToken, setStoredRefreshToken } from '@/lib/auth';
import { login } from '@/lib/api';
import { Button } from '../ui';



export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userEmail = email.trim();
      const userPassword = password;

      if (!userEmail || !userPassword) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      const response = await login(userEmail, userPassword);
      setStoredUser(response.user);
      setStoredToken(response.token);
      setStoredRefreshToken(response.refreshToken);
      router.push(`/roles/${response.user.role.toLowerCase()}/dashboard`);
    } catch (err) {
      console.error(err);
      setError('Sign in failed. Check your email and password, then try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-2 rounded overflow-hidden border border-slate-200 shadow-sm">
        <div className="bg-slate-900 text-white p-10 flex flex-col justify-between">
          <div>
            <p className="font-serif text-2xl">AMS</p>
            <p className="text-slate-400 text-sm mt-1">Assignment & submission management</p>
          </div>
          <div className="space-y-3 my-10">
            {[
              'Publish assignments by class and subject',
              'Track every submission, on time or late',
              'Grade with marks capped to the rubric',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                <p className="text-sm text-slate-300">{t}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 font-mono">© 2026 OnnoRokom Projukti · School edition</p>
        </div>

        <div className="p-10 bg-white flex flex-col justify-center">
          <h1 className="font-serif text-2xl text-slate-900 mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in to access your dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="text-xs font-medium text-slate-500">Email</label>
              <input
                id="login-email"
                name="email"
                autoFocus
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Password</label>
              <div className="relative mt-1">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm pr-10 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-2 flex items-center text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19.5c-5.523 0-10-4.477-10-10 0-1.03.158-2.02.45-2.94M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full !rounded" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
