"use client";

import { useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, Pill, Th, Td, Metric } from '../ui';
import { STUDENT_ASSIGNMENTS, STUDENT_GRADES, SUBMISSIONS } from '../data';

export function StudentDashboardPage() {
  return (
    <AppShell role="Student" breadcrumb="Student / Dashboard">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Metric label="Open assignments" value={STUDENT_ASSIGNMENTS.length.toString()} sub="Due soon" />
        <Metric label="Submitted" value={STUDENT_ASSIGNMENTS.filter((item) => item.status !== 'Not submitted').length.toString()} sub="This term" />
        <Metric label="Recent grades" value={STUDENT_GRADES.length.toString()} sub="Feedback ready" />
      </div>
      <Card>
        <p className="text-sm font-medium text-slate-700 mb-4">Latest graded work</p>
        <div className="space-y-3">
          {STUDENT_GRADES.map((grade) => (
            <div key={grade.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{grade.title}</p>
                  <p className="text-sm text-slate-500">{grade.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-900">{grade.marks}/{grade.maxMarks}</p>
                  <p className="text-xs text-slate-400">Graded {grade.gradedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

export function StudentAssignmentsPage() {
  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <PageHeader eyebrow="Student" title="Assignments" />
      <div className="space-y-3">
        {STUDENT_ASSIGNMENTS.map((assignment) => (
          <Card key={assignment.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">{assignment.title}</p>
              <p className="text-sm text-slate-500">{assignment.subject}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">Due {assignment.deadline}</p>
            </div>
            <Pill className={assignment.status === 'Submitted' ? 'bg-sky-50 text-sky-700' : assignment.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
              {assignment.status}
            </Pill>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function StudentSubmissionsPage() {
  const [selected, setSelected] = useState<number | null>(STUDENT_ASSIGNMENTS[0]?.id ?? null);

  return (
    <AppShell role="Student" breadcrumb="Student / Submissions">
      <PageHeader eyebrow="Student" title="Submission status" />
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-3">
          {STUDENT_ASSIGNMENTS.map((assignment) => (
            <button key={assignment.id} onClick={() => setSelected(assignment.id)} className={`w-full text-left rounded-2xl border p-4 ${selected === assignment.id ? 'border-indigo-500 bg-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
              <p className="font-medium text-slate-900">{assignment.title}</p>
              <p className="text-xs text-slate-500 mt-1">Due {assignment.deadline}</p>
              <Pill className={assignment.status === 'Submitted' ? 'bg-sky-50 text-sky-700' : assignment.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                {assignment.status}
              </Pill>
            </button>
          ))}
        </div>
        <div className="col-span-2 space-y-4">
          <Card>
            <p className="text-sm font-medium text-slate-700 mb-4">Selected submission</p>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">Review the latest submission details and update if necessary.</p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-700 mb-4">Submission timeline</p>
            <table className="w-full">
              <tbody>
                {SUBMISSIONS.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <Td>{item.student}</Td>
                    <Td className="font-mono">{item.submittedAt}</Td>
                    <Td><Pill className={item.status === 'Submitted' ? 'bg-sky-50 text-sky-700' : item.status === 'Graded' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{item.status}</Pill></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
