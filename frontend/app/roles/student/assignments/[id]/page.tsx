"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAssignment, getMySubmissions, createSubmission, updateSubmission, uploadAttachment, downloadAttachmentToBrowser, getSubmission, deleteAttachment, renameAttachment, type AssignmentDto, type SubmissionDto } from '@/lib/api';
import { Button } from '@/components/ui';
import { FileUpload } from '@/components/ui';
import { AppShell } from '@/shared/layout';

export default function StudentAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const assignmentId = typeof rawId === 'string' ? rawId : '';

  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [originalComment, setOriginalComment] = useState('');
  const [originalAttachmentIds, setOriginalAttachmentIds] = useState<string[]>([]);

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
        const [data, submissions] = await Promise.all([getAssignment(assignmentId), getMySubmissions()]);
        if (!cancelled) {
          setAssignment(data);
          const currentSubmission = submissions.find((item) => item.assignmentId === data.id) ?? null;
          setSubmission(currentSubmission);
          const initial = currentSubmission?.contentText ?? '';
          setComment(initial);
          setOriginalComment(initial);
          setOriginalAttachmentIds((currentSubmission?.attachments ?? []).map((a) => a.id));
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

  const assignmentTitle = assignment?.title ?? 'Assignment';
  const assignmentDescription = assignment?.description ?? 'Assignment description is not available.';
  const className = assignment?.classCourseName ?? 'Class';
  const classSection = assignment?.classCourseSection ?? '';
  const subjectName = assignment?.subjectName ?? '';
  const maxMarks = assignment?.maxMarks ?? 0;
  const statusLabel = !submission
    ? 'Not submitted'
    : submission.status === 'Graded'
      ? 'Graded'
      : submission.status === 'ResubmissionRequested'
        ? 'Resubmission requested'
        : submission.status === 'Resubmitted'
          ? 'Resubmitted'
          : 'Submitted';
  const canResubmit = Boolean(
    submission &&
    submission.status !== 'Graded' &&
    (assignment?.allowResubmission || submission.status === 'ResubmissionRequested')
  );
  const canSubmit = Boolean(assignment) && (!submission || canResubmit);
  const currentAttachmentIds = submission?.attachments?.map((a) => a.id) ?? [];
  const attachmentsChanged = JSON.stringify(currentAttachmentIds.sort()) !== JSON.stringify(originalAttachmentIds.sort());
  const hasChanges = comment.trim() !== originalComment.trim() || selectedFiles.length > 0 || attachmentsChanged;
  const canSubmitForm = canSubmit && hasChanges && (comment.trim().length > 0 || selectedFiles.length > 0 || attachmentsChanged);

  async function handleSubmit() {
    if (!assignment || !canSubmit) return;
    if (!hasChanges) return;
    if (!comment.trim() && selectedFiles.length === 0 && !attachmentsChanged) {
      setError('Description is required.');
      return;
    }
    try {
      setSubmitting(true);
      const nextSubmission = submission
        ? await updateSubmission(submission.id, { contentText: comment })
        : await createSubmission({ assignmentId: assignment.id, contentText: comment });


      if (selectedFiles.length > 0) {
        await Promise.all(selectedFiles.map((file) => uploadAttachment('Submission', nextSubmission.id, file)));
      }

      setSubmission(nextSubmission);
      setSubmitOpen(false);
      setSelectedFiles([]);
      setOriginalComment(comment);
      setOriginalAttachmentIds((nextSubmission.attachments ?? []).map((a) => a.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveExistingAttachment(id: string) {
    if (!submission) return;
    try {
      await deleteAttachment(id);
      const refreshed = await getSubmission(submission.id);
      setSubmission(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete attachment.');
    }
  }

  async function handleRenameExistingAttachment(id: string, newName: string) {
    if (!submission) return;
    try {
      await renameAttachment(id, newName);
      const refreshed = await getSubmission(submission.id);
      setSubmission(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to rename attachment.');
    }
  }

  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <div className="space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold text-slate-800">{assignmentTitle}</h1>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusLabel === 'Graded' ? 'bg-emerald-50 text-emerald-600' : statusLabel === 'Not submitted' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusLabel === 'Graded' ? 'bg-emerald-500' : statusLabel === 'Not submitted' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                  {statusLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => router.back()} className="!h-11 !px-4 !py-2 !text-sm">
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </Button>
              {submission?.id && submission.status !== 'Graded' ? (
                <Link
                  href={`/roles/student/submissions/${submission.id}`}
                  className="inline-flex h-11 items-center justify-center rounded px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 bg-white shadow-sm transition-all duration-200 hover:bg-slate-50"
                >
                  View submission
                </Link>
              ) : null}
              {submission?.status === 'Graded' ? (
                <Link
                  href={`/roles/student/submissions/${submission.id}`}
                  className="inline-flex h-11 items-center justify-center rounded px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 bg-white shadow-sm transition-all duration-200 hover:bg-slate-50"
                >
                  View feedback
                </Link>
              ) : canSubmit ? (
                <Button type="button" onClick={() => setSubmitOpen(true)} className="!h-11 !px-4 !py-2 !text-sm">
                  {submission ? 'Resubmit work' : 'Submit work'}
                </Button>
              ) : null}
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
                        <Button
                          key={attachment.id}
                          type="button"
                          variant="ghost"
                          onClick={() => void downloadAttachmentToBrowser(attachment.downloadUrl, attachment.originalFileName)}
                          className="flex w-full cursor-pointer items-center gap-3 border border-slate-100 p-3 text-left transition hover:bg-slate-50"
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
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No attachments available.</p>
                    )}
                  </div>
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

              </div>
            </div>
          )}

          {submitOpen && assignment ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
              <div className="w-full max-w-xl overflow-hidden rounded bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">{submission ? 'Resubmit work' : 'Submit work'}</h2>
                    <p className="mt-1 text-sm text-slate-400">{assignment.title}</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => setSubmitOpen(false)} className="h-9 w-9 px-0 text-slate-400">×</Button>
                </div>
                <div className="space-y-5 px-6 py-6">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">
                      Attachments <span className="font-normal text-slate-400">(optional)</span>
                    </label>
                    <FileUpload
                      multiple
                      selectedFiles={selectedFiles}
                      existingAttachments={(submission?.attachments ?? []).map((attachment) => ({
                        id: attachment.id,
                        originalFileName: attachment.originalFileName,
                        downloadUrl: attachment.downloadUrl,
                        sizeBytes: attachment.sizeBytes,
                      }))}
                      onFilesSelected={setSelectedFiles}
                      onRemoveExistingAttachment={(id) => void handleRemoveExistingAttachment(id)}
                      onRenameExistingAttachment={(id, name) => void handleRenameExistingAttachment(id, name)}
                      allowedTypesText="PDF, DOCX, TXT, ZIP, PNG, JPG (Max 10MB)"
                    />
                  </div>
                  <div>
                    <label htmlFor="submission-description" className="mb-2 block text-[13px] font-semibold text-slate-800">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="submission-description"
                      rows={5}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Add a note for your teacher..."
                      className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                  <Button type="button" variant="secondary" onClick={() => setSubmitOpen(false)}>Cancel</Button>
                  <Button type="button" disabled={submitting || !canSubmitForm} onClick={() => void handleSubmit()}>
                    {submitting ? (submission ? 'Re-submitting...' : 'Submitting...') : (submission ? 'Re-submit' : 'Submit')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
      </div>
    </AppShell>
  );
}
