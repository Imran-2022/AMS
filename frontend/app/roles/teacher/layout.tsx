"use client";

import { ProtectedRoute } from '@/shared/auth';
import { AppShell } from '@/shared/layout';
import { TEACHER_ROLES } from '@/lib/roles';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={TEACHER_ROLES}>
      <AppShell role="Teacher">{children}</AppShell>
    </ProtectedRoute>
  );
}
