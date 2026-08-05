"use client";

import { useEffect, useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, StatusBadge, Metric, FileUpload } from '../ui';
import { STUDENT_ASSIGNMENTS, STUDENT_GRADES, SUBMISSIONS } from '../data';
import { getStudentDashboardStats, type StudentDashboardStats } from '@/lib/api/dashboard';

export function StudentDashboardPage() {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);

  useEffect(() => {
    getStudentDashboardStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <AppShell role="Student" breadcrumb="Student / Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Metric
          label="Enrolled Classes"
          value={stats?.enrolledClassesCount ?? 2}
          sub="Current academic session"
          icon="📖"
        />
        <Metric
          label="Active Assignments"
          value={stats?.activeAssignmentsCount ?? STUDENT_ASSIGNMENTS.length}
          sub="Published by teachers"
          icon="📋"
        />
        <Metric
          label="Submitted Work"
          value={stats?.submittedCount ?? STUDENT_ASSIGNMENTS.filter((item) => item.status !== 'Not submitted').length}
          sub="Completed submissions"
          icon="📤"
        />
        <Metric
          label="Graded Reports"
          value={stats?.gradedCount ?? STUDENT_GRADES.length}
          sub="Evaluations & Feedback"
          icon="⭐"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-lg">Recent Graded Work & Feedback</h3>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">Feedback Available</span>
          </div>
          <div className="space-y-3">
            {STUDENT_GRADES.map((grade) => (
              <div key={grade.id} className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/60 hover:bg-white transition-all duration-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{grade.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{grade.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
                      {grade.marks}/{grade.maxMarks}
                    </p>
                    <p className="text-xs font-medium text-slate-400">Graded {grade.gradedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base">Upcoming Deadlines</h3>
          </div>
          <div className="space-y-3">
            {STUDENT_ASSIGNMENTS.slice(0, 3).map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.subject}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs font-mono bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded">
                    Due: {item.deadline}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export function StudentAssignmentsPage() {
  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <PageHeader eyebrow="Student Portal" title="My Class Assignments" />
      <div className="space-y-4">
        {STUDENT_ASSIGNMENTS.map((assignment) => (
          <Card key={assignment.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-900 text-base">{assignment.title}</p>
                <StatusBadge status={assignment.status} />
              </div>
              <p className="text-sm text-slate-500 mt-1">{assignment.subject}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">Due Deadline: {assignment.deadline}</p>
            </div>
            <Button variant="primary">View & Submit</Button>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

export function StudentSubmissionsPage() {
  const [selected, setSelected] = useState<number | null>(STUDENT_ASSIGNMENTS[0]?.id ?? null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [contentText, setContentText] = useState('');

  return (
    <AppShell role="Student" breadcrumb="Student / Submissions">
      <PageHeader eyebrow="Student Portal" title="Submit Solution & Track Status" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {STUDENT_ASSIGNMENTS.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => setSelected(assignment.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
                selected === assignment.id
                  ? 'border-indigo-500 bg-white shadow-md'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900 text-sm">{assignment.title}</p>
                <StatusBadge status={assignment.status} />
              </div>
              <p className="text-xs font-mono text-slate-500 mt-2">Due: {assignment.deadline}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-base font-bold text-slate-900 mb-4">Submission Form</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Solution Text / Response</label>
                <textarea
                  rows={4}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Type your answer, notes, or solution description here..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">File Attachment Upload</label>
                <FileUpload onFileUploaded={(url, name) => { setFileUrl(url); setFileName(name); }} />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary">Submit Solution</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
