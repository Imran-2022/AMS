"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppShell } from '@/shared/layout';
import { AmsDeleteComfiramtionModal, AmsPagination, Button, Card, PageLoader, Pill, Th, Td } from '@/shared/ui';
import { AddStudentModal, type AddStudentFormData } from '@/components/roles/admin/shared';
import { API_BASE_URL, getAcademicYears, getEnrollments, getSelectedAcademicYearId } from '@/lib/api';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { createUser, deleteUser, getClassCourses, getGroupsForClass, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment } from '@/lib/api/enrollments';
import { MoreVertical, Plus, X } from 'lucide-react';
import type { ClassCourseRecord, StudentFormData, StudentUserRecord } from './types';

const STATUS_OPTIONS = ['All', 'Active', 'Inactive'] as const;
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const CLASSES_WITH_GROUPS = ['Nine', 'Ten', 'Eleven', 'Twelve'];
const CLASS_NAME_ORDER = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

function sortClassName(a: string, b: string) {
  const aIndex = CLASS_NAME_ORDER.indexOf(a);
  const bIndex = CLASS_NAME_ORDER.indexOf(b);

  const normalizedA = aIndex >= 0 ? aIndex : Number.MAX_SAFE_INTEGER;
  const normalizedB = bIndex >= 0 ? bIndex : Number.MAX_SAFE_INTEGER;
  return normalizedA - normalizedB;
}

function sortSectionValue(section: string) {
  const raw = (section ?? '').trim();
  if (!raw) return Number.MAX_SAFE_INTEGER;

  const alpha = raw.match(/[A-Za-z]+/)?.[0] ?? '';
  const numeric = Number.parseInt(raw.match(/\d+/)?.[0] ?? '0', 10);
  const alphaScore = alpha ? alpha.toUpperCase().charCodeAt(0) - 64 : 0;
  return alphaScore * 100 + numeric;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
}

function classHasGroups(className?: string): boolean {
  return className ? CLASSES_WITH_GROUPS.includes(className) : false;
}

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
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentUserRecord | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentUserRecord | null>(null);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState<StudentUserRecord | null>(null);
  const [studentModalSubmitting, setStudentModalSubmitting] = useState(false);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('');
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    const syncSelectedAcademicYear = () => {
      setSelectedAcademicYearId(getSelectedAcademicYearId());
    };

    syncSelectedAcademicYear();
    window.addEventListener('ams-academic-year-updated', syncSelectedAcademicYear);
    return () => {
      window.removeEventListener('ams-academic-year-updated', syncSelectedAcademicYear);
    };
  }, []);

  useEffect(() => {
    void loadData();
  }, [selectedAcademicYearId]);

  // Listen for academic year changes and reload data
  useEffect(() => {
    const handleAcademicYearChanged = () => {
      void loadData();
    };

    window.addEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    return () => {
      window.removeEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    };
  }, [selectedAcademicYearId]);

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

  if (isLoading) {
    return (
      <AppShell role="Admin" breadcrumb="Admin / Students">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-600">Administration</p>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Students</h1>
          </div>
          <PageLoader title="Loading students" subtitle="Loading current student records and enrollments…" />
        </div>
      </AppShell>
    );
  }

  async function loadData(newestStudentId?: string) {
    try {
      setIsLoading(true);
      const academicYears = await getAcademicYears();
      const activeYearId = academicYears.find((year) => year.isActive)?.id ?? '';
      const isArchivedSelection = Boolean(selectedAcademicYearId && selectedAcademicYearId !== activeYearId);

      const [users, classes, enrollments, dashboardStats] = await Promise.all([
        getUsers(),
        getClassCourses(isArchivedSelection),
        getEnrollments(isArchivedSelection),
        getAdminDashboardStats(),
      ]);

      const classMap = Object.fromEntries(classes.map((cls) => [cls.id, cls]));
      const filteredClasses = isArchivedSelection && selectedAcademicYearId
        ? classes.filter((cls) => cls.academicYearId === selectedAcademicYearId)
        : classes;
      const currentYearStudentIds = new Set((enrollments || []).map((enrollment) => enrollment.studentId));
      const enrollmentMap = Object.fromEntries((enrollments || []).map((enrollment) => [enrollment.studentId, enrollment.classCourseId]));

      // Classes already have groupName from backend
      setClassCourses(filteredClasses.map((cls) => ({
        ...cls,
        groupId: cls.groupId ?? undefined,
        groupName: cls.groupName ?? undefined,
      })) as ClassCourseRecord[]);
      setStats(dashboardStats);

      const studentRecords = users
        .filter((user) => user.role === 'Student' && currentYearStudentIds.has(user.id))
        .map((user) => {
          const classCourseId = enrollmentMap[user.id];
          const classCourse = classMap[classCourseId];
          const groupName = classCourse?.groupName;
          return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            status: user.isActive ? 'Active' : 'Inactive',
            parentMobile: user.parentMobile,
            classCourseId,
            classCourseName: classCourse?.name ?? '',
            section: classCourse?.section ?? '',
            studentId: user.studentId,
            gender: user.gender,
            guardianName: user.guardianName,
            guardianEmail: user.guardianEmail,
            dateOfBirth: user.dateOfBirth ?? '',
            admissionDate: user.admissionDate ?? '',
            avatarUrl: user.avatarUrl,
            groupName,
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
    setActionMenuFor(null);
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

  function parseStudentId(id?: string) {
    if (!id) return 0;
    const match = id.match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  async function handleSaveStudent(values: AddStudentFormData) {
    setStudentModalSubmitting(true);
    try {
      // For classes 9-12, also filter by group
      let classCourse = classCourses.find((cls) => cls.name === values.className && cls.section === values.section);
      
      if (classHasGroups(values.className) && values.group) {
        classCourse = classCourses.find(
          (cls) => cls.name === values.className && cls.section === values.section && cls.groupName === values.group
        );
      }

      if (editingStudent) {
        await updateUser(editingStudent.id, {
          fullName: values.fullName,
          email: values.email,
          password: values.password || undefined,
          isActive: values.status === 'Active',
          parentMobile: values.parentMobile,
          studentId: values.studentId || undefined,
          gender: values.gender || undefined,
          guardianName: values.guardianName || undefined,
          guardianEmail: values.guardianEmail || undefined,
          dateOfBirth: values.dateOfBirth || undefined,
          admissionDate: values.admissionDate || undefined,
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
          studentId: values.studentId,
          gender: values.gender,
          guardianName: values.guardianName,
          guardianEmail: values.guardianEmail,
          dateOfBirth: values.dateOfBirth || undefined,
          admissionDate: values.admissionDate || undefined,
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
      alert(err instanceof Error ? err.message : 'Unable to save student. Please check the form and try again.');
    } finally {
      setStudentModalSubmitting(false);
    }
  }

  function openDeleteStudent(student: StudentUserRecord) {
    setPendingDeleteStudent(student);
    setActionMenuFor(null);
  }

  async function confirmDeleteStudent() {
    if (!pendingDeleteStudent) {
      return;
    }

    try {
      await deleteUser(pendingDeleteStudent.id);
      await loadData();
      resetSelection();
    } catch (err) {
      console.error(err);
      alert('Unable to delete student.');
    } finally {
      setPendingDeleteStudent(null);
    }
  }


  const totalStudentsCount = students.length;
  const activeStudentsCount = students.filter((student) => student.status === 'Active').length;
  const inactiveStudentsCount = students.filter((student) => student.status === 'Inactive').length;

  const classNames = useMemo(
    () => Array.from(new Set(classCourses.map((cls) => cls.name))).sort(sortClassName),
    [classCourses]
  );
  const sectionNames = useMemo(() => {
    const sections = classFilter === 'All classes'
      ? classCourses.map((cls) => cls.section)
      : classCourses.filter((cls) => cls.name === classFilter).map((cls) => cls.section);

    return Array.from(new Set(sections)).sort((a, b) => sortSectionValue(a) - sortSectionValue(b));
  }, [classCourses, classFilter]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const classCourseName = student.classCourseName ?? '';
      const section = student.section ?? '';
      const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
      const matchesSearch =
        !query ||
        student.fullName.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.parentMobile.toLowerCase().includes(query) ||
        classCourseName.toLowerCase().includes(query) ||
        section.toLowerCase().includes(query);
      const matchesClass = classFilter === 'All classes' || classCourseName === classFilter;
      const matchesSection = sectionFilter === 'All sections' || section === sectionFilter;
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

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!actionMenuFor) return;
      const target = event.target as Node;
      const menuEl = document.querySelector(`[data-action-menu="${actionMenuFor}"]`);
      const btnEl = document.querySelector(`[data-action-button="${actionMenuFor}"]`);
      if (menuEl && menuEl.contains(target)) return;
      if (btnEl && btnEl.contains(target)) return;
      setActionMenuFor(null);
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [actionMenuFor]);

  // Close menu on scroll/resize so it doesn't float away from its button
  useEffect(() => {
    if (!actionMenuFor) return;
    function handleReposition() {
      setActionMenuFor(null);
    }
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [actionMenuFor]);

  return (
    <AppShell role="Admin" breadcrumb="Admin / Students">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-indigo-600">Administration</p>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Students</h1>
          </div>
          <Button onClick={openNewStudent} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add student
          </Button>
        </div>

        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">TOTAL STUDENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : totalStudentsCount}</p>
            <p className="text-xs text-slate-400 mt-1">Enrolled across all classes</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">ACTIVE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : activeStudentsCount}</p>
            <p className="text-xs text-slate-400 mt-1">Currently attending</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">INACTIVE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : inactiveStudentsCount}</p>
            <p className="text-xs text-slate-400 mt-1">Suspended or withdrawn</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">NEW THIS MONTH</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{isLoading ? '—' : students.filter((student) => student.status === 'Active').length}</p>
            <p className="text-xs text-slate-400 mt-1">Enrolled since this month</p>
          </div>
        </div>

        {(isLoading || students.length > 0) && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button" onClick={() => setStatusFilter(status)}
                      className={`rounded px-4 py-2 text-sm font-semibold cursor-pointer transition ${statusFilter === status ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                      {status} <span className="opacity-70 font-normal">{status === 'All' ? students.length : students.filter((student) => student.status === status).length}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-end min-w-[280px]">
                  <select
                    value={classFilter}
                    onChange={(event) => setClassFilter(event.target.value)}
                    className="rounded border cursor-pointer border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                    className="rounded border cursor-pointer border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                      className="w-full rounded border border-slate-200 px-8 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                    </span>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                      <Th>Roll / Student ID</Th>
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
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer" onClick={() => setSelectedStudent(student)}>
                        <Td className="px-2 py-3.5 font-semibold text-slate-700">{student.studentId || '—'}</Td>
                        <Td className="px-2 py-3.5">
                          <span className="font-semibold text-slate-700">{student.fullName}</span>
                        </Td>
                        <Td className="px-2 py-3.5 text-slate-500">{student.email}</Td>
                        <Td className="px-2 py-3.5 text-slate-500">{student.classCourseName || 'Unassigned'}</Td>
                        <Td className="px-2 py-3.5 text-slate-500">{student.section ? (student.groupName ? `${student.section} (${student.groupName})` : student.section) : '—'}</Td>
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
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 cursor-pointer"
                              data-action-button={student.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (actionMenuFor === student.id) {
                                  setActionMenuFor(null);
                                  return;
                                }
                                const rect = event.currentTarget.getBoundingClientRect();
                                setMenuPosition({
                                  top: rect.bottom + 8,
                                  left: rect.right - 176, // 176px = menu width (w-44), right-aligned to button
                                });
                                setActionMenuFor(student.id);
                              }}
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            {actionMenuFor === student.id && typeof document !== 'undefined'
                              ? createPortal(
                                  <div
                                    data-action-menu={student.id}
                                    onClick={(event) => event.stopPropagation()}
                                    style={{
                                      position: 'fixed',
                                      top: menuPosition.top,
                                      left: menuPosition.left,
                                      zIndex: 9999,
                                    }}
                                    className="w-44 overflow-hidden rounded border border-slate-200 bg-white shadow-xl"
                                  >
                                    <button type="button" onClick={() => { setSelectedStudent(student); setActionMenuFor(null); }} className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                                      View details
                                    </button>
                                    <button type="button" onClick={() => handleEditStudent(student)} className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                                      Edit student
                                    </button>
                                    <button type="button" onClick={() => openDeleteStudent(student)} className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50 cursor-pointer">
                                      Delete student
                                    </button>
                                  </div>,
                                  document.body
                                )
                              : null}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AmsPagination
                currentPage={pageIndex}
                pageSize={pageSize}
                totalItems={filteredStudents.length}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
                label="Showing"
                itemLabel="students"
              />
            </div>
          </>
        )}

        {!isLoading && !error && filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded border border-slate-200 bg-white py-20 px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded bg-indigo-50 text-indigo-500">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">No students in this academic year yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-lg">
              This page stays empty until you promote students from the previous academic year into the current one.
              Use the promotion settings to move students into the active year.
            </p>
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
          studentId: editingStudent.studentId ?? '',
          className: editingStudent.classCourseName ?? classCourses[0]?.name ?? '',
          section: editingStudent.section ?? classCourses[0]?.section ?? '',
          guardianName: editingStudent.guardianName ?? '',
          parentMobile: editingStudent.parentMobile,
          guardianEmail: editingStudent.guardianEmail ?? '',
          gender: editingStudent.gender ?? '',
          dateOfBirth: editingStudent.dateOfBirth ?? '',
          admissionDate: editingStudent.admissionDate ?? '',
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
        studentIdReadOnly
        onSubmit={handleSaveStudent}
      />

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-3">
          <div className="bg-white rounded w-full max-w-3xl overflow-hidden shadow-xl">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {selectedStudent.avatarUrl ? (
                  <img
                    src={selectedStudent.avatarUrl.startsWith('http') ? selectedStudent.avatarUrl : `${API_BASE_URL}${selectedStudent.avatarUrl}`}
                    alt={selectedStudent.fullName}
                    className="h-24 w-24 rounded object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded bg-indigo-100 text-indigo-700 font-semibold text-3xl">
                    {selectedStudent.fullName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{selectedStudent.fullName}</h2>
                    <span className={`inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ${selectedStudent.status !== 'Active' ? 'bg-slate-100 text-slate-600' : ''}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${selectedStudent.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {selectedStudent.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{selectedStudent.email}</p>
                  {selectedStudent.groupName ? (
                    <p className="text-xs text-slate-600 mt-2">Group: {selectedStudent.groupName}</p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase text-slate-900">Account information</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Student ID</p>
                    <p className="text-sm text-slate-700">{selectedStudent.studentId || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Gender</p>
                    <p className="text-sm text-slate-700">{selectedStudent.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Date of birth</p>
                    <p className="text-sm text-slate-700">{formatDate(selectedStudent.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Admission date</p>
                    <p className="text-sm text-slate-700">{formatDate(selectedStudent.admissionDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Class</p>
                    <p className="text-sm text-slate-700">{selectedStudent.classCourseName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Section</p>
                    <p className="text-sm text-slate-700">{selectedStudent.section ? (selectedStudent.groupName ? `${selectedStudent.section} (${selectedStudent.groupName})` : selectedStudent.section) : '—'}</p>
                  </div>
                  {selectedStudent.groupName && (
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400 mb-2">Group</p>
                      <p className="text-sm text-slate-700">{selectedStudent.groupName}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded border border-slate-200 px-5 py-4">
                <p className="text-xs font-bold uppercase text-slate-900 mb-3">Guardian on file</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Name</p>
                    <p className="text-sm text-slate-700">{selectedStudent.guardianName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Email</p>
                    <p className="text-sm text-slate-700">{selectedStudent.guardianEmail || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400 mb-2">Mobile No</p>
                    <p className="text-sm text-slate-700">{selectedStudent.parentMobile || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-3">
              <Button type="button" variant="secondary" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <AmsDeleteComfiramtionModal
        open={Boolean(pendingDeleteStudent)}
        onClose={() => setPendingDeleteStudent(null)}
        title="Delete student?"
        description={pendingDeleteStudent ? `${pendingDeleteStudent.fullName} will be removed. This action cannot be undone.` : undefined}
        onConfirm={confirmDeleteStudent}
        confirmVariant="danger"
      >
      </AmsDeleteComfiramtionModal>
    </AppShell>
  );
}