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

  const activeAssignments = stats?.activeAssignmentsCount ?? teacherAssignments.length;
  const gradedSubmissions = stats?.totalGradedSubmissionsCount ?? SUBMISSIONS.filter((s) => s.status === 'Graded').length;
  const assignedSubjects = stats?.assignedSubjectsCount ?? 4;

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Dashboard">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-600 mb-1">GOOD EVENING, AVA</p>
            <h1 className="text-2xl font-extrabold text-slate-800">You have {pendingReviews} submissions waiting for grades.</h1>
            <p className="text-sm text-slate-400 mt-1">Across Class 9-A · Mathematics.</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create assignment
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">ACTIVE ASSIGNMENTS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{activeAssignments}</p>
            <p className="text-xs text-slate-400 mt-1">Published for students</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">PENDING REVIEWS</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{pendingReviews}</p>
            <p className="text-xs text-slate-400 mt-1">Requires grading & feedback</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">GRADED SUBMISSIONS</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{gradedSubmissions}</p>
            <p className="text-xs text-slate-400 mt-1">Completed evaluations</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">MY CLASSES</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{assignedSubjects}</p>
            <p className="text-xs text-slate-400 mt-1">Current academic term</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-3">My classes</p>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Class 9 - A</p>
                <p className="text-xs text-slate-400 mt-0.5">Mathematics · 32 students</p>
              </div>
              <button type="button" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View →</button>
            </div>
            <button type="button" className="rounded-2xl border-2 border-dashed border-slate-200 py-5 text-xs font-semibold text-slate-300 hover:text-slate-400">
              No other classes assigned
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-bold text-slate-800">Upcoming & active assignments</p>
              <span className="badge bg-brand-50 text-brand-600">Live overview</span>
            </div>
            <div className="space-y-4">
              {teacherAssignments.slice(0, 2).map((assignment) => (
                <div key={assignment.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{assignment.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{assignment.cls} · {assignment.subject}</p>
                    </div>
                    <span className={`badge ${assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`badge-dot ${assignment.status === 'Published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {assignment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Due: {assignment.deadline}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="progress-track flex-1"><div className="progress-fill" style={{ width: `${Math.min(100, Math.round((assignment.submissions / assignment.total) * 100))}%` }} /></div>
                    <span className="text-xs font-semibold text-slate-500 shrink-0">{assignment.submissions} / {assignment.total} submitted</span>
                  </div>
                </div>
              ))}

              <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">Geometry Basics — Draft</p>
                  <p className="text-xs text-slate-400 mt-0.5">Class 9 - A · Mathematics · not visible to students</p>
                </div>
                <span className="badge bg-slate-100 text-slate-500"><span className="badge-dot bg-slate-400"></span>Draft</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">Quick actions</p>
              <div className="space-y-2.5">
                <button type="button" className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                  <div className="w-9 h-9 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">+</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Create assignment</p>
                    <p className="text-xs text-slate-400">With file attachments & deadline</p>
                  </div>
                </button>
                <button type="button" className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">✓</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Review pending submissions</p>
                    <p className="text-xs text-slate-400">{pendingReviews} waiting for marks</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">Grading progress</p>
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 36 36" className="w-20 h-20 shrink-0">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7C3AED" strokeWidth="3.5" strokeDasharray="91, 100" strokeLinecap="round" />
                  <text x="18" y="20.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1E293B">91%</text>
                </svg>
                <div>
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">55</span> of 58 submissions graded this term</p>
                  <p className="text-xs text-slate-400 mt-1">3 left in Algebraic Expressions — Set 4</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
