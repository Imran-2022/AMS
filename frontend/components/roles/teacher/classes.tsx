"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/shared/layout';
import { AmsPagination, PageLoader } from '../../ui';
import { getAssignments, getClassCourses, getEnrollments, getSubjects } from '@/lib/api';
import type { AssignmentDto, ClassCourseDto, StudentEnrollmentDto, SubjectDto } from '@/lib/api';

export function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [enrollments, setEnrollments] = useState<StudentEnrollmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('All classes');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [searchTerm, setSearchTerm] = useState('');
  const PAGE_SIZE_OPTIONS = [4, 8, 12] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(4);
  const [pageIndex, setPageIndex] = useState(0);

  async function loadData() {
    setError(null);
    setLoading(true);
    try {
      const [apiClasses, apiSubjects, apiAssignments, apiEnrollments] = await Promise.all([
        getClassCourses(),
        getSubjects(),
        getAssignments(),
        getEnrollments()
      ]);
      setClasses(apiClasses);
      setSubjects(apiSubjects);
      setAssignments(apiAssignments);
      setEnrollments(apiEnrollments);
    } catch (err) {
      console.error(err);
      setError('Unable to load classes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Listen for academic year changes and reload data
  useEffect(() => {
    const handleAcademicYearChanged = () => {
      void loadData();
    };

    window.addEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    return () => {
      window.removeEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    };
  }, []);

  const classSubjectsMap = useMemo(() => {
    return subjects.reduce<Record<string, string[]>>((acc, subject) => {
      const currentSubjects = acc[subject.classCourseId] ?? [];
      acc[subject.classCourseId] = Array.from(new Set([...currentSubjects, subject.name]));
      return acc;
    }, {});
  }, [subjects]);

  const classAssignmentCountMap = useMemo(() => {
    return assignments.reduce<Record<string, number>>((acc, assignment) => {
      acc[assignment.classCourseId] = (acc[assignment.classCourseId] ?? 0) + 1;
      return acc;
    }, {});
  }, [assignments]);

  const classStudentCountMap = useMemo(() => {
    return enrollments.reduce<Record<string, number>>((acc, enrollment) => {
      acc[enrollment.classCourseId] = (acc[enrollment.classCourseId] ?? 0) + 1;
      return acc;
    }, {});
  }, [enrollments]);

  const cards = useMemo(() => {
    const activeAssignments = assignments.filter((assignment) => assignment.status === 'Published').length;
    const draftAssignments = assignments.filter((assignment) => assignment.status === 'Draft').length;

    return {
      classCount: classes.length,
      subjectCount: subjects.length,
      activeAssignmentCount: activeAssignments,
      draftAssignmentCount: draftAssignments
    };
  }, [assignments, classes.length, subjects.length]);

  useEffect(() => {
    setPageIndex(0);
  }, [classes.length]);

  const availableClasses = useMemo(
    () => ['All classes', ...Array.from(new Set(classes.map((classCourse) => classCourse.name)))],
    [classes]
  );

  const availableSubjects = useMemo(() => {
    if (classFilter === 'All classes') {
      const allSubjectNames = subjects.flatMap((subject) => subject.name);
      return ['All subjects', ...Array.from(new Set(allSubjectNames))];
    }

    const selectedClass = classes.find((classCourse) => classCourse.name === classFilter);
    if (!selectedClass) {
      return ['All subjects'];
    }

    const subjectNames = classSubjectsMap[selectedClass.id] ?? [];
    return ['All subjects', ...subjectNames];
  }, [classFilter, classSubjectsMap, classes, subjects]);

  const visibleClasses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return classes.filter((classCourse) => {
      const classSubjects = classSubjectsMap[classCourse.id] ?? [];
      const matchesClass = classFilter === 'All classes' || classCourse.name === classFilter;
      const matchesSubject = subjectFilter === 'All subjects' || classSubjects.includes(subjectFilter);
      const matchesSearch = !normalizedSearch || [
        classCourse.name,
        classCourse.section,
        classCourse.academicYear,
        ...classSubjects
      ].some((value) => String(value ?? '').toLowerCase().includes(normalizedSearch));

      return matchesClass && matchesSubject && matchesSearch;
    });
  }, [classFilter, classSubjectsMap, classes, searchTerm, subjectFilter]);

  const pagedClasses = useMemo(() => {
    const start = pageIndex * pageSize;
    return visibleClasses.slice(start, start + pageSize);
  }, [pageIndex, pageSize, visibleClasses]);

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My Classes">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-brand-600">TEACHER PORTAL</p>
          <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">My Classes</h1>
        </div>

        {loading ? (
          <PageLoader title="Loading classes" subtitle="Loading your classes and class data…" />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">CLASSES</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.classCount}</p>
            <p className="mt-1 text-xs text-slate-400">Your assigned classes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">SUBJECTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.subjectCount}</p>
            <p className="mt-1 text-xs text-slate-400">Unique subjects assigned</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">ACTIVE ASSIGNMENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.activeAssignmentCount}</p>
            <p className="mt-1 text-xs text-slate-400">Published assignments</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">DRAFT ASSIGNMENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.draftAssignmentCount}</p>
            <p className="mt-1 text-xs text-slate-400">Waiting to publish</p>
          </div>
        </div>

        {classes.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" className="rounded px-4 py-2 text-sm font-semibold bg-brand-600 text-white shadow-sm">
                  All classes <span className="ml-1 font-normal opacity-70">{classes.length}</span>
                </button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select value={classFilter} onChange={(event) => {
                  setClassFilter(event.target.value);
                  setSubjectFilter('All subjects');
                }} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500  cursor-pointer">
                  {availableClasses.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500 cursor-pointer">
                  {availableSubjects.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="relative min-w-[240px]">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search classes, subjects…" className="w-full rounded border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {visibleClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h5M8 15l2 2 4-4" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">No classes found</p>
            <p className="mt-2 max-w-md text-sm text-slate-500">No matching class or subject is available for your current filter.</p>
          </div>
        ) : (
        <div className="grid grid-cols-2 gap-5">
          {pagedClasses.map((classCourse) => {
            const subjectsForClass = classSubjectsMap[classCourse.id] ?? [];
            const assignmentCount = classAssignmentCountMap[classCourse.id] ?? 0;
            const studentCount = classStudentCountMap[classCourse.id] ?? 0;
            const publishedAssignments = assignments.filter((item) => item.classCourseId === classCourse.id && item.status === 'Published').length;
            const draftAssignments = assignments.filter((item) => item.classCourseId === classCourse.id && item.status === 'Draft').length;

            return (
              <Link key={classCourse.id} href={`/roles/teacher/assignments?classCourseId=${encodeURIComponent(classCourse.id)}`} className="class-card block cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-200 hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)] transition duration-150">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-extrabold text-slate-800">{classCourse.name} — {classCourse.section}</p>
                    <span className="badge mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                      <span className="badge-dot h-2 w-2 rounded-full bg-emerald-500"></span>
                      {classCourse.academicYear}
                    </span>
                  </div>
                  <svg className="chevron mt-1 h-5 w-5 shrink-0 text-slate-300 transition duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {subjectsForClass.map((subject) => (
                    <span key={subject} className="chip inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11.5px] font-semibold text-sky-700">{subject}</span>
                  ))}
                  {subjectsForClass.length === 0 && (
                    <span className="chip inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11.5px] font-semibold text-slate-500">No subjects</span>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-slate-400">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      <p className="text-[10.5px] font-bold tracking-wide">STUDENTS</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-800">{studentCount}</p>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-emerald-500">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                      <p className="text-[10.5px] font-bold tracking-wide">PUBLISHED</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-800">{publishedAssignments}</p>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-amber-500">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      <p className="text-[10.5px] font-bold tracking-wide">DRAFT</p>
                    </div>
                    <p className="text-lg font-extrabold text-slate-800">{draftAssignments}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        )}

        {visibleClasses.length > 0 && (
          <AmsPagination
            currentPage={pageIndex}
            pageSize={pageSize}
            totalItems={visibleClasses.length}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size as typeof PAGE_SIZE_OPTIONS[number]);
              setPageIndex(0);
            }}
            itemLabel="classes"
          />
        )}
          </>
        )}
      </div>
    </AppShell>
  );
}
