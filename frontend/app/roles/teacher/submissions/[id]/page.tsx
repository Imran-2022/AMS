"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/shared/layout';
import { Button } from '@/components/ui/Button';
import { FileText, X } from 'lucide-react';
import { getSubmission, gradeSubmission, updateSubmissionStatus, downloadAttachmentToBrowser, type SubmissionDto } from '@/lib/api';

function normalizeFeedbackText(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return '';

  if (/^no attachment(?: found)?$/i.test(trimmed)) {
    return '';
  }

  return trimmed;
}

export default function TeacherSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const submissionId = typeof rawId === 'string' ? rawId : '';

  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('Submitted');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
        if (!cancelled) {
          const normalizedFeedback = normalizeFeedbackText(data.feedback);
          setSubmission(data);
          setMarks(data.marks?.toString() ?? '');
          setFeedback(normalizedFeedback);
          setStatus(data.status);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load submission.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const submittedAt = useMemo(() => submission ? new Date(submission.submittedAt) : null, [submission]);
  const submittedText = submittedAt
    ? new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(submittedAt)
    : '';

  const statusBadge = useMemo(() => {
    const label = (() => {
      switch (submission?.status) {
        case 'Graded':
          return 'Graded';
        case 'ResubmissionRequested':
          return 'Resubmission Requested';
        case 'Resubmitted':
          return 'Resubmitted';
        case 'Excused':
          return 'Excused';
        default:
          return 'Submitted · pending review';
      }
    })();

    const classes = (() => {
      switch (submission?.status) {
        case 'Graded':
          return 'bg-emerald-50 text-emerald-700';
        case 'ResubmissionRequested':
          return 'bg-rose-50 text-rose-700';
        case 'Resubmitted':
          return 'bg-amber-50 text-amber-700';
        case 'Excused':
          return 'bg-slate-100 text-slate-700';
        default:
          return 'bg-sky-50 text-sky-600';
      }
    })();

    const dotClasses = (() => {
      switch (submission?.status) {
        case 'Graded':
          return 'bg-emerald-500';
        case 'ResubmissionRequested':
          return 'bg-rose-500';
        case 'Resubmitted':
          return 'bg-amber-500';
        case 'Excused':
          return 'bg-slate-500';
        default:
          return 'bg-sky-500';
      }
    })();

    return { label, classes, dotClasses };
  }, [submission?.status]);

  const saveGrade = async () => {
    if (!submission) return;

    setSaveError(null);
    setSaving(true);

    try {
      let updated: SubmissionDto;

      if (status === 'Graded') {
        if (!marks.trim()) {
          setSaveError('Please enter marks before grading this submission.');
          return;
        }

        const numericMarks = Number(marks);
        if (Number.isNaN(numericMarks) || numericMarks < 0) {
          setSaveError('Marks must be a valid non-negative number.');
          return;
        }

        if (submission.maxMarks && numericMarks > submission.maxMarks) {
          setSaveError(`Marks cannot exceed the assignment max marks (${submission.maxMarks}).`);
          return;
        }

        updated = await gradeSubmission(submission.id, {
          marks: numericMarks,
          feedback: feedback.trim() || undefined,
        });
      } else {
        updated = await updateSubmissionStatus(submission.id, {
          status,
        });
      }

      const normalizedFeedback = normalizeFeedbackText(updated.feedback);
      setSubmission(updated);
      setMarks(updated.marks?.toString() ?? '');
      setFeedback(normalizedFeedback);
      setStatus(updated.status);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Grade Submission">
      <div className="space-y-5">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading submission...</div>
        ) : submission ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0">
                  {submission.avatarUrl ? (
                    <img
                      src={submission.avatarUrl}
                      alt={submission.studentName}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        event.currentTarget.nextElementSibling?.removeAttribute('hidden');
                      }}
                    />
                  ) : null}
                  <div hidden={Boolean(submission.avatarUrl)} className="absolute inset-0 flex items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700">
                    {submission.studentInitials}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-slate-800">{submission.studentName}</h1>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold ${statusBadge.classes}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dotClasses}`} />
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_380px] gap-4 items-start">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-bold tracking-[0.06em] text-slate-400">SUBMITTED WORK</p>
                    <p className="text-xs text-slate-400">{submittedText}</p>
                  </div>

                  {submission.attachments?.length ? (
                    <div className="space-y-2.5">
                      {submission.attachments.map((attachment) => (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => void downloadAttachmentToBrowser(attachment.downloadUrl, attachment.originalFileName)}
                          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 text-left transition hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700">{attachment.originalFileName}</p>
                            <p className="text-[11px] text-slate-400">{attachment.contentType} · {Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB</p>
                          </div>
                          <svg className="h-4 w-4 shrink-0 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3 3 0 0 1 4.24 4.24l-9.2 9.19a1 1 0 0 1-1.41-1.41l8.49-8.49" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-500">No attachment</p>
                        <p className="text-xs text-slate-400">The student submitted only a written description below.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-[11px] font-bold tracking-[0.06em] text-slate-400">SUBMISSION DESCRIPTION</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">&ldquo;{submission.contentText || 'No description provided.'}&rdquo;</p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p className="text-xs text-slate-500">This is {submission.studentName.split(' ')[0]}'s first submission for this assignment — no earlier attempts to compare against.</p>
                </div>
              </div>

              <div className="space-y-5">
                <Link
                  href={`/roles/teacher/assignments/${submission.assignmentId}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:text-brand-600"
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

                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Marks <span className="text-rose-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <input id="marksInput" value={marks} onChange={(event) => setMarks(event.target.value)} type="number" min="0" max={submission.maxMarks ?? 35} placeholder="0" className="w-28 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                      <span className="text-sm text-slate-500">out of <span className="font-bold text-slate-700">{submission.maxMarks ?? 35}</span></span>
                    </div>
                    <p className="mt-2 text-[11.5px] text-slate-400">Max marks for this assignment: {submission.maxMarks ?? 35}.</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Feedback for student</label>
                    <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={5} placeholder="Add comments on their work…" className="min-h-[160px] w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Submission status</label>
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                      <option value="Submitted">Submitted</option>
                      <option value="Graded">Graded</option>
                      <option value="ResubmissionRequested">Resubmission Requested</option>
                    </select>
                    <p className="mt-2 text-[11.5px] text-slate-400">Changing status notifies the student automatically.</p>
                  </div>

                  {saveError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{saveError}</div>
                  ) : null}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button type="button" disabled={saving} onClick={() => void saveGrade()} className="cursor-pointer rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70">
                      {saving ? 'Saving...' : 'Save & notify student'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}