"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../../layout/AppShell';
import { Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td, UserFormModal } from '../../ui';
import { ASSIGNMENTS, USERS as INITIAL_USERS, CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS, SUBMISSIONS } from '../../data';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getSubmissions, getUsers as apiGetUsers, getClassCourses as apiGetClassCourses } from '@/lib/api';
import { MoreVertical, UserPlus, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';

export function AdminSettingsPage() {
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [gradingEnabled, setGradingEnabled] = useState(true);
  const [domain, setDomain] = useState('ams.edu');

  return (
    <AppShell role="Admin" breadcrumb="Admin / Settings">
      <PageHeader eyebrow="Administration" title="Settings" />

      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700">School settings</p>
              <p className="text-xs text-slate-500">Configure system defaults and access rules.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Academic year</label>
              <input
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email domain</label>
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
              <input
                id="grading-enabled"
                type="checkbox"
                checked={gradingEnabled}
                onChange={(event) => setGradingEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="grading-enabled" className="text-sm text-slate-700">
                Enable grading workflow for new assignments
              </label>
            </div>
            <Button>Save settings</Button>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-700">System notifications</p>
              <p className="text-xs text-slate-500">Keep administrators informed on new activity.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Assignment reminders</p>
              <p className="mt-2 text-sm text-slate-500">Notify teachers 24 hours before due date.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">User access logs</p>
              <p className="mt-2 text-sm text-slate-500">Track sign-ins and admin changes.</p>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
