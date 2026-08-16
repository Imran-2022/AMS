"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/shared/layout';
import { AmsPagination, Button, FileUpload, PageLoader } from '../../ui';
import { createSubmission, getAssignments, getMySubmissions, type AssignmentDto, type SubmissionDto, updateSubmission, uploadAttachment } from '@/lib/api';

function getStudentStatusLabel(status: string | undefined) {
  switch (status) {
    case 'ResubmissionRequested':
      return 'Resubmission Requested';
    case 'Resubmission':
      return 'Resubmission';
    case 'Submitted':
      return 'Submitted';
    case 'Graded':
      return 'Graded';
    case 'Not submitted':
      return 'Not submitted';
    default:
      return status ?? 'Not submitted';
  }
}

export function StudentAssignmentsPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'missing'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'submit' | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null } | null>(null);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE_OPTIONS = [5, 10, 15] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(5);
  const [pageIndex, setPageIndex] = useState(0);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [apiAssignments, apiSubmissions] = await Promise.all([getAssignments(), getMySubmissions()]);
        setAssignments(apiAssignments);
        setSubmissions(apiSubmissions);
      } catch {
        setAssignments([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const mapAssignments = useMemo(() => {
    return [...assignments]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id) ?? null;
        return {
          ...a,
          studentStatus: sub ? sub.status : 'Not submitted',
          submission: sub,
        } as AssignmentDto & { studentStatus: string; submission: SubmissionDto | null };
      });
  }, [assignments, submissions]);

  const isPastDue = (deadline: string) => new Date(deadline) < now;

  const tabCounts = useMemo(() => {
    return {
      all: mapAssignments.length,
      pending: mapAssignments.filter((item) => item.studentStatus === 'Not submitted').length,
      submitted: mapAssignments.filter((item) => item.studentStatus === 'Submitted').length,
      graded: mapAssignments.filter((item) => item.studentStatus === 'Graded').length,
      missing: mapAssignments.filter((item) => item.studentStatus === 'Not submitted' && isPastDue(item.deadline)).length,
    };
  }, [mapAssignments, now]);

  const subjectOptions = useMemo(() => Array.from(new Set(assignments.map((a) => a.subjectName))), [assignments]);

  const filteredAssignments = useMemo(() => {
    return mapAssignments.filter((item) => {
      const matchesTab =
        currentTab === 'all' ||
        (currentTab === 'pending' && item.studentStatus === 'Not submitted' && !isPastDue(item.deadline)) ||
        (currentTab === 'submitted' && item.studentStatus === 'Submitted') ||
        (currentTab === 'graded' && item.studentStatus === 'Graded') ||
        (currentTab === 'missing' && item.studentStatus === 'Not submitted' && isPastDue(item.deadline));
      const matchesSubject = !subjectFilter || item.subjectName === subjectFilter;
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSubject && matchesSearch;
    });
  }, [mapAssignments, currentTab, subjectFilter, searchTerm, now]);

  useEffect(() => {
    setPageIndex(0);
  }, [currentTab, subjectFilter, searchTerm, pageSize]);

  const pagedAssignments = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, pageIndex, pageSize]);

  const openSubmit = (assignment: AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null }) => {
    setSelectedAssignment(assignment);
    setModalType('submit');
    setComment(assignment.submission?.contentText ?? '');
    setSelectedFiles([]);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedAssignment(null);
    setComment('');
    setSelectedFiles([]);
  };

  async function submitAssignment() {
    if (!selectedAssignment) return;
    if (!comment.trim()) {
      alert('Description is required.');
      return;
    }
    try {
      setLoading(true);
      let submission: SubmissionDto;
      if (selectedAssignment.submission) {
        submission = await updateSubmission(selectedAssignment.submission.id, { contentText: comment });
      } else {
        submission = await createSubmission({ assignmentId: selectedAssignment.id, contentText: comment });
      }
      if (selectedFiles.length > 0) {
        await Promise.all(selectedFiles.map((file) => uploadAttachment('Submission', submission.id, file)));
      }
      const mine = await getMySubmissions();
      setSubmissions(mine);
      setModalType(null);
      setSelectedAssignment(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  }

  const totalAssignments = mapAssignments.length;
  const dueThisWeekCount = mapAssignments.filter((item) => item.studentStatus === 'Not submitted' && !isPastDue(item.deadline)).length;
  const awaitingGradeCount = mapAssignments.filter((item) => item.studentStatus === 'Submitted').length;
  const missingCount = mapAssignments.filter((item) => item.studentStatus === 'Not submitted' && isPastDue(item.deadline)).length;

  const subjectBadgeClass = (subject: string) => {
    const normalized = subject.toLowerCase();
    if (normalized.includes('math')) return 'bg-brand-50 text-brand-700';
    if (normalized.includes('phys')) return 'bg-sky-50 text-sky-700';
    if (normalized.includes('bio')) return 'bg-emerald-50 text-emerald-700';
    if (normalized.includes('eng')) return 'bg-violet-50 text-violet-700';
    return 'bg-slate-100 text-slate-700';
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'Not submitted') return 'bg-amber-50 text-amber-600';
    if (status === 'Submitted') return 'bg-sky-50 text-sky-600';
    if (status === 'Graded') return 'bg-emerald-50 text-emerald-600';
    return 'bg-rose-50 text-rose-600';
  };

  if (loading) {
    return (
      <AppShell role="Student" breadcrumb="Student / Assignments">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand-600">STUDENT PORTAL</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-800">My Assignments</h1>
          </div>
          <PageLoader title="Loading assignments" subtitle="Loading your upcoming and submitted work…" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-brand-600">STUDENT PORTAL</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-800">My Assignments</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">TOTAL</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totalAssignments}</p>
            <p className="mt-1 text-xs text-slate-400">Across all subjects</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">DUE THIS WEEK</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{dueThisWeekCount}</p>
            <p className="mt-1 text-xs text-slate-400">Not yet submitted</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">AWAITING GRADE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12a10 10 0 1 1-4-8" /><path d="M22 4 12 14.01l-3-3" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{awaitingGradeCount}</p>
            <p className="mt-1 text-xs text-slate-400">Submitted, not graded yet</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">MISSING</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{missingCount}</p>
            <p className="mt-1 text-xs text-slate-400">Past deadline, no submission</p>
          </div>
        </div>

        {assignments.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {(['all', 'pending', 'submitted', 'graded', 'missing'] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={currentTab === status ? 'primary' : 'ghost'}
                    onClick={() => setCurrentTab(status)}
                    className={`tab cursor-pointer px-4 py-2 text-sm font-semibold ${currentTab === status ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    {status === 'all' ? 'All' : status === 'pending' ? 'To do' : status === 'submitted' ? 'Submitted' : status === 'graded' ? 'Graded' : 'Missing'}
                    <span className="opacity-70 font-normal"> {tabCounts[status]}</span>
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                  <option value="">All subjects</option>
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <div className="relative min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search assignments…"
                    className="w-full rounded border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredAssignments.length ? (
            pagedAssignments.map((assignment) => {
              const badgeClass = statusBadgeClass(assignment.studentStatus);
              const statusLabel = assignment.studentStatus === 'Not submitted'
                ? (isPastDue(assignment.deadline) ? 'Missing' : 'Due soon')
                : assignment.studentStatus === 'Submitted'
                  ? 'Submitted'
                  : assignment.studentStatus === 'Graded'
                    ? 'Graded'
                    : getStudentStatusLabel(assignment.studentStatus);

              return (
                <Link href={`/roles/student/assignments/${assignment.id}`} key={assignment.id} className={`group block rounded-2xl border bg-white p-5 transition hover:border-brand-500 hover:shadow-md focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${assignment.studentStatus === 'Not submitted' && isPastDue(assignment.deadline) ? 'border-dashed border-rose-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-slate-800 transition group-hover:text-brand-600">
                          {assignment.title}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${subjectBadgeClass(assignment.subjectName)}`}>
                          {assignment.subjectName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{assignment.teacherName ?? ''} · Max marks: {assignment.maxMarks ?? 0}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${assignment.studentStatus === 'Not submitted' ? 'bg-amber-500' : assignment.studentStatus === 'Submitted' ? 'bg-sky-500' : assignment.studentStatus === 'Graded' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {statusLabel}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">{assignment.description ?? ''}</p>

                  <div className="mt-4">
                    <span className="rounded bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-400">Due: {new Date(assignment.deadline).toLocaleString()}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
              <p className="text-base font-bold text-slate-700">Nothing here</p>
              <p className="mt-1 max-w-sm text-sm text-slate-400">No assignments match this filter right now.</p>
            </div>
          )}
          {!loading && filteredAssignments.length > 0 && (
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
          )}
        </div>

        {modalType && selectedAssignment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
            <div className="bg-white rounded-[28px] w-full max-w-[720px] max-h-[90vh] flex flex-col shadow-[0_18px_65px_rgba(15,23,42,0.18)] overflow-hidden">
              <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-[32px] font-extrabold leading-none text-slate-800 tracking-[-0.03em]">
                    {selectedAssignment.submission ? 'Resubmit work' : (isPastDue(selectedAssignment.deadline) ? 'Submit late work' : 'Submit work')}
                  </h2>
                  <p className="text-base text-slate-400 mt-3">{selectedAssignment.subjectName} ·</p>
                </div>
                <Button type="button" variant="ghost" onClick={closeModal} className="inline-flex h-10 w-10 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </Button>
              </div>

              <div className="overflow-y-auto px-7 py-6 space-y-5">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Attachments <span className="font-normal text-slate-400">(optional)</span></label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <FileUpload
                        multiple
                        selectedFiles={selectedFiles}
                        existingAttachments={(selectedAssignment.submission?.attachments ?? []).map((attachment) => ({
                          id: attachment.id,
                          originalFileName: attachment.originalFileName,
                          downloadUrl: attachment.downloadUrl,
                          sizeBytes: attachment.sizeBytes,
                        }))}
                        onFileSelected={(file) => {
                          setSelectedFiles((current) => [...current, file]);
                        }}
                        onFilesSelected={setSelectedFiles}
                        allowedTypesText="PDF, DOCX, TXT, ZIP, PNG, JPG (Max 10MB)"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Description <span className="text-rose-500">*</span></label>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a note for your teacher…"
                      className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/80">
                <Button type="button" variant="secondary" onClick={closeModal} className="border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="button" disabled={!comment.trim()} onClick={submitAssignment} className="bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
                  {selectedAssignment.submission ? 'Re-submit' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
