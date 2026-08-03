"use client";

import Link from 'next/link';
import { getStoredUser } from '@/lib/auth';

export default function RoleDashboardShell({ title, children, role }: { title: string; children: React.ReactNode; role: string }) {
  const user = getStoredUser();

  return (
    <main style={{ padding: 24 }}>
      <h1>{title}</h1>
      <p>Signed in as {user?.fullName || 'Unknown'} ({user?.role || role})</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link href="/roles/admin/dashboard">Admin</Link>
        <Link href="/roles/teacher/dashboard">Teacher</Link>
        <Link href="/roles/student/dashboard">Student</Link>
      </div>
      {children}
    </main>
  );
}
