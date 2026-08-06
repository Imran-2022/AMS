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

export function AdminEnrollmentsPage() {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Enrollments">
      <PageHeader eyebrow="Administration" title="Enrollments" />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {INITIAL_CLASSES.map((cls) => (
          <Card key={cls.id}>
            <p className="text-sm text-slate-500">{cls.name} â€” {cls.section}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{cls.students}</p>
            <p className="text-xs text-slate-400 mt-2">students enrolled</p>
          </Card>
        ))}
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Class</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_USERS.filter((user) => user.role === 'Student').map((student) => (
                <tr key={student.id}>
                  <Td className="font-medium text-slate-900">{student.name}</Td>
                  <Td className="font-mono text-slate-500">{student.email}</Td>
                  <Td>Class 9 - A</Td>
                  <Td>
                    <Pill className={student.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {student.status}
                    </Pill>
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
