"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

const roleDashboardMap: Record<string, string> = {
  Admin: '/roles/admin/dashboard',
  Teacher: '/roles/teacher/dashboard',
  Student: '/roles/student/dashboard'
};

export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(roleDashboardMap[user.role] ?? '/');
      return;
    }

    setAuthorized(true);
  }, [allowedRoles, router]);

  if (!authorized) return null;
  return <>{children}</>;
}
