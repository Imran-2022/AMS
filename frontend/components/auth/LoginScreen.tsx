"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setStoredUser, setStoredToken } from '@/lib/auth';
import { login } from '@/lib/api';
import { Button } from '../ui';

const ROLES = ['Admin', 'Teacher', 'Student'] as const;

type RoleType = (typeof ROLES)[number];

export default function LoginScreen() {
  const [role, setRole] = useState<RoleType>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const normalizedRole = role;
      const userEmail = email.trim() || `${normalizedRole.toLowerCase()}@ams.edu`;
      const userPassword = password || 'Password123!';

      const response = await login(userEmail, userPassword);
      setStoredUser(response.user);
      setStoredToken(response.token);
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
      <div className="w-full max-w-4xl grid grid-cols-2 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
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
          <p className="text-sm text-slate-500 mb-6">Select your role and sign in to go to the right dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Role</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as RoleType)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {ROLES.map((availableRole) => (
                  <option key={availableRole} value={availableRole}>
                    {availableRole}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@ams.edu"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : `Sign in as ${role}`}
            </Button>
          </form>

          <p className="text-xs text-slate-400 mt-6">You can sign in with a backend account. If you use the default email, the app will pick {role.toLowerCase()}@ams.edu.</p>
        </div>
      </div>
    </div>
  );
}
