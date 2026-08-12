"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '@/shared/layout';
import { Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td, UserFormModal } from '../../ui';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getSubmissions, getUsers as apiGetUsers, getClassCourses as apiGetClassCourses } from '@/lib/api';
import { MoreVertical, UserPlus, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';

export function AdminEnrollmentsPage() {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Enrollments">
      <PageHeader eyebrow="Administration" title="Enrollments" />
      <Card>
        <p className="text-sm text-slate-500">Enrollment management data will load from the API.</p>
      </Card>
    </AppShell>
  );
}
