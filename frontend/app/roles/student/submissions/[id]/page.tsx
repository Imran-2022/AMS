"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui';
import { getSubmission, downloadAttachmentToBrowser, type SubmissionDto } from '@/lib/api';

function normalizeFeedbackText(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  if (/^no attachment(?: found)?$/i.test(trimmed)) {
    return '';
  }

  return trimmed;
}

export default function StudentSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const submissionId = typeof rawId === 'string' ? rawId : '';

  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setError('Submission id is missing.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSubmission() {
      try {
        setLoading(true);
        setError(null);
        const data = await getSubmission(submissionId);
        if (!cancelled) setSubmission(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load submission.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const submittedAt = useMemo(() => submission ? new Date(submission.submittedAt) : null, [submission]);
  const submittedText = submittedAt ? new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(submittedAt) : '';

  const feedbackText = normalizeFeedbackText(submission?.feedback);

  const isGraded = submission?.status === 'Graded';

  const statusBadge = (() => {
    if (submission?.status === 'Graded') {
      return {
        label: 'Graded',
        className: 'bg-emerald-50 text-emerald-600',
        dotClassName: 'bg-emerald-500',
      };
    }

    return {
      label: submission?.status ?? 'Submitted',
      className: 'bg-sky-50 text-sky-600',
      dotClassName: 'bg-sky-500',
    };
  })();

  return (
    <AppShell role="Student" breadcrumb="Student / My Submission">
      <div className="space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.06em] text-brand-600">MY SUBMISSION</p>
              <div className="mt-1 flex items-center gap-3">
                <h1 className="text-3xl font-extrabold leading-tight text-slate-800">
                  {submission?.assignmentTitle ?? 'Assignment'}
                </h1>
                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${statusBadge.className}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClassName}`} />
                  {statusBadge.label}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="!gap-1.5 !px-2.5 !py-1.5 !text-xs !whitespace-nowrap"
            >
              <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back
            </Button>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading submission...</div>
          ) : submission ? (
            <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="mb-3 text-[11px] font-bold tracking-[0.06em] text-slate-400">SUBMITTED TEXT</p>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {submission.contentText || 'No written submission added.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="mb-3 text-[11px] font-bold tracking-[0.06em] text-slate-400">ATTACHMENT</p>
                  {submission.attachments?.length ? (
                    submission.attachments.map((attachment) => (
                    <Button
                      key={attachment.id}
                      type="button"
                      variant="ghost"
                      onClick={() => void downloadAttachmentToBrowser(attachment.downloadUrl, attachment.originalFileName)}
                      className="flex cursor-pointer items-center gap-3 border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{attachment.originalFileName}</p>
                        <p className="text-[11px] text-slate-400">{attachment.contentType} · {Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB</p>
                      </div>
                      <svg className="h-4 w-4 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </Button>
                    ))
                  ) : submission.fileName ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => submission.fileUrl ? void downloadAttachmentToBrowser(submission.fileUrl, submission.fileName ?? 'submission-file') : undefined}
                      className="flex cursor-pointer items-center gap-3 border border-slate-100 p-3 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-700">{submission.fileName}</p>
                        <p className="text-[11px] text-slate-400">Submitted file</p>
                      </div>
                      <svg className="h-4 w-4 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" />
                        </svg>
                      </div>
                      <p className="text-sm">No file uploaded for this submission.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="mb-3 text-[11px] font-bold tracking-[0.06em] text-slate-400">TEACHER'S FEEDBACK</p>
                  {isGraded && feedbackText ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">{feedbackText}</p>
                    </div>
                  ) : isGraded ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">No feedback added.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                      <svg className="h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      <p className="text-xs text-sky-700">Your teacher hasn't graded this yet. You'll be notified when marks are posted.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <Link
                  href={`/roles/student/assignments/${submission.assignmentId}`}
                  className="block cursor-pointer rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <p className="mb-3 text-[11px] font-bold tracking-[0.06em] text-slate-400">ASSIGNMENT</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-slate-800 transition hover:text-brand-600">
                      {submission.assignmentTitle}
                    </p>
                    <span className="shrink-0 text-slate-400" aria-hidden="true">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-400">{submission.classCourseName}{submission.classCourseSection ? ` · ${submission.classCourseSection}` : ''}</p>
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="mb-3 text-[11px] font-bold tracking-[0.06em] text-slate-400">SUBMITTED AT</p>
                  <p className="text-base font-bold text-slate-800">{submittedText}</p>
                </div>

                {isGraded ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-[11px] font-bold tracking-[0.06em] text-emerald-600">YOUR GRADE</p>
                    <p className="mt-1 text-2xl font-extrabold leading-none text-slate-800">
                      {submission.marks ?? 0}
                      <span className="ml-1 text-base font-normal text-slate-500">/ {submission.maxMarks ?? 35}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
      </div>
    </AppShell>
  );
}
