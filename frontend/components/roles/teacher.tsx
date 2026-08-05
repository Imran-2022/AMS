"use client";

import { useEffect, useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, Pill, StatusBadge, Metric, FileUpload } from '../ui';
import { ASSIGNMENTS, SUBMISSIONS } from '../data';
import { getTeacherDashboardStats, type TeacherDashboardStats } from '@/lib/api/dashboard';

export function TeacherDashboardPage() {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const teacherAssignments = ASSIGNMENTS.filter((assignment) => assignment.teacher === 'Rafiul Islam');
  const pendingReviews = SUBMISSIONS.filter(
    (submission) =>
      submission.status === 'Submitted' ||
      submission.status === 'Late' ||
      submission.status === 'Resubmission requested'
  ).length;

  useEffect(() => {
    getTeacherDashboardStats()
      .then(setStats)
      .catch(() => {
        // Fallback to static metrics
      });
  }, []);

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Metric
          label="Active Assignments"
          value={stats?.activeAssignmentsCount ?? teacherAssignments.length}
          sub="Published for students"
          icon="📚"
        />
        <Metric
          label="Pending Reviews"
          value={stats?.pendingGradingSubmissionsCount ?? pendingReviews}
          sub="Requires grading & feedback"
          icon="⏳"
        />
        <Metric
          label="Graded Submissions"
          value={stats?.totalGradedSubmissionsCount ?? SUBMISSIONS.filter((s) => s.status === 'Graded').length}
          sub="Completed evaluations"
          icon="✅"
        />
        <Metric
          label="Assigned Classes/Subjects"
          value={stats?.assignedSubjectsCount ?? 4}
          sub="Current academic term"
          icon="🏫"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-lg">Upcoming & Active Assignments</h3>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Live Overview</span>
          </div>
          <div className="grid gap-3">
            {teacherAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-slate-200/80 p-4 bg-white hover:border-indigo-300 transition-all duration-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{assignment.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{assignment.cls} · {assignment.subject}</p>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
                <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">Due: {assignment.deadline}</span>
                  <span className="font-medium text-slate-700">{assignment.submissions}/{assignment.total} Submissions</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 transition group flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">+</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">Create Assignment</p>
                <p className="text-xs text-slate-400">With file attachments & deadline</p>
              </div>
            </button>

            <button className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-200 transition group flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">✓</span>
              <div>
                <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600">Review Pending Submissions</p>
                <p className="text-xs text-slate-400">{pendingReviews} waiting for marks</p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export function TeacherAssignmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My Assignments">
      <PageHeader
        eyebrow="Teacher Portal"
        title="My Assignments"
        action={<Button onClick={() => setShowModal(true)}>+ Create Assignment</Button>}
      />

      <div className="space-y-4">
        {ASSIGNMENTS.filter((assignment) => assignment.teacher === 'Rafiul Islam').map((assignment) => (
          <Card key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-900 text-base">{assignment.title}</p>
                <StatusBadge status={assignment.status} />
              </div>
              <p className="text-sm text-slate-500 mt-1">{assignment.subject} · {assignment.cls}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">Due Deadline: {assignment.deadline}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary">View Submissions</Button>
              {(assignment.status as string) === 'Draft' && (
                <Button variant="primary">Publish</Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create New Assignment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Title</label>
                <input type="text" placeholder="Assignment Title" className="mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <textarea rows={3} placeholder="Detailed instructions..." className="mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Assignment File Attachment</label>
                <FileUpload onFileUploaded={(url, name) => { setAttachmentUrl(url); setAttachmentName(name); }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Deadline</label>
                  <input type="datetime-local" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Max Marks</label>
                  <input type="number" defaultValue={100} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => setShowModal(false)}>Save Assignment</Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export function TeacherSubmissionsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Submissions">
      <PageHeader eyebrow="Teacher Portal" title="Submissions Review & Grading" />
      <div className="space-y-4">
        {SUBMISSIONS.map((submission) => (
          <Card key={submission.id}>
            <button className="w-full text-left" onClick={() => setExpanded(expanded === submission.id ? null : submission.id)}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 text-base">{submission.student}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{submission.isLate ? '⚠️ Late Submission' : '✓ On Time'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={submission.status} />
                  <span className="text-xs font-mono text-slate-400">{submission.submittedAt}</span>
                </div>
              </div>
            </button>
            {expanded === submission.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Work Content</p>
                  <p className="text-sm text-slate-800">Sample submitted solution text content provided by student.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Marks Awarded</label>
                    <input type="number" max={100} placeholder="0–100" className="mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Feedback & Comments</label>
                    <textarea rows={2} placeholder="Write feedback for student..." className="mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant="primary">Save & Submit Grade</Button>
                  <Button variant="secondary">Request Resubmission</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
