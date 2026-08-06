"use client";

import { useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { Button, Card, PageHeader, StatusBadge } from '../../ui';
import { SUBMISSIONS } from '../../data';

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
