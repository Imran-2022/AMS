"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td } from '../ui';
import { ASSIGNMENTS, USERS as INITIAL_USERS, CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS, SUBMISSIONS } from '../data';

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  status: 'Active' | 'Inactive';
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

export function AdminDashboardPage() {
  return (
    <AppShell role="Admin" breadcrumb="Admin / Dashboard">
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-4 mb-8">
        <Metric label="Total users" value="64" sub="6 admins · 12 teachers · 46 students" />
        <Metric label="Classes" value="2" sub="4–5 subjects each" />
        <Metric label="Published assignments" value="18" sub="3 drafts pending" />
        <Metric label="Submissions this week" value="73" sub="9 late" />
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Recent assignments</p>
            <p className="text-xs text-slate-500">Your latest classroom activity at a glance.</p>
          </div>
          <Button variant="secondary">View all</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Class</Th>
                <Th>Teacher</Th>
                <Th>Deadline</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {ASSIGNMENTS.map((assignment) => (
                <tr key={assignment.id}>
                  <Td className="font-medium text-slate-900">{assignment.title}</Td>
                  <Td>{assignment.cls}</Td>
                  <Td>{assignment.teacher}</Td>
                  <Td className="font-mono tabular-nums">{assignment.deadline}</Td>
                  <Td>
                    <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {assignment.status}
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

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>(() => [...INITIAL_USERS]);
  const [filter, setFilter] = useState<'All' | 'Admin' | 'Teacher' | 'Student'>('All');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<UserRecord>({ id: Date.now(), name: '', email: '', role: 'Student', status: 'Active' });

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
    setFormData({ id: Date.now(), name: '', email: '', role: 'Student', status: 'Active' });
    setIsFormOpen(true);
  }

  function openEditUser(user: UserRecord) {
    setEditingUser(user);
    setFormData(user);
    setIsFormOpen(true);
  }

  function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingUser) {
      setUsers(users.map((user) => (user.id === editingUser.id ? formData : user)));
    } else {
      setUsers([formData, ...users]);
    }
    setIsFormOpen(false);
  }

  function handleDeleteUser(id: number) {
    setUsers(users.filter((user) => user.id !== id));
    if (editingUser?.id === id) {
      setIsFormOpen(false);
      setEditingUser(null);
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
  const [classes, setClasses] = useState<ClassRecord[]>(() => [...INITIAL_CLASSES]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>(() => [...INITIAL_SUBJECTS]);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [classForm, setClassForm] = useState<ClassRecord>({ id: Date.now(), name: '', section: '', year: '2026', subjects: 0, students: 0 });
  const [subjectForm, setSubjectForm] = useState<SubjectRecord>({ id: Date.now(), name: '', code: '', cls: '', teacher: INITIAL_USERS.find((user) => user.role === 'Teacher')?.name ?? '' });
  const teacherOptions = INITIAL_USERS.filter((user) => user.role === 'Teacher').map((user) => user.name);

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
                onClick={() => handleDeleteClass(cls.id)}
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
  return (
    <AppShell role="Admin" breadcrumb="Admin / Assignments">
      <PageHeader eyebrow="Administration" title="Assignments" action={<Button>Add assignment</Button>} />
      <div className="space-y-4">
        {ASSIGNMENTS.map((assignment) => (
          <Card key={assignment.id} className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-slate-900">{assignment.title}</p>
                <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                  {assignment.status}
                </Pill>
              </div>
              <p className="text-sm text-slate-500">{assignment.subject} · {assignment.cls} · {assignment.teacher}</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>{assignment.deadline}</p>
              <p>{assignment.submissions}/{assignment.total} submitted</p>
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
  return (
    <AppShell role="Admin" breadcrumb="Admin / Submissions">
      <PageHeader eyebrow="Administration" title="Submissions" />
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
              {SUBMISSIONS.map((submission) => (
                <tr key={submission.id}>
                  <Td className="font-medium text-slate-900">{submission.student}</Td>
                  <Td>Algebraic Expressions — Set 4</Td>
                  <Td className="font-mono tabular-nums">{submission.submittedAt}</Td>
                  <Td>
                    <Pill className={submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : submission.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}>
                      {submission.status}
                    </Pill>
                  </Td>
                  <Td className="text-right font-mono tabular-nums">{submission.marks !== null ? `${submission.marks}/20` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
