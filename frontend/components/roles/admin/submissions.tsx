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

export function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setIsLoading(true);
      const list = await getSubmissions();
      setSubmissions(list);
    } catch (err) {
      console.error(err);
      setSubmissions(SUBMISSIONS as any[]);
    } finally {
      setIsLoading(false);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      const matchesSearch = !q || (s.studentName ?? s.student ?? '').toLowerCase().includes(q) || (s.assignmentTitle ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [submissions, statusFilter, search]);

  return (
    <AppShell role="Admin" breadcrumb="Admin / Submissions">
      <PageHeader eyebrow="Administration" title="Submissions" />
      <Card className="mb-4">
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="rounded-2xl border border-slate-300 px-4 py-2">
            <option value="All">All</option>
            <option value="Submitted">Submitted</option>
            <option value="Late">Late</option>
            <option value="Graded">Graded</option>
            <option value="Resubmission requested">Resubmission requested</option>
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search submissions" className="rounded-2xl border border-slate-300 px-4 py-2 flex-1" />
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Assignment</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th className="text-right">Marks</Th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? SUBMISSIONS : visible).map((submission: any) => (
                <tr key={submission.id}>
                  <Td className="font-medium text-slate-900">{submission.studentName ?? submission.student ?? submission.userFullName ?? 'â€”'}</Td>
                  <Td>{submission.assignmentTitle ?? submission.assignment?.title ?? 'â€”'}</Td>
                  <Td className="font-mono tabular-nums">{submission.submittedAt}</Td>
                  <Td>
                    <Pill className={submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : submission.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}>
                      {submission.status}
                    </Pill>
                  </Td>
                  <Td className="text-right font-mono tabular-nums">{submission.marks !== null && submission.marks !== undefined ? `${submission.marks}/${submission.maxMarks ?? ''}` : 'â€”'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
