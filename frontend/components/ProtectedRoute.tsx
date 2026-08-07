"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearStoredAuth, getStoredToken, getStoredUser } from '@/lib/auth';
import { getCurrentUser, type UserDto } from '@/lib/api';

const roleDashboardMap: Record<string, string> = {
  Admin: '/roles/admin/dashboard',
  Teacher: '/roles/teacher/dashboard',
  Student: '/roles/student/dashboard'
};

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredToken();

    if (!user || !user.role || typeof user.role !== 'string' || !token) {
      clearStoredAuth();
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(roleDashboardMap[user.role] ?? '/');
      return;
    }

    const validateAuth = async () => {
      try {
        const currentUser: UserDto = await getCurrentUser();
        if (!currentUser || currentUser.role !== user.role) {
          clearStoredAuth();
          router.replace('/login');
          return;
        }
        setAuthorized(true);
      } catch {
        clearStoredAuth();
        router.replace('/login');
      } finally {
        setCheckedAuth(true);
      }
    };

    validateAuth();
  }, [allowedRoles, router]);

  if (!checkedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-lg shadow-slate-200/60">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-900">Checking your session</p>
            <p className="mt-1 text-sm text-slate-500">Please wait while we verify access to your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
