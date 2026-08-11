"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/shared/layout';
import { Button } from '@/components/ui/Button';
import { getAssignment, downloadAttachmentToBrowser, type AssignmentDto } from '@/lib/api';

export default function AdminAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
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

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAssignment(assignmentId);
        if (!cancelled) setAssignment(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load assignment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  return (
    <AppShell role="Admin" breadcrumb="Admin / Assignment">
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
            <h1 className="text-3xl font-extrabold text-slate-800">{assignment?.title ?? 'Assignment details'}</h1>
          </div>
          <Button type="button" variant="secondary" onClick={() => router.back()} className="!h-11 !gap-2 !px-4 !py-2 !text-sm !whitespace-nowrap">
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading assignment details...</div>
        ) : assignment ? (
          <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Description</p>
                <p className="text-sm leading-relaxed text-slate-600">{assignment.description ?? 'Assignment description is not available.'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Attachments</p>
                <p className="mt-0.5 mb-4 text-xs text-slate-400">Reference files admins can download.</p>
                <div className="space-y-2.5">
                  {(assignment.attachments ?? []).length > 0 ? (
                    (assignment.attachments ?? []).map((attachment) => (
                      <button
                        key={attachment.id}
                        type="button"
                        onClick={() => void downloadAttachmentToBrowser(attachment.downloadUrl, attachment.originalFileName)}
                        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-700">{attachment.originalFileName}</p>
                          <p className="text-[11px] text-slate-400">{attachment.contentType} · {Math.max(1, Math.round((attachment.sizeBytes ?? 0) / 1024))} KB</p>
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
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Class</p>
                <p className="text-lg font-extrabold text-slate-800">{assignment.classCourseName}{assignment.classCourseSection ? ` — ${assignment.classCourseSection}` : ''}</p>
                <p className="mt-0.5 text-sm text-slate-500">{assignment.subjectName}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Deadline</p>
                <p className="text-base font-bold text-slate-800">{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : '—'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Max marks</p>
                <p className="text-2xl font-extrabold text-slate-800">{assignment.maxMarks}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
