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

import type { UserFormValues} from './types';

export function AdminTeachersPage() {
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherModalSubmitting, setTeacherModalSubmitting] = useState(false);
  const [teacherModalInitialValues, setTeacherModalInitialValues] = useState<UserFormValues | null>(null);

  useEffect(() => {
    void loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      setIsLoading(true);
      setError(null);
      const [users, teacherAssignments] = await Promise.all([apiGetUsers(), (await import('@/lib/api/teacherAssignments')).getTeacherAssignments()]);
      const teacherList = users.filter((u: any) => u.role === 'Teacher');
      setTeachers(teacherList);
      setAssignments(teacherAssignments);
    } catch (err) {
      console.error(err);
      setError('Unable to load teachers.');
    } finally {
      setIsLoading(false);
    }
  }

  const visibleTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teachers.filter((t) => !query || t.fullName.toLowerCase().includes(query) || t.email.toLowerCase().includes(query));
  }, [teachers, search]);

  function openNewTeacher() {
    setTeacherModalInitialValues({
      fullName: '',
      email: '',
      password: '',
      status: 'Active',
    });
    setIsTeacherModalOpen(true);
  }

  async function handleCreateTeacher(values: UserFormValues) {
    try {
      setTeacherModalSubmitting(true);
      await createUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: 'Teacher',
        isActive: values.status === 'Active',
        parentMobile: values.parentMobile ?? '',
      });
      setIsTeacherModalOpen(false);
      await loadTeachers();
    } catch (err) {
      console.error(err);
      alert('Unable to create teacher. Please check the form and try again.');
    } finally {
      setTeacherModalSubmitting(false);
    }
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Teachers">
      <PageHeader eyebrow="Administration" title="Teachers" action={<Button onClick={openNewTeacher}>Add teacher</Button>} />

      <UserFormModal
        open={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        title="Add teacher"
        submitLabel="Create teacher"
        role="Teacher"
        initialValues={teacherModalInitialValues ?? {
          fullName: '',
          email: '',
          password: '',
          status: 'Active',
        }}
        isSubmitting={teacherModalSubmitting}
        onSubmit={handleCreateTeacher}
      />

      {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Metric label="Total teachers" value={isLoading ? 'â€”' : `${teachers.length}`} />
        <Metric label="Subjects assigned" value={isLoading ? 'â€”' : `${assignments.length}`} />
        <Metric label="Active" value={isLoading ? 'â€”' : `${teachers.filter((t) => t.isActive).length}`} />
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Teacher directory</p>
            <p className="text-xs text-slate-500">Manage instructors and course ownership.</p>
          </div>
          <div className="grow max-w-md">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search teachers"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Subjects</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visibleTeachers.map((teacher) => {
                const subjectsCount = assignments.filter((a) => a.teacherId === teacher.id).length;
                return (
                  <tr key={teacher.id}>
                    <Td className="font-medium text-slate-900">{teacher.fullName}</Td>
                    <Td className="font-mono text-slate-500">{teacher.email}</Td>
                    <Td>{subjectsCount} subject{subjectsCount === 1 ? '' : 's'}</Td>
                    <Td>
                      <Pill className={teacher.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </Pill>
                    </Td>
                    <Td className="text-right">
                      <button type="button" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-slate-900">
                        View
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
