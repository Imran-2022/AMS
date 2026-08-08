"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { ADMIN_ROLES } from '@/lib/roles';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={ADMIN_ROLES}>
      <AppShell role="Admin">{children}</AppShell>
    </ProtectedRoute>
  );
}
