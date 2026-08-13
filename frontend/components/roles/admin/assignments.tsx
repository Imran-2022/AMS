"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/shared/layout';
import { AmsPagination } from '../../ui';
import { getAssignments, type AssignmentDto } from '@/lib/api';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function AdminAssignmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'All' | 'Published'>('All');
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [selectedTeacher, setSelectedTeacher] = useState('All teachers');
  const [search, setSearch] = useState('');
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const ALL_CLASSES = useMemo(
    () => ['All classes', ...Array.from(new Set(assignments.map((assignment) => `${assignment.classCourseName} - ${assignment.classCourseSection}`)))],
    [assignments]
  );

  const ALL_TEACHERS = useMemo(
    () => ['All teachers', ...Array.from(new Set(assignments.map((assignment) => assignment.teacherName || 'Unknown')))],
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      if (activeTab !== 'All' && assignment.status !== 'Published') {
        return false;
      }
      if (assignment.status !== 'Published') {
        return false;
      }
      const assignmentClass = `${assignment.classCourseName} - ${assignment.classCourseSection}`;
      if (selectedClass !== 'All classes' && assignmentClass !== selectedClass) {
        return false;
      }
      if (selectedTeacher !== 'All teachers' && (assignment.teacherName || 'Unknown') !== selectedTeacher) {
        return false;
      }
      const term = search.trim().toLowerCase();
      if (!term) {
        return true;
      }
      return (
        assignment.title.toLowerCase().includes(term) ||
        assignmentClass.toLowerCase().includes(term) ||
        (assignment.teacherName || 'Unknown').toLowerCase().includes(term)
      );
    });
  }, [activeTab, selectedClass, selectedTeacher, search, assignments]);

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) {
      return deadline;
    }
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const totals = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((item) => item.status === 'Published').length;
    const drafts = 0;
    const dueSoon = assignments.filter((item) => {
      const due = Date.parse(item.deadline);
      return !Number.isNaN(due) && due >= Date.now() && due <= Date.now() + 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, published, drafts, dueSoon };
  }, [assignments]);

  useEffect(() => {
    async function loadAssignments() {
      setIsLoading(true);
      try {
        const items = await getAssignments();
        setAssignments(items.filter((assignment) => assignment.status === 'Published'));
      } catch (error) {
        console.error('Failed to load assignments', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAssignments();
  }, []);


  const rowCount = filteredAssignments.length;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  const pagedAssignments = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, pageIndex, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));

  return (
    <AppShell role="Admin" breadcrumb="Admin / Assignments">
      <div ref={rootRef} className="space-y-5">
          <div>
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Assignments</h1>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <svg className="w-5 h-5 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-xs text-brand-700">
            Assignments are created by teachers for their own subjects. As admin, you can view everything here — but content is owned by the teacher.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">TOTAL ASSIGNMENTS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.total}</p>
            <p className="text-xs text-slate-400 mt-1">Across all classes</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">PUBLISHED</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.published}</p>
            <p className="text-xs text-slate-400 mt-1">Live for students</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">DRAFTS</p>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.drafts}</p>
            <p className="text-xs text-slate-400 mt-1">Not visible to students yet</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">DUE SOON</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 7v5l3 3" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.dueSoon}</p>
            <p className="text-xs text-slate-400 mt-1">Deadlines within 7 days</p>
          </div>
        </div>

        {assignments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {(['All', 'Published'] as const).map((tab) => (
              <button
                key={tab}
                type="button" onClick={() => setActiveTab(tab)}
                className={`tab cursor-pointer px-4 py-2 rounded px-3 py-2.5 text-sm font-semibold ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {tab} <span className="opacity-70 font-normal">{tab === 'All' ? totals.total : totals.published}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 flex-1 justify-end min-w-[320px] flex-wrap">
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="text-sm border border-slate-200 rounded px-3 py-2.5 text-slate-600 bg-white">
              {ALL_CLASSES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              value={selectedTeacher}
              onChange={(event) => setSelectedTeacher(event.target.value)}
              className="text-sm border border-slate-200 rounded px-3 py-2.5 text-slate-600 bg-white">
              {ALL_TEACHERS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="relative w-56">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search assignments…"
                className="w-full rounded border border-slate-200 px-8 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>
        ) : null}

        {filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 mx-auto">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10h18" />
                <path d="M3 14h18" />
                <path d="M3 18h10" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">No assignments found</p>
            <p className="mt-2 max-w-md text-sm text-slate-500 mx-auto">
              {search || selectedClass !== 'All classes' || selectedTeacher !== 'All teachers' || activeTab !== 'All'
                ? 'Try a different search or filter to find assignments.'
                : 'There are no assignments yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">TITLE</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">CLASS</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">TEACHER</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">DEADLINE</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">SUBMISSIONS</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedAssignments.map((assignment) => {
                  const teacherName = assignment.teacherName ?? 'Unknown';
                  const initials = teacherName
                    .split(' ')
                    .map((part) => part[0])
                    .join('');
                  const statusClasses =
                    assignment.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-600'
                      : assignment.status === 'Draft'
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-rose-50 text-rose-600';

                  return (
                    <tr
                      key={assignment.id}
                      tabIndex={0}
                      onClick={() => router.push(`/roles/admin/assignments/${assignment.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          router.push(`/roles/admin/assignments/${assignment.id}`);
                        }
                      }}
                      className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{assignment.title}</td>
                      <td className="px-5 py-3.5 text-slate-500">{`${assignment.classCourseName} - ${assignment.classCourseSection}`}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">{initials}</div>
                          <span className="text-slate-600">{assignment.teacherName ?? 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{formatDeadline(assignment.deadline)}</td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">{assignment.submittedCount ?? 0} / {assignment.totalStudents ?? 0}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                        <span className={`inline-flex justify-center rounded-full px-3 py-1 text-xs font-semibold leading-5 ${statusClasses}`}>
                          {assignment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <AmsPagination
              currentPage={pageIndex}
              pageSize={pageSize}
              totalItems={filteredAssignments.length}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
              label="Showing"
              itemLabel="assignments"
            />
          </div>
        )}
      </div>

    </AppShell>
  );
}
