"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AmsPagination, PageLoader } from '../../ui';
import { AppShell } from '@/shared/layout';
import { getSubmissions, type SubmissionDto } from '@/lib/api';

const statusClasses: Record<string, string> = {
  Graded: 'bg-emerald-50 text-emerald-600',
  'Pending review': 'bg-amber-50 text-amber-600',
  Missing: 'bg-rose-50 text-rose-600',
};

const avatarClasses: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
};

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export function AdminSubmissionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'All' | 'Graded' | 'Pending'>('All');
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [selectedAssignment, setSelectedAssignment] = useState('All assignments');
  const [search, setSearch] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const CLASS_OPTIONS = useMemo(
    () => ['All classes', ...Array.from(new Set(submissions.map((item) => `${item.classCourseName} — ${item.classCourseSection}`)))],
    [submissions]
  );

  const ASSIGNMENT_OPTIONS = useMemo(
    () => ['All assignments', ...Array.from(new Set(submissions.map((item) => item.assignmentTitle)))],
    [submissions]
  );

  useEffect(() => {
    async function loadSubmissions() {
      setIsLoading(true);
      try {
        const items = await getSubmissions();
        setSubmissions(items);
      } catch (error) {
        console.error('Failed to load submissions', error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSubmissions();
  }, []);

  const totals = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((item) => item.status === 'Graded').length;
    const pending = submissions.filter((item) => item.status === 'Pending review').length;
    const late = submissions.filter((item) => item.isLate).length;
    return { total, graded, pending, late };
  }, [submissions]);

  const visibleSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Graded' && submission.status === 'Graded') ||
        (activeTab === 'Pending' && submission.status === 'Pending review');

      const submissionClass = `${submission.classCourseName} — ${submission.classCourseSection}`;
      const matchesClass = selectedClass === 'All classes' || submissionClass === selectedClass;
      const matchesAssignment = selectedAssignment === 'All assignments' || submission.assignmentTitle === selectedAssignment;
      const matchesSearch = !query || submission.studentName.toLowerCase().includes(query);

      return matchesTab && matchesClass && matchesAssignment && matchesSearch;
    });
  }, [activeTab, selectedClass, selectedAssignment, search, submissions]);
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  const pagedSubmissions = useMemo(() => {
    const start = pageIndex * pageSize;
    return visibleSubmissions.slice(start, start + pageSize);
  }, [visibleSubmissions, pageIndex, pageSize]);

  if (isLoading) {
    return (
      <AppShell role="Admin" breadcrumb="Admin / Submissions">
        <div className="space-y-6">
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Submissions</h1>
          <PageLoader title="Loading submissions" subtitle="Loading recent submissions and grading data…" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Submissions">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Submissions</h1>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">TOTAL SUBMISSIONS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12a10 10 0 1 1-4-8" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.total}</p>
            <p className="text-xs text-slate-400 mt-1">Across all assignments</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">GRADED</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.graded}</p>
            <p className="text-xs text-slate-400 mt-1">Marks entered</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">PENDING REVIEW</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.pending}</p>
            <p className="text-xs text-slate-400 mt-1">Submitted, awaiting marks</p>
          </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold text-slate-400">LATE SUBMISSIONS</p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l2 2" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{totals.late}</p>
          <p className="text-xs text-slate-400 mt-1">Submitted after deadline</p>
        </div>
      </div>

        {submissions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {(['All', 'Graded', 'Pending'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button" onClick={() => setActiveTab(tab)}
                  className={`tab cursor-pointer px-4 py-2 rounded text-sm font-semibold ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                  {tab} <span className="opacity-70 font-normal">{tab === 'All' ? totals.total : tab === 'Graded' ? totals.graded : totals.pending}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5 flex-1 justify-end min-w-[320px] flex-wrap">
              <select
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
                className="text-sm border border-slate-200 rounded px-3 py-2.5 text-slate-600 bg-white">
                {CLASS_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <select
                value={selectedAssignment}
                onChange={(event) => setSelectedAssignment(event.target.value)}
                className="text-sm border border-slate-200 rounded px-3 py-2.5 text-slate-600 bg-white">
                {ASSIGNMENT_OPTIONS.map((option) => (
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
                  placeholder="Search by student…"
                  className="w-full rounded border border-slate-200 px-8 py-2 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          </div>
        )}

        {visibleSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 mx-auto">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h10" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">No submissions found</p>
            <p className="mt-2 max-w-md text-sm text-slate-500 mx-auto">
              {search || selectedClass !== 'All classes' || selectedAssignment !== 'All assignments' || activeTab !== 'All'
                ? 'No matching submission is available for your current filter.'
                : 'There are no submissions yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">STUDENT</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">ASSIGNMENT</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">SUBMITTED</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">MARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    tabIndex={0}
                    onClick={() => router.push(`/roles/admin/submissions/${submission.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/roles/admin/submissions/${submission.id}`);
                      }
                    }}
                    className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {submission.avatarUrl ? (
                          <img
                            src={submission.avatarUrl}
                            alt={submission.studentName}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarClasses.brand}`}>
                            {submission.studentInitials}
                          </div>
                        )}
                        <span className="font-semibold text-slate-700">{submission.studentName}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 text-slate-500">{submission.assignmentTitle}</td>
                    <td className="px-2 py-3.5 text-slate-500">{submission.submittedAt ?? <span className="italic text-slate-400">Not submitted</span>}</td>
                    <td className="px-2 py-3.5">
                      <span className={`badge ${statusClasses[submission.status]}`}>
                        <span className="badge-dot" />
                        {submission.status}
                      </span>
                    </td>
                    <td className={`px-2 py-3.5 ${submission.marks == null ? 'text-slate-400' : 'font-semibold text-slate-700'}`}>
                      {submission.marks == null ? '—' : submission.marks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <AmsPagination
              currentPage={pageIndex}
              pageSize={pageSize}
              totalItems={visibleSubmissions.length}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
              label="Showing"
              itemLabel="submissions"
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
