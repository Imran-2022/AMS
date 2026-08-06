"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { Button, Card, Pill, Th, Td, AddStudentModal, type AddStudentFormData } from '../../ui';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';
import { MoreVertical } from 'lucide-react';
import type { ClassCourseRecord, StudentFormData, StudentUserRecord } from './types';

const STATUS_OPTIONS = ['All', 'Active', 'Inactive'] as const;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentUserRecord[]>([]);
  const [classCourses, setClassCourses] = useState<ClassCourseRecord[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminDashboardStats>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [classFilter, setClassFilter] = useState('All classes');
  const [sectionFilter, setSectionFilter] = useState('All sections');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUserRecord | null>(null);
  const [studentModalSubmitting, setStudentModalSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (classFilter === 'All classes') {
      setSectionFilter('All sections');
    }
  }, [classFilter]);

  useEffect(() => {
    if (pageIndex > 0) {
      setPageIndex(0);
    }
  }, [search, statusFilter, classFilter, sectionFilter, pageSize]);

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
            status: user.isActive ? 'Active' : 'Inactive',
            parentMobile: user.parentMobile,
            classCourseId,
            classCourseName: classCourse?.name ?? '',
            section: classCourse?.section ?? '',
          } as StudentUserRecord;
        });

      if (newestStudentId) {
        const newest = studentRecords.find((student) => student.id === newestStudentId);
        const others = studentRecords.filter((student) => student.id !== newestStudentId);
        setStudents(newest ? [newest, ...others] : studentRecords);
      } else {
        setStudents(studentRecords);
      }

      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to load student data.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetSelection() {
    setSelectedIds([]);
    setActionMenuFor(null);
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(paginatedStudents.map((student) => student.id));
      return;
    }
    setSelectedIds([]);
  }

  function toggleSelection(studentId: string) {
    setSelectedIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]
    );
  }

  function openNewStudent() {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
    setActionMenuFor(null);
  }

  function handleEditStudent(student: StudentUserRecord) {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
    setActionMenuFor(null);
  }

  async function handleSaveStudent(values: AddStudentFormData) {
    setStudentModalSubmitting(true);
    try {
      const classCourse = classCourses.find((cls) => cls.name === values.className && cls.section === values.section);

      if (editingStudent) {
        await updateUser(editingStudent.id, {
          fullName: values.fullName,
          email: values.email,
          password: values.password || undefined,
          isActive: values.status === 'Active',
          parentMobile: values.parentMobile,
        });

        if (editingStudent.classCourseId !== classCourse?.id) {
          if (editingStudent.classCourseId) {
            await deleteEnrollment(editingStudent.id, editingStudent.classCourseId);
          }
          if (classCourse) {
            await createEnrollment({ studentId: editingStudent.id, classCourseId: classCourse.id });
          }
        }

        await loadData();
      } else {
        const created = await createUser({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          role: 'Student',
          isActive: values.status === 'Active',
          parentMobile: values.parentMobile ?? '',
        });

        if (classCourse) {
          await createEnrollment({ studentId: created.id, classCourseId: classCourse.id });
        }

        await loadData(created.id);
      }

      setIsStudentModalOpen(false);
      setEditingStudent(null);
      resetSelection();
    } catch (err) {
      console.error(err);
      alert('Unable to save student. Please check the form and try again.');
    } finally {
      setStudentModalSubmitting(false);
    }
  }

  async function handleDeleteStudent(student: StudentUserRecord) {
    if (!window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(student.id);
      await loadData();
      resetSelection();
    } catch (err) {
      console.error(err);
      alert('Unable to delete student.');
    }
  }

  async function handleBulkUpdateStatus(isActive: boolean) {
    if (!selectedIds.length) {
      return;
    }

    try {
      await Promise.all(
        selectedIds.map((studentId) => {
          const student = students.find((item) => item.id === studentId);
          if (!student) return Promise.resolve();
          return updateUser(studentId, {
            fullName: student.fullName,
            email: student.email,
            isActive,
          });
        })
      );
      await loadData();
      resetSelection();
    } catch (err) {
      console.error(err);
      alert('Unable to update selected students.');
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length || !window.confirm(`Delete ${selectedIds.length} selected student(s)? This cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(selectedIds.map((studentId) => deleteUser(studentId)));
      await loadData();
      resetSelection();
    } catch (err) {
      console.error(err);
      alert('Unable to delete selected students.');
    }
  }

  function handleExportSelected() {
    if (!selectedIds.length) {
      return;
    }

    const rows = selectedIds
      .map((id) => students.find((student) => student.id === id))
      .filter(Boolean)
      .map((student) => ({
        name: student!.fullName,
        email: student!.email,
        class: student!.classCourseName ?? 'Unassigned',
        section: student!.section ?? '',
        parent: student!.parentMobile ?? '',
        status: student!.status,
      }));

    const csv = ['Name,Email,Class,Section,Parent,Status', ...rows.map((row) => `${JSON.stringify(row.name)},${JSON.stringify(row.email)},${JSON.stringify(row.class)},${JSON.stringify(row.section)},${JSON.stringify(row.parent)},${JSON.stringify(row.status)}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'students-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const classNames = useMemo(() => Array.from(new Set(classCourses.map((cls) => cls.name))), [classCourses]);
  const sectionNames = useMemo(() => {
    const sections = classFilter === 'All classes' ? classCourses.map((cls) => cls.section) : classCourses.filter((cls) => cls.name === classFilter).map((cls) => cls.section);
    return Array.from(new Set(sections));
  }, [classCourses, classFilter]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
      const matchesSearch =
        !query ||
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.parentMobile.toLowerCase().includes(query) ||
        student.classCourseName.toLowerCase().includes(query) ||
        student.section.toLowerCase().includes(query);
      const matchesClass = classFilter === 'All classes' || student.classCourseName === classFilter;
      const matchesSection = sectionFilter === 'All sections' || student.section === sectionFilter;
      return matchesStatus && matchesSearch && matchesClass && matchesSection;
    });
  }, [students, search, statusFilter, classFilter, sectionFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, pageIndex, pageSize]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  return (
    <AppShell role="Admin" breadcrumb="Admin / Students">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Administration</p>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Students</h1>
          </div>
          <Button onClick={openNewStudent}>Add student</Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">Couldn't load student data</p>
                  <p className="text-xs text-rose-500">Check your connection and try again. If this keeps happening, contact support.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">TOTAL STUDENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : stats?.totalStudents ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">Enrolled across all classes</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">ACTIVE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : students.filter((student) => student.status === 'Active').length}</p>
            <p className="text-xs text-slate-400 mt-1">Currently attending</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">INACTIVE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : students.filter((student) => student.status === 'Inactive').length}</p>
            <p className="text-xs text-slate-400 mt-1">Suspended or withdrawn</p>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">NEW THIS MONTH</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : students.filter((student) => student.status === 'Active').length}</p>
            <p className="text-xs text-slate-400 mt-1">Enrolled since this month</p>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${statusFilter === status ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                  {status} <span className="opacity-70 font-normal">{status === 'All' ? students.length : students.filter((student) => student.status === status).length}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end min-w-[280px]">
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>All classes</option>
                {classNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>All sections</option>
                {sectionNames.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
              <div className="relative flex-1 max-w-xs">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students…"
                  className="w-full rounded-2xl border border-slate-200 px-10 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                </span>
              </div>
            </div>
          </div>
        </Card>

        {selectedIds.length > 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-indigo-600 px-5 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold"><span className="font-bold">{selectedIds.length}</span> selected</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={() => void handleBulkUpdateStatus(true)}>
                Set active
              </Button>
              <Button type="button" variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={() => void handleBulkUpdateStatus(false)}>
                Set inactive
              </Button>
              <Button type="button" variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={handleExportSelected}>
                Export
              </Button>
              <Button type="button" variant="secondary" className="bg-rose-500/90 text-white hover:bg-rose-500" onClick={handleBulkDelete}>
                Delete
              </Button>
            </div>
          </div>
        ) : null}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-widest text-slate-400">
                  <Th className="w-10 px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedStudents.length}
                      onChange={(event) => toggleAll(event.target.checked)}
                      className="accent-indigo-600 h-4 w-4"
                    />
                  </Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Class</Th>
                  <Th>Section</Th>
                  <Th>Parent</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <Td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelection(student.id)}
                        className="accent-indigo-600 h-4 w-4"
                      />
                    </Td>
                    <Td className="px-2 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                          {student.fullName
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-700">{student.fullName}</span>
                      </div>
                    </Td>
                    <Td className="px-2 py-3.5 text-slate-500">{student.email}</Td>
                    <Td className="px-2 py-3.5 text-slate-500">{student.classCourseName || 'Unassigned'}</Td>
                    <Td className="px-2 py-3.5 text-slate-500">{student.section || '—'}</Td>
                    <Td className="px-2 py-3.5 text-slate-500">{student.parentMobile || '—'}</Td>
                    <Td className="px-2 py-3.5">
                      <Pill className={student.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                        {student.status}
                      </Pill>
                    </Td>
                    <Td className="px-5 py-3.5 text-right">
                      <div className="relative inline-flex">
                        <button
                          type="button"
                          onClick={() => setActionMenuFor(actionMenuFor === student.id ? null : student.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {actionMenuFor === student.id ? (
                          <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                            <button type="button" onClick={() => handleEditStudent(student)} className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
                              Edit student
                            </button>
                            <button type="button" onClick={() => handleDeleteStudent(student)} className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50">
                              Delete student
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-900">{paginatedStudents.length ? pageIndex * pageSize + 1 : 0}</span>–<span className="font-semibold text-slate-900">{pageIndex * pageSize + paginatedStudents.length}</span> of <span className="font-semibold text-slate-900">{filteredStudents.length}</span> students
            </p>
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value) as typeof PAGE_SIZE_OPTIONS[number])}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white">{pageIndex + 1}</span>
              <button
                type="button"
                disabled={pageIndex >= pageCount - 1}
                onClick={() => setPageIndex((current) => Math.min(pageCount - 1, current + 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </Card>

        {!isLoading && !error && filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">No students yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md">Add your first student, or import a roster from a CSV file to get started quickly.</p>
            <div className="mt-5">
              <Button onClick={openNewStudent}>Add student</Button>
            </div>
          </div>
        ) : null}
      </div>

      <AddStudentModal
        open={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? 'Edit student' : 'Add student'}
        submitLabel={editingStudent ? 'Save changes' : 'Create student'}
        classCourses={classCourses}
        initialValues={editingStudent ? {
          fullName: editingStudent.fullName,
          email: editingStudent.email,
          password: '',
          status: editingStudent.status,
          studentId: '',
          className: editingStudent.classCourseName ?? classCourses[0]?.name ?? '',
          section: editingStudent.section ?? classCourses[0]?.section ?? '',
          guardianName: '',
          parentMobile: editingStudent.parentMobile,
          guardianEmail: '',
        } : {
          fullName: '',
          email: '',
          password: '',
          status: 'Active',
          studentId: '',
          className: classCourses[0]?.name ?? '',
          section: classCourses[0]?.section ?? '',
          guardianName: '',
          parentMobile: '',
          guardianEmail: '',
        }}
        isSubmitting={studentModalSubmitting}
        requirePassword={!editingStudent}
        onSubmit={handleSaveStudent}
      />
    </AppShell>
  );
}
