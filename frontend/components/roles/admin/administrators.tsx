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

export function AdminAdministratorsPage() {
  const admins = INITIAL_USERS.filter((user) => user.role === 'Admin');

  return (
    <AppShell role="Admin" breadcrumb="Admin / Administrators">
      <PageHeader eyebrow="Administration" title="Administrators" action={<Button>Add admin</Button>} />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Metric label="Admin users" value={`${admins.length}`} />
        <Metric label="Active" value={`${admins.filter((admin) => admin.status === 'Active').length}`} />
        <Metric label="Pending" value="0" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <Td className="font-medium text-slate-900">{admin.name}</Td>
                  <Td className="font-mono text-slate-500">{admin.email}</Td>
                  <Td>
                    <Pill className={admin.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {admin.status}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <button type="button" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-slate-900">Edit</button>
                      <button type="button" className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm text-rose-600 transition hover:bg-rose-50">Delete</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
