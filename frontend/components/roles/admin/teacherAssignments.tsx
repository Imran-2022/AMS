"use client";

import { AppShell } from '../../layout/AppShell';

export function AdminTeacherAssignmentsPage({ children }: { children?: React.ReactNode }) {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Teacher assignments">
      {children}
    </AppShell>
  );
}
