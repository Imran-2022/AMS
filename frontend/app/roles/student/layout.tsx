"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { STUDENT_ROLES } from '@/lib/roles';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={STUDENT_ROLES}>
      <AppShell role="Student">{children}</AppShell>
    </ProtectedRoute>
  );
}
