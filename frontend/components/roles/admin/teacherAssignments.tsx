"use client";

import { AppShell } from '@/shared/layout';

export function AdminTeacherAssignmentsPage({ children }: { children?: React.ReactNode }) {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Teacher assignments">
      {children}
    </AppShell>
  );
}
