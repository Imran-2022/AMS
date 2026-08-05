"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td } from '../ui';
import { ASSIGNMENTS, USERS as INITIAL_USERS, CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS, SUBMISSIONS } from '../data';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getSubmissions, getUsers as apiGetUsers, getClassCourses as apiGetClassCourses } from '@/lib/api';
import { MoreVertical, UserPlus, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';

type StudentUserRecord = {
  id: string;
  fullName: string;
  email: string;
  status: 'Active' | 'Inactive';
  parentMobile: string;
  classCourseId?: string;
  classCourseName?: string;
  section?: string;
};

type ClassCourseRecord = {
  id: string;
  name: string;
  section: string;
  academicYear: string;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  status: 'Active' | 'Inactive';
  className?: string;
  section?: string;
};

type ClassRecord = {
  id: number;
  name: string;
  section: string;
  year: string;
  subjects: number;
  students: number;
};

type SubjectRecord = {
  id: number;
  name: string;
  code: string;
  cls: string;
  teacher: string;
};

type StudentFormData = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
  parentMobile: string;
  className: string;
  section: string;
};

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminDashboardStats>> | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const totalAdmins = INITIAL_USERS.filter((user) => user.role === 'Admin').length;
  const totalTeachers = INITIAL_USERS.filter((user) => user.role === 'Teacher').length;
  const totalStudents = INITIAL_USERS.filter((user) => user.role === 'Student').length;

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [s, assignments, submissions] = await Promise.all([getAdminDashboardStats(), getAssignments(), getSubmissions()]);
      setStats(s);
      setRecentAssignments(assignments.slice(0, 8));
      setRecentSubmissions(submissions.slice(0, 8));
    } catch (err) {
      console.error(err);
      setLoadError('Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Dashboard">
      <div className="grid gap-6">
        <section className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-sm shadow-slate-200/40">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-600">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, System Admin</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Here's today's school overview.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">A cleaner, responsive dashboard for student, teacher, and assignment operations.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">Add Student</button>
              <button type="button" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20">Add Teacher</button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Students" value={isLoading ? '—' : `${stats?.totalStudents ?? 0}`} sub="Active learners" icon={<UserPlus className="h-5 w-5" />} />
          <Metric label="Teachers" value={isLoading ? '—' : `${stats?.totalTeachers ?? 0}`} sub="Active instructors" icon={<UserCheck className="h-5 w-5" />} />
          <Metric label="Classes" value={isLoading ? '—' : `${stats?.totalClasses ?? 0}`} sub="Active courses" icon={<BookOpen className="h-5 w-5" />} />
          <Metric label="Published Assignments" value={isLoading ? '—' : `${stats?.totalAssignments ?? 0}`} sub="Live classroom work" icon={<ClipboardList className="h-5 w-5" />} />
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <Card className="overflow-hidden p-0">
              <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recent assignments</p>
                    <p className="text-sm text-slate-500">Latest published work from teachers.</p>
                  </div>
                  <button type="button" className="text-sm font-medium text-violet-600 transition hover:text-violet-700">View all</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-white">
                      <Th className="pl-6">Title</Th>
                      <Th>Class</Th>
                      <Th>Teacher</Th>
                      <Th>Deadline</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAssignments.map((assignment) => (
                      <tr key={assignment.id} className="cursor-pointer transition hover:bg-slate-50">
                        <Td className="pl-6 text-slate-900">{assignment.title}</Td>
                        <Td>{assignment.classCourseName ?? assignment.cls ?? '—'}</Td>
                        <Td>{assignment.teacherName ?? assignment.teacher ?? '—'}</Td>
                        <Td className="font-mono text-slate-500">{assignment.deadline ?? '—'}</Td>
                        <Td>
                          <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
                            {assignment.status}
                          </Pill>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden p-0">
              <div className="border-b border-slate-200/80 bg-slate-50 px-6 py-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Recent submissions</p>
                  <p className="text-sm text-slate-500">Review the latest student work.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-white">
                      <Th className="pl-6">Student</Th>
                      <Th>Assignment</Th>
                      <Th>Submitted</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Marks</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((submission) => (
                      <tr key={submission.id} className="cursor-pointer transition hover:bg-slate-50">
                        <Td className="pl-6 text-slate-900">{submission.studentName ?? submission.userFullName ?? '—'}</Td>
                        <Td>{submission.assignmentTitle ?? submission.assignment?.title ?? '—'}</Td>
                        <Td className="font-mono text-slate-500">{submission.submittedAt ?? '—'}</Td>
                        <Td>
                          <Pill className={submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : submission.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}>
                            {submission.status}
                          </Pill>
                        </Td>
                        <Td className="text-right font-mono text-slate-700">{submission.marks !== null && submission.marks !== undefined ? `${submission.marks}/${submission.maxMarks ?? '—'}` : '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Quick actions</p>
                  <p className="text-sm text-slate-500">Common admin tasks at a glance.</p>
                </div>
                <div className="grid gap-3">
                  <button type="button" className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Add Student</button>
                  <button type="button" className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Add Teacher</button>
                  <button type="button" className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Create Assignment</button>
                  <button type="button" className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Assign Teacher</button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Recent activity</p>
                  <p className="text-sm text-slate-500">Latest changes coming from the database.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No activity data available yet. This section is ready for backend activity integration.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentUserRecord[]>([]);
  const [classCourses, setClassCourses] = useState<ClassCourseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUserRecord | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    email: '',
    password: '',
    status: 'Active',
    parentMobile: '',
    className: '',
    section: '',
  });
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminDashboardStats>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!formData.className && classCourses.length) {
      setFormData((current) => ({
        ...current,
        className: classCourses[0].name,
        section: classCourses[0].section,
      }));
    }
  }, [classCourses, formData.className, formData.section]);

  async function loadData(newestStudentId?: string) {
    try {
      setIsLoading(true);
      const [users, classes, enrollments, dashboardStats] = await Promise.all([
        getUsers(),
        getClassCourses(),
        getEnrollments(),
        getAdminDashboardStats(),
      ]);
      const classMap = Object.fromEntries(classes.map((cls) => [cls.id, cls]));
      const enrollmentMap = Object.fromEntries(enrollments.map((enrollment) => [enrollment.studentId, enrollment.classCourseId]));

      setClassCourses(classes);
      setStats(dashboardStats);
      const studentRecords = users
        .filter((user) => user.role === 'Student')
        .map((user) => {
          const classCourseId = enrollmentMap[user.id];
          const classCourse = classMap[classCourseId];
          return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            status: (user.isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
            parentMobile: user.parentMobile,
            classCourseId,
            classCourseName: classCourse?.name ?? '',
            section: classCourse?.section ?? '',
          };
        });

      const orderedStudents = newestStudentId
        ? [
            ...studentRecords.filter((student) => student.id === newestStudentId),
            ...studentRecords.filter((student) => student.id !== newestStudentId),
          ]
        : studentRecords;

      setStudents(orderedStudents);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load student data.');
    } finally {
      setIsLoading(false);
    }
  }

  function openNewStudent() {
    setEditingStudent(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      status: 'Active',
      parentMobile: '',
      className: classCourses[0]?.name ?? '',
      section: classCourses[0]?.section ?? '',
    });
    setIsFormOpen(true);
    setActionMenuFor(null);
  }

  function handleEditStudent(student: StudentUserRecord) {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName,
      email: student.email,
      password: '',
      status: student.status,
      parentMobile: student.parentMobile,
      className: student.classCourseName ?? classCourses[0]?.name ?? '',
      section: student.section ?? classCourses[0]?.section ?? '',
    });
    setIsFormOpen(true);
    setActionMenuFor(null);
  }

  function getSelectedClassCourseId() {
    return classCourses.find((cls) => cls.name === formData.className && cls.section === formData.section)?.id;
  }

  async function handleSaveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const classCourseId = getSelectedClassCourseId();
    if (!formData.fullName || !formData.email || !classCourseId) return;

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await updateUser(editingStudent.id, {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password || undefined,
          isActive: formData.status === 'Active',
          parentMobile: formData.parentMobile,
        });

        if (editingStudent.classCourseId !== classCourseId) {
          if (editingStudent.classCourseId) {
            await deleteEnrollment(editingStudent.id, editingStudent.classCourseId);
          }
          await createEnrollment({ studentId: editingStudent.id, classCourseId });
        }

        await loadData();
      } else {
        if (!formData.password) {
          throw new Error('Password is required for new students.');
        }

        const created = await createUser({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'Student',
          isActive: formData.status === 'Active',
          parentMobile: formData.parentMobile,
        });

        if (classCourseId) {
          await createEnrollment({ studentId: created.id, classCourseId });
        }

        await loadData(created.id);
      }

      setIsFormOpen(false);
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
      alert('Unable to save student. Please check the form and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteStudent(student: StudentUserRecord) {
    if (!window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) return;

    try {
      await deleteUser(student.id);
      await loadData();
      setActionMenuFor(null);
    } catch (err) {
      console.error(err);
      alert('Unable to delete student.');
    }
  }

  const visibleStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          student.fullName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.parentMobile.toLowerCase().includes(query) ||
          (student.classCourseName?.toLowerCase().includes(query) ?? false);
        return matchesStatus && matchesSearch;
      }),
    [students, search, statusFilter]
  );

  return (
    <AppShell role="Admin" breadcrumb="Admin / Students">
      <PageHeader eyebrow="Administration" title="Students" action={<Button onClick={openNewStudent}>Add student</Button>} />

      {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {isFormOpen && (
        <Card className="mb-6">
          <form onSubmit={handleSaveStudent} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                <input
                  value={formData.fullName}
                  onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Student name"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  placeholder="student@example.com"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder={editingStudent ? 'Leave blank to keep password' : 'Create a password'}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  type="password"
                  required={!editingStudent}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Parent mobile</label>
                <input
                  value={formData.parentMobile}
                  onChange={(event) => setFormData((current) => ({ ...current, parentMobile: event.target.value }))}
                  placeholder="Parent mobile number"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  type="tel"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
                <select
                  value={formData.className}
                  onChange={(event) => {
                    const selectedClass = event.target.value;
                    const firstMatching = classCourses.find((cls) => cls.name === selectedClass);
                    setFormData((current) => ({
                      ...current,
                      className: selectedClass,
                      section: firstMatching?.section ?? '',
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                  disabled={!classCourses.length || isLoading}>
                  <option value="" disabled>
                    {classCourses.length ? 'Select class' : 'Loading classes...'}
                  </option>
                  {Array.from(new Set(classCourses.map((cls) => cls.name))).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Section</label>
                <select
                  value={formData.section}
                  onChange={(event) => setFormData((current) => ({ ...current, section: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                  disabled={!formData.className}>
                  <option value="" disabled>
                    {formData.className ? 'Select section' : 'Select class first'}
                  </option>
                  {Array.from(
                    new Set(
                      classCourses
                        .filter((cls) => cls.name === formData.className)
                        .map((cls) => cls.section)
                    )
                  ).map((section) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value as 'Active' | 'Inactive' }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-end justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {editingStudent ? 'Save changes' : 'Add student'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Metric label="Total users" value={isLoading ? '—' : `${stats?.totalUsers ?? 0}`} sub={isLoading ? undefined : `${stats?.totalTeachers ?? 0} teachers · ${stats?.totalStudents ?? 0} students`} />
        <Metric label="Classes" value={isLoading ? '—' : `${stats?.totalClasses ?? 0}`} />
        <Metric label="Published assignments" value={isLoading ? '—' : `${stats?.totalAssignments ?? 0}`} />
        <Metric label="Submissions this week" value={isLoading ? '—' : `${stats?.totalSubmissions ?? 0}`} />
      </div>

      <Card className="mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['All', 'Active', 'Inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${statusFilter === status ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                {status}
              </button>
            ))}
          </div>
          <div className="grow max-w-md">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Class</Th>
                <Th>Section</Th>
                <Th>Parent</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student.id}>
                  <Td className="font-medium text-slate-900">{student.fullName}</Td>
                  <Td className="font-mono text-slate-500">{student.email}</Td>
                  <Td>{student.classCourseName || 'Unassigned'}</Td>
                  <Td>{student.section || '—'}</Td>
                  <Td>{student.parentMobile || '—'}</Td>
                  <Td>
                    <Pill className={student.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {student.status}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="relative inline-flex">
                      <button
                        type="button"
                        onClick={() => setActionMenuFor(actionMenuFor === student.id ? null : student.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-indigo-300 hover:text-slate-900">
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {actionMenuFor === student.id && (
                        <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                          <button
                            type="button"
                            onClick={() => handleEditStudent(student)}
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
                            Edit student
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student)}
                            className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50">
                            Delete student
                          </button>
                        </div>
                      )}
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

export function AdminTeachersPage() {
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <AppShell role="Admin" breadcrumb="Admin / Teachers">
      <PageHeader eyebrow="Administration" title="Teachers" action={<Button onClick={() => {}}>Add teacher</Button>} />

      {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Metric label="Total teachers" value={isLoading ? '—' : `${teachers.length}`} />
        <Metric label="Subjects assigned" value={isLoading ? '—' : `${assignments.length}`} />
        <Metric label="Active" value={isLoading ? '—' : `${teachers.filter((t) => t.isActive).length}`} />
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

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filter, setFilter] = useState<'All' | 'Admin' | 'Teacher' | 'Student'>('All');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<UserRecord>({ id: Date.now(), name: '', email: '', role: 'Student', status: 'Active' });

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const apiUsers = await getUsers();
      const mapped = apiUsers.map((u: any) => ({ id: u.id, name: u.fullName, email: u.email, role: u.role as UserRecord['role'], status: u.isActive ? 'Active' : 'Inactive' }));
      setUsers(mapped);
    } catch (err) {
      console.error(err);
      setUsers([...INITIAL_USERS]);
    }
  }

  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = filter === 'All' || user.role === filter;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
        return matchesRole && matchesSearch;
      }),
    [users, filter, search]
  );

  function openNewUser() {
    setEditingUser(null);
    setFormData({ id: Date.now().toString(), name: '', email: '', role: 'Student', status: 'Active' });
    setIsFormOpen(true);
  }

  function openEditUser(user: UserRecord) {
    setEditingUser(user);
    setFormData(user);
    setIsFormOpen(true);
  }

  async function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.status === 'Active'
        });
        await loadUsers();
      } else {
        const created = await createUser({
          fullName: formData.name,
          email: formData.email,
          password: 'ChangeMe123!',
          role: formData.role,
          isActive: formData.status === 'Active',
          parentMobile: ''
        });
        await loadUsers();
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('Unable to save user.');
    }
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm('Delete user? This cannot be undone.')) return;
    try {
      await deleteUser(id);
      await loadUsers();
      if (editingUser?.id === id) {
        setIsFormOpen(false);
        setEditingUser(null);
      }
    } catch (err) {
      console.error(err);
      alert('Unable to delete user.');
    }
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Users">
      <PageHeader eyebrow="Administration" title="Users" action={<Button onClick={openNewUser}>Add user</Button>} />

      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 bg-slate-100 rounded-full p-1">
            {['All', 'Admin', 'Teacher', 'Student'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option as typeof filter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === option ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                {option}
              </button>
            ))}
          </div>
          <div className="grow max-w-md">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <form onSubmit={handleSaveUser} className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Full name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="email@example.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
              <select
                value={formData.role}
                onChange={(event) => setFormData({ ...formData, role: event.target.value as UserRecord['role'] })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Admin</option>
                <option>Teacher</option>
                <option>Student</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value as UserRecord['status'] })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingUser ? 'Save changes' : 'Create user'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <Td className="font-medium text-slate-900">{user.name}</Td>
                  <Td className="font-mono text-slate-500">{user.email}</Td>
                  <Td><RoleBadge role={user.role as any} /></Td>
                  <Td>
                    <Pill className={user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {user.status}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditUser(user)}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-slate-900">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm text-rose-600 transition hover:bg-rose-50">
                        Delete
                      </button>
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

export function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [classForm, setClassForm] = useState<ClassRecord>({ id: Date.now(), name: '', section: '', year: '2026', subjects: 0, students: 0 });
  const [subjectForm, setSubjectForm] = useState<SubjectRecord>({ id: Date.now(), name: '', code: '', cls: '', teacher: INITIAL_USERS.find((user) => user.role === 'Teacher')?.name ?? '' });
  const teacherOptions = INITIAL_USERS.filter((user) => user.role === 'Teacher').map((user) => user.name);

  useEffect(() => {
    void loadClassesAndSubjects();
  }, []);

  async function loadClassesAndSubjects() {
    try {
      const [apiClasses, apiSubjects, apiUsers] = await Promise.all([apiGetClassCourses(), (await import('@/lib/api')).getSubjects(), apiGetUsers()]);
      setClasses(apiClasses.map((c: any) => ({ id: c.id, name: c.name, section: c.section, year: c.academicYear, subjects: 0, students: 0 })));
      setSubjects(apiSubjects.map((s: any) => ({ id: s.id, name: s.name, code: s.code, cls: (s.classCourseName ?? '') , teacher: '' })));
    } catch (err) {
      console.error(err);
      setClasses([...INITIAL_CLASSES]);
      setSubjects([...INITIAL_SUBJECTS]);
    }
  }

  function handleSaveClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClasses([classForm, ...classes]);
    setClassForm({ id: Date.now(), name: '', section: '', year: '2026', subjects: 0, students: 0 });
    setShowClassForm(false);
  }

  function handleSaveSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubjects([subjectForm, ...subjects]);
    setSubjectForm({ id: Date.now(), name: '', code: '', cls: '', teacher: teacherOptions[0] ?? '' });
    setShowSubjectForm(false);
  }

  function handleDeleteClass(id: number) {
    setClasses(classes.filter((cls) => cls.id !== id));
  }

  function handleDeleteSubject(id: number) {
    setSubjects(subjects.filter((subject) => subject.id !== id));
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Classes & subjects">
      <PageHeader eyebrow="Administration" title="Classes & subjects" />
      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Class roster and teacher assignments</p>
            <p className="text-xs text-slate-500">Manage classes, subjects, and teacher mappings from one screen.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowClassForm((value) => !value)}>Add class</Button>
            <Button variant="secondary" onClick={() => setShowSubjectForm((value) => !value)}>
              Assign teacher
            </Button>
          </div>
        </div>

        {showClassForm && (
          <form onSubmit={handleSaveClass} className="mt-6 grid gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Class name</label>
              <input
                value={classForm.name}
                onChange={(event) => setClassForm({ ...classForm, name: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Section</label>
              <input
                value={classForm.section}
                onChange={(event) => setClassForm({ ...classForm, section: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
              <input
                value={classForm.year}
                onChange={(event) => setClassForm({ ...classForm, year: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Subjects</label>
              <input
                type="number"
                value={classForm.subjects}
                onChange={(event) => setClassForm({ ...classForm, subjects: Number(event.target.value) })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Students</label>
              <input
                type="number"
                value={classForm.students}
                onChange={(event) => setClassForm({ ...classForm, students: Number(event.target.value) })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex items-end gap-3">
              <Button type="submit">Save class</Button>
              <Button type="button" variant="secondary" onClick={() => setShowClassForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {showSubjectForm && (
          <form onSubmit={handleSaveSubject} className="mt-6 grid gap-4 lg:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
              <input
                value={subjectForm.name}
                onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Code</label>
              <input
                value={subjectForm.code}
                onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
              <select
                value={subjectForm.cls}
                onChange={(event) => setSubjectForm({ ...subjectForm, cls: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={`${cls.name} - ${cls.section}`}>
                    {cls.name} - {cls.section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Teacher</label>
              <select
                value={subjectForm.teacher}
                onChange={(event) => setSubjectForm({ ...subjectForm, teacher: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {teacherOptions.map((teacher) => (
                  <option key={teacher} value={teacher}>
                    {teacher}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <Button type="submit">Save subject</Button>
              <Button type="button" variant="secondary" onClick={() => setShowSubjectForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2 mb-6">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{cls.name} — {cls.section}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">AY {cls.year}</p>
              </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Remove class? This will delete related records.')) return;
                    try {
                      await (await import('@/lib/api')).deleteClassCourse(cls.id);
                      await loadClassesAndSubjects();
                    } catch (err) {
                      console.error(err);
                      alert('Unable to remove class.');
                    }
                  }}
                  className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm text-rose-600 transition hover:bg-rose-50">
                  Remove
                </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              <span>
                <span className="font-mono font-semibold text-slate-900">{cls.subjects}</span> subjects
              </span>
              <span>
                <span className="font-mono font-semibold text-slate-900">{cls.students}</span> students
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Subjects & teacher assignments</p>
            <p className="text-xs text-slate-500">Manage subject ownership and teacher alignment.</p>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button onClick={() => setShowClassForm(true)}>Add class</Button>
            <Button variant="secondary" onClick={() => setShowSubjectForm(true)}>
              Assign teacher
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Code</Th>
                <Th>Class</Th>
                <Th>Teacher</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr key={subject.id}>
                  <Td className="font-medium text-slate-900">{subject.name}</Td>
                  <Td className="font-mono text-slate-500">{subject.code}</Td>
                  <Td>{subject.cls}</Td>
                  <Td>{subject.teacher}</Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm text-rose-600 transition hover:bg-rose-50">
                      Remove
                    </button>
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

export function AdminEnrollmentsPage() {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Enrollments">
      <PageHeader eyebrow="Administration" title="Enrollments" />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {INITIAL_CLASSES.map((cls) => (
          <Card key={cls.id}>
            <p className="text-sm text-slate-500">{cls.name} — {cls.section}</p>
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

export function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setIsLoading(true);
      const list = await getAssignments();
      setAssignments(list);
    } catch (err) {
      console.error(err);
      setAssignments(ASSIGNMENTS as any[]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await publishAssignment(id);
      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert('Unable to publish assignment.');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete assignment?')) return;
    try {
      await deleteAssignment(id);
      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert('Unable to delete assignment.');
    }
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Assignments">
      <PageHeader eyebrow="Administration" title="Assignments" action={<Button>Add assignment</Button>} />
      <div className="space-y-4">
        {(isLoading ? ASSIGNMENTS : assignments).map((assignment: any) => (
          <Card key={assignment.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-slate-900">{assignment.title}</p>
                <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                  {assignment.status}
                </Pill>
              </div>
              <p className="text-sm text-slate-500">{assignment.subjectName ?? assignment.subject ?? assignment.subject} · {assignment.classCourseName ?? assignment.cls} · {assignment.teacherName ?? assignment.teacher}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{assignment.deadline}</p>
              <p>{assignment.submissions ?? assignment.submittedCount}/{assignment.total ?? ''} submitted</p>
              <div className="mt-2 flex gap-2 justify-end">
                {assignment.status !== 'Published' && (
                  <Button onClick={() => handlePublish(assignment.id)}>Publish</Button>
                )}
                <Button variant="secondary" onClick={() => handleDelete(assignment.id)}>Delete</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

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
                  <Td className="font-medium text-slate-900">{submission.studentName ?? submission.student ?? submission.userFullName ?? '—'}</Td>
                  <Td>{submission.assignmentTitle ?? submission.assignment?.title ?? '—'}</Td>
                  <Td className="font-mono tabular-nums">{submission.submittedAt}</Td>
                  <Td>
                    <Pill className={submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : submission.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}>
                      {submission.status}
                    </Pill>
                  </Td>
                  <Td className="text-right font-mono tabular-nums">{submission.marks !== null && submission.marks !== undefined ? `${submission.marks}/${submission.maxMarks ?? ''}` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
