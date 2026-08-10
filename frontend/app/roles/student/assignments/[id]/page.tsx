"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAssignment, downloadAttachmentToBrowser, type AssignmentDto } from '@/lib/api';

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const assignmentId = typeof rawId === 'string' ? rawId : '';

  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assignmentId) {
      setError('Assignment id is missing.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAssignment() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAssignment(assignmentId);
        if (!cancelled) {
          setAssignment(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load assignment.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAssignment();

    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  const deadline = useMemo(() => {
    if (!assignment?.deadline) return null;
    return new Date(assignment.deadline);
  }, [assignment?.deadline]);

  const deadlineText = deadline
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(deadline)
    : '';

  const daysRemaining = deadline
    ? Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000))
    : 0;

  const submissionPercent = assignment && assignment.totalStudents
    ? Math.round(((assignment.submittedCount ?? 0) / assignment.totalStudents) * 100)
    : 0;

  const assignmentTitle = assignment?.title ?? 'Assignment';
  const assignmentDescription = assignment?.description ?? 'Assignment description is not available.';
  const className = assignment?.classCourseName ?? 'Class';
  const classSection = assignment?.classCourseSection ?? '';
  const subjectName = assignment?.subjectName ?? '';
  const maxMarks = assignment?.maxMarks ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-5 p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-3xl font-extrabold text-slate-800">{assignmentTitle}</h1>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {assignment?.status ?? 'Draft'}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Loading assignment details...
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Description</p>
                  <p className="text-sm leading-relaxed text-slate-600">{assignmentDescription}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Attachments</p>
                  <p className="mt-0.5 mb-4 text-xs text-slate-400">Reference files students can download.</p>
                  <div className="space-y-2.5">
                    {(assignment?.attachments ?? []).length > 0 ? (
                      (assignment?.attachments ?? []).map((attachment) => (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => void downloadAttachmentToBrowser(attachment.downloadUrl, attachment.originalFileName)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700">{attachment.originalFileName}</p>
                            <p className="text-[11px] text-slate-400">
                              {attachment.contentType} · {Math.max(1, Math.round((attachment.sizeBytes ?? 0) / 1024))} KB
                            </p>
                          </div>
                          <svg className="h-4 w-4 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No attachments available.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="eyebrow">PROGRESS</p>
                    <button className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-700">View submissions →</button>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-[15px]">
                    <span className="font-extrabold text-slate-800">{assignment?.submittedCount ?? 0} submitted</span>
                    <span className="text-slate-400">of {assignment?.totalStudents ?? 0} students</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill bg-slate-300" style={{ width: `${submissionPercent}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {assignment?.submittedCount
                      ? `${assignment.submittedCount} submission${assignment.submittedCount === 1 ? '' : 's'} current`
                      : 'No submissions yet — nothing to grade until a student turns in work.'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Class</p>
                  <p className="text-lg font-extrabold text-slate-800">{className}{classSection ? ` — ${classSection}` : ''}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{subjectName}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Deadline</p>
                  <p className="text-base font-bold text-slate-800">{deadlineText}</p>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Due in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Max marks</p>
                  <p className="text-2xl font-extrabold text-slate-800">{maxMarks}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Submission options</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Allow late submission</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {assignment?.allowLateSubmission ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Allow resubmission</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        {assignment?.allowResubmission ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
