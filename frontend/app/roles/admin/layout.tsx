"use client";

import { ProtectedRoute } from '@/shared/auth';
import { AppShell } from '@/shared/layout';
import { ADMIN_ROLES } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      <AppShell role="Admin">{children}</AppShell>
    </ProtectedRoute>
  );
}
