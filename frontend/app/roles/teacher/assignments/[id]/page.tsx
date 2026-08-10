"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAssignment, downloadAttachmentToBrowser, type AssignmentDto } from '@/lib/api';

export default function TeacherAssignmentDetailPage() {
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

    loadAssignment();

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
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-3xl font-extrabold text-slate-800">{assignmentTitle}</h1>
                <span className="badge bg-emerald-50 text-emerald-600"><span className="badge-dot bg-emerald-500" />{assignment?.status ?? 'Draft'}</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-500">
              Loading assignment details...
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="eyebrow mb-3">DESCRIPTION</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{assignmentDescription}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <p className="eyebrow">ATTACHMENTS</p>
                  <p className="text-xs text-slate-400 mt-0.5 mb-4">Reference files students can download.</p>
                  <div className="space-y-2.5">
                    {(assignment?.attachments ?? []).length > 0 ? (
                      (assignment?.attachments ?? []).map((attachment) => (
                        <button key={attachment.id} type="button" onClick={() => void downloadAttachmentToBrowser(attachment.downloadUrl, attachment.originalFileName)} className="flex w-full items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-700 truncate">{attachment.originalFileName}</p>
                            <p className="text-[11px] text-slate-400">{attachment.contentType} · {Math.max(1, Math.round(attachment.sizeBytes / 1024))} KB</p>
                          </div>
                          <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">No attachments available.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="eyebrow">PROGRESS</p>
                    <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View submissions →</button>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold text-slate-700">{assignment?.submittedCount ?? 0} submitted</span>
                    <span className="text-slate-400">of {assignment?.totalStudents ?? 0} students</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill bg-slate-300" style={{ width: `${submissionPercent}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {assignment?.submittedCount ? `${assignment.submittedCount} submission${assignment.submittedCount === 1 ? '' : 's'} current` : 'No submissions yet — nothing to grade until a student turns in work.'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="eyebrow mb-3">CLASS</p>
                  <p className="text-lg font-extrabold text-slate-800">{className}{classSection ? ` — ${classSection}` : ''}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{subjectName}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="eyebrow mb-3">DEADLINE</p>
                  <p className="text-base font-bold text-slate-800">{deadlineText}</p>
                  <span className="badge bg-amber-50 text-amber-600 mt-2"><span className="badge-dot bg-amber-500" />Due in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="eyebrow mb-3">MAX MARKS</p>
                  <p className="text-2xl font-extrabold text-slate-800">{maxMarks}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="eyebrow mb-3">SUBMISSION OPTIONS</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Allow late submission</span>
                      <span className="badge bg-slate-100 text-slate-500">{assignment?.allowLateSubmission ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Allow resubmission</span>
                      <span className="badge bg-slate-100 text-slate-500">{assignment?.allowResubmission ? 'Yes' : 'No'}</span>
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
