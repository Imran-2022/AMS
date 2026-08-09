"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Modal, Button, Card, PageHeader, StatusBadge } from '@/components/ui';
import { getAssignment } from '@/lib/api';
import type { AssignmentDto } from '@/lib/api';

type PreviewAttachment = {
  id: string;
  name: string;
  url: string;
  contentType: string;
};

export default function TeacherAssignmentDetailPage() {
  const pathname = usePathname();
  const assignmentId = pathname?.split('/').filter(Boolean).pop();
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAttachment, setPreviewAttachment] = useState<PreviewAttachment | null>(null);

  useEffect(() => {
    if (!assignmentId) {
      setLoadError('Assignment ID is missing.');
      setLoading(false);
      return;
    }

    let mounted = true;
    const loadAssignment = async () => {
      setLoadError(null);
      setLoading(true);
      try {
        const result = await getAssignment(assignmentId);
        if (mounted) setAssignment(result);
      } catch (error) {
        console.error('Assignment load failed', error);
        if (mounted) setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAssignment();
    return () => {
      mounted = false;
    };
  }, [assignmentId]);

  const openPreview = (attachmentId: string) => {
    const current = assignment?.attachments?.find((item) => item.id === attachmentId);
    if (!current) return;
    setPreviewAttachment({
      id: current.id,
      name: current.originalFileName,
      url: current.downloadUrl,
      contentType: current.contentType,
    });
  };

  const closePreview = () => setPreviewAttachment(null);

  const renderPreviewContent = () => {
    if (!previewAttachment) return null;

    const { contentType, url, name } = previewAttachment;
    if (contentType.startsWith('image/')) {
      return <img src={url} alt={name} className="h-[65vh] w-full rounded-3xl object-contain" />;
    }

    if (contentType === 'application/pdf') {
      return <iframe src={url} title={name} className="h-[70vh] w-full rounded-3xl border border-slate-200" />;
    }

    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-slate-500">Preview is not available for this file type.</p>
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          Open {name}
        </a>
      </div>
    );
  };

  const renderAttachments = () => {
    const items = assignment?.attachments?.length ? assignment.attachments : [];
    if (!items.length && assignment?.attachmentName && assignment.attachmentUrl) {
      return [
        {
          id: 'legacy',
          originalFileName: assignment.attachmentName,
          downloadUrl: assignment.attachmentUrl,
          contentType: 'application/octet-stream',
        },
      ];
    }

    return items;
  };

  const attachmentItems = renderAttachments();

  const completionPercent = assignment?.totalStudents
    ? Math.round(((assignment.submittedCount ?? 0) / assignment.totalStudents) * 100)
    : 0;

  return (
    <AppShell role="Teacher" breadcrumb={`Teacher / Assignment / ${assignment?.title ?? 'Preview'}`}>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Assignment Details"
          title={assignment?.title ?? 'Assignment Preview'}
          action={assignment ? <StatusBadge status={assignment.status} /> : null}
        />

        {loading ? (
          <Card>
            <p className="text-sm text-slate-600">Loading assignment details…</p>
          </Card>
        ) : !assignment ? (
          <Card>
            <p className="text-sm text-red-600">{loadError || 'Assignment not found.'}</p>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
            <div className="space-y-6">
              <Card>
                <h2 className="text-sm font-semibold uppercase text-slate-400">Description</h2>
                <p className="mt-4 text-sm leading-7 text-slate-700">{assignment.description || 'No description provided.'}</p>
              </Card>

              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold uppercase text-slate-400">Attachments</h2>
                    <p className="text-xs text-slate-500">Tap to open in review mode.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {attachmentItems.length ? (
                    attachmentItems.map((attachment) => (
                      <button
                        key={attachment.id}
                        type="button"
                        onClick={() => openPreview(attachment.id)}
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                      >
                        {attachment.originalFileName}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No attachments uploaded for this assignment.</p>
                  )}
                </div>
              </Card>

              <Card>
                <h2 className="text-sm font-semibold uppercase text-slate-400">Progress</h2>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>{assignment.submittedCount ?? 0} submitted</span>
                    <span>{assignment.totalStudents ?? 0} students</span>
                  </div>
                  <div className="overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${completionPercent}%` }} />
                  </div>
                  <p className="text-sm text-slate-500">{completionPercent}% complete</p>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <h3 className="text-sm font-semibold uppercase text-slate-400">Class</h3>
                <p className="mt-3 text-lg font-semibold text-slate-900">{assignment.classCourseName} — {assignment.classCourseSection}</p>
                <p className="mt-2 text-sm text-slate-500">{assignment.subjectName}</p>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold uppercase text-slate-400">Deadline</h3>
                <p className="mt-3 text-lg font-semibold text-slate-900">{new Date(assignment.deadline).toLocaleString()}</p>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold uppercase text-slate-400">Max marks</h3>
                <p className="mt-3 text-lg font-semibold text-slate-900">{assignment.maxMarks}</p>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold uppercase text-slate-400">Options</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>Allow late submission: <span className="font-semibold text-slate-900">{assignment.allowLateSubmission ? 'Yes' : 'No'}</span></p>
                  <p>Allow resubmission: <span className="font-semibold text-slate-900">{assignment.allowResubmission ? 'Yes' : 'No'}</span></p>
                </div>
              </Card>
            </div>
          </div>
        )}

        <Modal
          open={Boolean(previewAttachment)}
          onClose={closePreview}
          title={previewAttachment?.name}
          description="Attachment review"
          className="max-w-5xl"
        >
          {renderPreviewContent()}
        </Modal>
      </div>
    </AppShell>
  );
}
