"use client";

import { AppShell } from '../../layout/AppShell';
import { PageHeader } from '../../ui';

export function AdminTeacherAssignmentsPage({ children }: { children?: React.ReactNode }) {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Teacher assignments">
      <PageHeader eyebrow="Administration" title="Teacher assignments" />
      {children}
    </AppShell>
  );
}
