"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Search } from 'lucide-react';
import { AppShell } from '@/shared/layout';
import { AmsPagination, Button } from '../../ui';
import { getAssignments, getSubmissions } from '@/lib/api';
import type { AssignmentDto, SubmissionDto } from '@/lib/api';

type StatusFilter = 'all' | 'pending' | 'graded';

type GradeModalState = SubmissionDto | null;

const statusStyles: Record<string, string> = {
  Submitted: 'bg-amber-50 text-amber-600',
  Late: 'bg-amber-50 text-amber-600',
  UnderReview: 'bg-amber-50 text-amber-600',
  ResubmissionRequested: 'bg-rose-50 text-rose-600',
  Resubmitted: 'bg-amber-50 text-amber-600',
  Graded: 'bg-emerald-50 text-emerald-600',
};

const statusDotStyles: Record<string, string> = {
  Submitted: 'bg-amber-500',
  Late: 'bg-amber-500',
  UnderReview: 'bg-amber-500',
  ResubmissionRequested: 'bg-rose-500',
  Resubmitted: 'bg-amber-500',
  Graded: 'bg-emerald-500',
};

function getStatusLabel(status: string) {
  switch (status) {
    case 'Graded':
      return 'Graded';
    case 'ResubmissionRequested':
      return 'Resubmission Requested';
    case 'Late':
      return 'Late';
    case 'UnderReview':
      return 'Under review';
    case 'Resubmitted':
      return 'Resubmitted';
    default:
      return 'Pending review';
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[status]}`}>
      <span className={`h-2 w-2 rounded-full ${statusDotStyles[status]}`} />
      {getStatusLabel(status)}
    </span>
  );
}

export function TeacherSubmissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [classFilter, setClassFilter] = useState('All classes');
  const [sectionFilter, setSectionFilter] = useState('All sections');
  const [assignmentFilter, setAssignmentFilter] = useState('All assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    async function loadSubmissions() {
      setLoadError(null);
      try {
        const [apiSubmissions, apiAssignments] = await Promise.all([getSubmissions(), getAssignments()]);
        setSubmissions(apiSubmissions);
        setAssignments(apiAssignments);
      } catch (error) {
        console.error(error);
        setLoadError('Unable to load submissions. Please refresh the page.');
      }
    }

    void loadSubmissions();
  }, []);

  useEffect(() => {
    const assignmentId = searchParams.get('assignmentId');
    if (!assignmentId) return;

    const selectedAssignment = assignments.find((assignment) => assignment.id === assignmentId);
    const selectedSubmission = submissions.find((submission) => submission.assignmentId === assignmentId);
    const assignmentTitle = selectedAssignment?.title ?? selectedSubmission?.assignmentTitle;
    if (assignmentTitle) {
      setAssignmentFilter(assignmentTitle);
      setPageIndex(0);
    }
  }, [assignments, searchParams, submissions]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((submission) => ['Submitted', 'Late', 'UnderReview', 'Resubmitted'].includes(submission.status)).length;
    const needsRevision = submissions.filter((submission) => submission.status === 'ResubmissionRequested').length;
    const graded = submissions.filter((submission) => submission.status === 'Graded').length;

    return { total, pending, needsRevision, pendingWithRevision: pending + needsRevision, graded };
  }, [submissions]);

  const visibleSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const isPending = ['Submitted', 'Late', 'UnderReview', 'Resubmitted', 'ResubmissionRequested'].includes(submission.status);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && isPending) ||
        (activeTab === 'graded' && submission.status === 'Graded');
      const matchesClass = classFilter === 'All classes' || submission.classCourseName === classFilter;
      const matchesSection = sectionFilter === 'All sections' || submission.classCourseSection === sectionFilter;
      const matchesAssignment = assignmentFilter === 'All assignments' || submission.assignmentTitle === assignmentFilter;
      const matchesSearch = [submission.studentName, submission.assignmentTitle].join(' ').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesClass && matchesSection && matchesAssignment && matchesSearch;
    });
  }, [activeTab, assignmentFilter, classFilter, searchTerm, sectionFilter, submissions]);

  const availableClasses = useMemo(
    () => ['All classes', ...Array.from(new Set(submissions.map((submission) => submission.classCourseName)))],
    [submissions]
  );

  const availableSections = useMemo(() => {
    const sections = submissions.filter((submission) => classFilter === 'All classes' || submission.classCourseName === classFilter).map((submission) => submission.classCourseSection);
    return ['All sections', ...Array.from(new Set(sections))];
  }, [classFilter, submissions]);

  const availableAssignments = useMemo(
    () => ['All assignments', ...Array.from(new Set([
      ...assignments.map((assignment) => assignment.title),
      ...submissions.map((submission) => submission.assignmentTitle),
    ]))],
    [assignments, submissions]
  );

  const pagedSubmissions = useMemo(() => {
    const start = pageIndex * pageSize;
    return visibleSubmissions.slice(start, start + pageSize);
  }, [visibleSubmissions, pageIndex, pageSize]);

  const handleClassChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextClass = event.target.value;
    setClassFilter(nextClass);
    setSectionFilter('All sections');
  };

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Submissions">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold  text-brand-600">TEACHER PORTAL</p>
          <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">Submissions Review &amp; Grading</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold  text-slate-400">TOTAL SUBMISSIONS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-400">Across your assignments</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold  text-slate-400">PENDING REVIEW</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.pending}</p>
            <p className="mt-1 text-xs text-slate-400">Needs marks &amp; feedback</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold  text-slate-400">GRADED</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.graded}</p>
            <p className="mt-1 text-xs text-slate-400">Marks entered</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold  text-slate-400">NEEDS REVISION</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.needsRevision}</p>
            <p className="mt-1 text-xs text-slate-400">Resubmission requested</p>
          </div>
        </div>

        {submissions.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'pending', 'graded'] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={activeTab === status ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab(status)}
                    className={`tab cursor-pointer px-4 py-2 text-sm font-semibold ${activeTab === status ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {status === 'all' ? 'All' : status === 'pending' ? 'Pending' : 'Graded'}
                    <span className="opacity-70 font-normal"> {status === 'all' ? stats.total : status === 'pending' ? stats.pendingWithRevision : stats.graded}</span>
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select value={classFilter} onChange={handleClassChange} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                  {availableClasses.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                  {availableSections.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                  {availableAssignments.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="relative min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search by student…" className="w-full rounded border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {visibleSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                <FileText className="h-7 w-7" />
              </div>
              <p className="text-base font-bold text-slate-800">No submissions yet</p>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Once your students submit their work, submissions will appear here for review.
              </p>
            </div>
          ) : (
            <>
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
                  {visibleSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      tabIndex={0}
                      className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none transition-colors"
                      onClick={() => router.push(`/roles/teacher/submissions/${submission.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          router.push(`/roles/teacher/submissions/${submission.id}`);
                        }
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {submission.avatarUrl ? (
                            <img
                              src={submission.avatarUrl}
                              alt={submission.studentName}
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                event.currentTarget.nextElementSibling?.removeAttribute('hidden');
                              }}
                            />
                          ) : null}
                          <div hidden={Boolean(submission.avatarUrl)} className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                            {submission.studentInitials}
                          </div>
                          <span className="font-semibold text-slate-700">{submission.studentName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3.5 text-slate-500">{submission.assignmentTitle}</td>
                      <td className={`px-2 py-3.5 ${submission.submittedAt ? 'text-slate-500' : 'text-slate-400 italic'}`}>
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Not submitted'}
                      </td>
                      <td className="px-2 py-3.5">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="px-2 py-3.5 text-slate-600">
                        {submission.status === 'Graded' ? `${submission.marks ?? 0}/${submission.maxMarks ?? 35}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleSubmissions.length > 0 && (
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
              )}
            </>
          )}
        </div>

        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{loadError}</div>
        )}
      </div>
    </AppShell>
  );
}
