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

export function AdminTeacherAssignmentsPage() {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Teacher assignments">
      <PageHeader eyebrow="Administration" title="Teacher assignments" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <Th>Teacher</Th>
                <Th>Assignment</Th>
                <Th>Class</Th>
                <Th>Status</Th>
                <Th className="text-right">Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {ASSIGNMENTS.map((assignment) => (
                <tr key={assignment.id}>
                  <Td>{assignment.teacher}</Td>
                  <Td className="font-medium text-slate-900">{assignment.title}</Td>
                  <Td>{assignment.cls}</Td>
                  <Td>
                    <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {assignment.status}
                    </Pill>
                  </Td>
                  <Td className="text-right font-mono tabular-nums">{assignment.submissions}/{assignment.total}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
