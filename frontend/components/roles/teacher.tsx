"use client";

import { useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, Pill, Th, Td, Metric } from '../ui';
import { ASSIGNMENTS, SUBMISSIONS } from '../data';

export function TeacherDashboardPage() {
  const teacherAssignments = ASSIGNMENTS.filter((assignment) => assignment.teacher === 'Rafiul Islam');
  const pendingReviews = SUBMISSIONS.filter((submission) => submission.status === 'Submitted' || submission.status === 'Late').length;

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Dashboard">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Metric label="My assignments" value={teacherAssignments.length.toString()} sub="Open and active" />
        <Metric label="Pending reviews" value={pendingReviews.toString()} sub="Submissions waiting" />
        <Metric label="Late submissions" value={SUBMISSIONS.filter((submission) => submission.status === 'Late').length.toString()} sub="Need attention" />
      </div>
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Upcoming assignments</p>
        <div className="grid gap-3">
          {teacherAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{assignment.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{assignment.cls} · {assignment.subject}</p>
                </div>
                <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                  {assignment.status}
                </Pill>
              </div>
              <div className="mt-3 text-sm text-slate-500 flex items-center justify-between">
                <span className="font-mono">Due {assignment.deadline}</span>
                <span>{assignment.submissions}/{assignment.total} submitted</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

export function TeacherAssignmentsPage() {
  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My assignments">
      <PageHeader eyebrow="Teacher" title="My assignments" action={<Button>Add assignment</Button>} />
      <div className="space-y-4">
        {ASSIGNMENTS.filter((assignment) => assignment.teacher === 'Rafiul Islam').map((assignment) => (
          <Card key={assignment.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-slate-900">{assignment.title}</p>
              <p className="text-sm text-slate-500">{assignment.subject} · {assignment.cls}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">Due {assignment.deadline}</p>
            </div>
            <div className="flex items-center gap-2">
              <Pill className={assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{assignment.status}</Pill>
              <Button variant="secondary">Submissions</Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function TeacherSubmissionsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Submissions">
      <PageHeader eyebrow="Teacher" title="Submissions" />
      <div className="space-y-4">
        {SUBMISSIONS.map((submission) => (
          <Card key={submission.id}>
            <button className="w-full text-left" onClick={() => setExpanded(expanded === submission.id ? null : submission.id)}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{submission.student}</p>
                  <p className="text-sm text-slate-500">{submission.isLate ? 'Late submission' : 'On time'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill className={submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : submission.status === 'Late' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}>
                    {submission.status}
                  </Pill>
                  <span className="text-xs text-slate-400">{submission.submittedAt}</span>
                </div>
              </div>
            </button>
            {expanded === submission.id && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
                <p className="mb-3">Submission content review and grading details appear here.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Marks</label>
                    <input type="number" max={20} placeholder="0–20" className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Feedback</label>
                    <textarea rows={3} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="mt-4">
                  <Button>Save grade</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
