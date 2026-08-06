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

import type { ClassRecord, SubjectRecord} from './types';

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
                <p className="font-medium text-slate-900">{cls.name} â€” {cls.section}</p>
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
