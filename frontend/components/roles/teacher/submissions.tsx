"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { FileText, Search, X } from 'lucide-react';
import { AppShell } from '../../layout/AppShell';
import { AmsPagination } from '../../ui';
import { getSubmissions, gradeSubmission, updateSubmissionStatus } from '@/lib/api';
import type { SubmissionDto } from '@/lib/api';

type StatusFilter = 'all' | 'pending' | 'graded' | 'needs_revision';

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
      return 'Needs revision';
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
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [classFilter, setClassFilter] = useState('All classes');
  const [sectionFilter, setSectionFilter] = useState('All sections');
  const [assignmentFilter, setAssignmentFilter] = useState('All assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeModal, setGradeModal] = useState<GradeModalState>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('Submitted');
  const [loadError, setLoadError] = useState<string | null>(null);
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    async function loadSubmissions() {
      setLoadError(null);
      try {
        const apiSubmissions = await getSubmissions();
        setSubmissions(apiSubmissions);
      } catch (error) {
        console.error(error);
        setLoadError('Unable to load submissions. Please refresh the page.');
      }
    }

    void loadSubmissions();
  }, []);

  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((submission) => ['Submitted', 'Late', 'UnderReview', 'Resubmitted'].includes(submission.status)).length;
    const graded = submissions.filter((submission) => submission.status === 'Graded').length;
    const needsRevision = submissions.filter((submission) => submission.status === 'ResubmissionRequested').length;

    return { total, pending, graded, needsRevision };
  }, [submissions]);

  const visibleSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const isPending = ['Submitted', 'Late', 'UnderReview', 'Resubmitted'].includes(submission.status);
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'pending' && isPending) ||
        (activeTab === 'graded' && submission.status === 'Graded') ||
        (activeTab === 'needs_revision' && submission.status === 'ResubmissionRequested');

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
    () => ['All assignments', ...Array.from(new Set(submissions.map((submission) => submission.assignmentTitle)))],
    [submissions]
  );

  const pagedSubmissions = useMemo(() => {
    const start = pageIndex * pageSize;
    return visibleSubmissions.slice(start, start + pageSize);
  }, [visibleSubmissions, pageIndex, pageSize]);

  const openGradeModal = (submission: SubmissionDto) => {
    setGradeModal(submission);
    setMarks(submission.marks?.toString() ?? '');
    setFeedback(submission.feedback ?? '');
    setStatus(submission.status);
  };

  const closeGradeModal = () => {
    setGradeModal(null);
  };

  const handleSaveGrade = async () => {
    if (!gradeModal) return;

    setLoadError(null);

    try {
      let updatedSubmission: SubmissionDto;

      if (status === 'Graded') {
        if (!marks.trim()) {
          setLoadError('Please enter marks before grading.');
          return;
        }
        updatedSubmission = await gradeSubmission(gradeModal.id, {
          marks: Number(marks),
          feedback: feedback.trim() || undefined,
        });
      } else {
        updatedSubmission = await updateSubmissionStatus(gradeModal.id, {
          status,
        });
      }

      setSubmissions((current) => current.map((item) => (item.id === updatedSubmission.id ? updatedSubmission : item)));
      setGradeModal(updatedSubmission);
    } catch (error) {
      console.error(error);
      setLoadError('Unable to save submission updates. Please try again.');
    }
  };

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

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setActiveTab('all')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              All <span className="ml-1 font-normal opacity-70">{stats.total}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('pending')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'pending' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Pending <span className="ml-1 font-normal opacity-70">{stats.pending}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('graded')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'graded' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Graded <span className="ml-1 font-normal opacity-70">{stats.graded}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('needs_revision')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'needs_revision' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Needs revision <span className="ml-1 font-normal opacity-70">{stats.needsRevision}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <select value={classFilter} onChange={handleClassChange} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              {availableClasses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              {availableSections.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              {availableAssignments.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search by student…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500" />
            </div>
          </div>
        </div>

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
                    <th className="w-28 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visibleSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
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
                        {submission.status === 'Graded' ? `${submission.marks ?? 0}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button type="button" onClick={() => openGradeModal(submission)} className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${submission.status === 'Graded' ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                          {submission.status === 'Graded' ? 'View' : 'Grade'}
                        </button>
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

      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={closeGradeModal}>
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {gradeModal.studentInitials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{gradeModal.studentName}</h2>
                  <p className="text-sm text-slate-400">{gradeModal.assignmentTitle}</p>
                </div>
              </div>
              <button type="button" onClick={closeGradeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 overflow-y-auto px-7 py-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 block text-[13px] font-semibold text-slate-800">Submitted work</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{gradeModal.fileName ?? 'No attachment'}</p>
                      <p className="text-xs text-slate-400 mt-1">{gradeModal.submittedAt ? new Date(gradeModal.submittedAt).toLocaleString() : 'Not submitted'}</p>
                    </div>
                  </div>
                  {gradeModal.fileUrl ? (
                    <button type="button" onClick={() => window.open(gradeModal.fileUrl, '_blank')} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      Open attachment
                    </button>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-slate-400">Student comment: “Please review my answers and let me know if I can improve my approach.”</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Marks</label>
                  <div className="flex items-center gap-2">
                    <input value={marks} onChange={(event) => setMarks(event.target.value)} type="number" placeholder="0" className="w-24 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                    <span className="text-sm text-slate-400">/ {gradeModal.marks ?? '—'}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Feedback for student</label>
                  <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Add comments on their work…" className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Submission status</label>
                  <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                    <option value="Submitted">Submitted</option>
                    <option value="Late">Late</option>
                    <option value="UnderReview">Under review</option>
                    <option value="ResubmissionRequested">Request resubmission</option>
                    <option value="Resubmitted">Resubmitted</option>
                    <option value="Graded">Graded</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-400">Changing status updates the submission state for the student.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-3xl border-t border-slate-100 bg-slate-50/60 px-7 py-5">
              <button type="button" onClick={closeGradeModal} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={handleSaveGrade} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Save &amp; notify student
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
