"use client";

import { ProtectedRoute } from '@/shared/auth';
import { AppShell } from '@/shared/layout';
import { STUDENT_ROLES } from '@/lib/roles';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={STUDENT_ROLES}>
      <AppShell role="Student">{children}</AppShell>
    </ProtectedRoute>
  );
}
