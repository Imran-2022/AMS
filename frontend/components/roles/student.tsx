"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, StatusBadge, Metric, FileUpload } from '../ui';
import { STUDENT_ASSIGNMENTS, STUDENT_GRADES, STUDENT_SUBMISSIONS } from '../data';
import { getStudentDashboardStats, type StudentDashboardStats } from '@/lib/api/dashboard';

type StudentAssignment = {
  id: number;
  title: string;
  subject: string;
  deadline: string;
  maxMarks: number;
  status: string;
};

export function StudentDashboardPage() {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);

  useEffect(() => {
    getStudentDashboardStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  const pendingCount = STUDENT_ASSIGNMENTS.filter((item) => item.status === 'Not submitted').length;
  const submittedCount = STUDENT_ASSIGNMENTS.filter((item) => item.status !== 'Not submitted').length;
  const gradedCount = STUDENT_GRADES.length;
  const averageGrade = gradedCount ? Math.round((STUDENT_GRADES.reduce((sum, grade) => sum + (grade.marks / grade.maxMarks) * 100, 0) / gradedCount)) : 0;
  const completedCount = STUDENT_ASSIGNMENTS.filter((item) => item.status !== 'Not submitted').length;
  const totalCount = 8;
  const progress = Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));

  return (
    <AppShell role="Student" breadcrumb="Student / Dashboard">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-600 mb-1">GOOD EVENING, AYESHA</p>
            <h1 className="text-2xl font-extrabold text-slate-800">You have {pendingCount} assignments due this week.</h1>
            <p className="text-sm text-slate-400 mt-1">Class 9 - A · Mathematics & Physics</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">View assignments</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">DUE THIS WEEK</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">Not yet submitted</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">SUBMITTED</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{submittedCount}</p>
            <p className="text-xs text-slate-400 mt-1">This term</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">AVERAGE GRADE</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{averageGrade}%</p>
            <p className="text-xs text-slate-400 mt-1">Across graded work</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">MISSING</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">0</p>
            <p className="text-xs text-slate-400 mt-1">Past deadline, ungraded</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-bold text-slate-800">Upcoming deadlines</p>
              <span className="badge bg-brand-50 text-brand-600">{pendingCount} pending</span>
            </div>
            <div className="space-y-4">
              {STUDENT_ASSIGNMENTS.map((item) => (
                <div key={item.id} className={`border border-slate-100 rounded-xl p-4 ${item.status === 'Graded' ? 'opacity-70' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.subject} · Rafiul Islam</p>
                    </div>
                    <span className={`badge ${item.status === 'Not submitted' ? 'bg-rose-50 text-rose-600' : item.status === 'Submitted' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <span className={`badge-dot ${item.status === 'Not submitted' ? 'bg-rose-500' : item.status === 'Submitted' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {item.status === 'Not submitted' ? 'Due soon' : item.status === 'Submitted' ? 'Due in 3 days' : 'Submitted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Due: {item.deadline}</span>
                    <button className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700">Submit work</button>
                  </div>
                  {item.status === 'Graded' && (
                    <p className="text-xs text-slate-400 mt-3">Submitted Jul 27, 2026 · awaiting grade</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">Recent grades & feedback</p>
              <div className="space-y-3">
                {STUDENT_GRADES.map((grade) => (
                  <div key={grade.id} className="border border-slate-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{grade.title}</p>
                      <span className="text-sm font-bold text-emerald-600">{grade.marks} / {grade.maxMarks}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{grade.feedback}</p>
                  </div>
                ))}
              </div>
              <button className="w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-700 mt-4">View all grades →</button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">Term progress</p>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-20 h-20">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="3.5"
                      strokeDasharray={`${progress}, 100`}
                      strokeLinecap="round"
                    />
                    <text x="18" y="20.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1E293B">{progress}%</text>
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">{completedCount}</span> of {totalCount} assignments completed</p>
                  <p className="text-xs text-slate-400 mt-1">2 due this week — don't fall behind</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function StudentAssignmentsPage() {
  const [currentTab, setCurrentTab] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'missing'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'submit' | 'view' | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(STUDENT_ASSIGNMENTS[0] ?? null);
  const [comment, setComment] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const now = useMemo(() => new Date(), []);

  const parseDeadline = (deadline: string) => new Date(deadline.replace(' ', 'T'));
  const isPastDue = (deadline: string) => parseDeadline(deadline) < now;
  const isDueThisWeek = (deadline: string) => {
    const diff = Math.ceil((parseDeadline(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  };

  const tabCounts = useMemo(() => {
    return {
      all: STUDENT_ASSIGNMENTS.length,
      pending: STUDENT_ASSIGNMENTS.filter((item) => item.status === 'Not submitted').length,
      submitted: STUDENT_ASSIGNMENTS.filter((item) => item.status === 'Submitted').length,
      graded: STUDENT_ASSIGNMENTS.filter((item) => item.status === 'Graded').length,
      missing: STUDENT_ASSIGNMENTS.filter((item) => item.status === 'Not submitted' && isPastDue(item.deadline)).length,
    };
  }, [now]);

  const subjectOptions = useMemo<string[]>(() => Array.from(new Set(STUDENT_ASSIGNMENTS.map((item) => item.subject))), []);

  const filteredAssignments = useMemo<StudentAssignment[]>(() => {
    return STUDENT_ASSIGNMENTS.filter((item) => {
      const matchesTab =
        currentTab === 'all' ||
        (currentTab === 'pending' && item.status === 'Not submitted' && !isPastDue(item.deadline)) ||
        (currentTab === 'submitted' && item.status === 'Submitted') ||
        (currentTab === 'graded' && item.status === 'Graded') ||
        (currentTab === 'missing' && item.status === 'Not submitted' && isPastDue(item.deadline));
      const matchesSubject = !subjectFilter || item.subject === subjectFilter;
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSubject && matchesSearch;
    });
  }, [currentTab, subjectFilter, searchTerm, now]);

  const openSubmit = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setModalType('submit');
  };

  const openView = (assignment: StudentAssignment) => {
    setSelectedAssignment(assignment);
    setModalType('view');
  };

  const closeModal = () => {
    setModalType(null);
    setComment('');
    setUploadedFileName('');
  };

  const submitLabel = selectedAssignment?.status === 'Not submitted' && isPastDue(selectedAssignment.deadline) ? 'Submit late' : 'Submit work';

  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">My Assignments</h1>
          <p className="text-sm text-slate-400 mt-1">View and submit your work</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">TOTAL</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{tabCounts.all}</p>
            <p className="text-xs text-slate-400 mt-1">Across all subjects</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">DUE THIS WEEK</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{STUDENT_ASSIGNMENTS.filter((item) => item.status === 'Not submitted' && isDueThisWeek(item.deadline)).length}</p>
            <p className="text-xs text-slate-400 mt-1">Not yet submitted</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">AWAITING GRADE</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12a10 10 0 1 1-4-8"/><path d="M22 4 12 14.01l-3-3"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{tabCounts.submitted}</p>
            <p className="text-xs text-slate-400 mt-1">Submitted, not graded yet</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">MISSING</p>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{tabCounts.missing}</p>
            <p className="text-xs text-slate-400 mt-1">Past deadline, no submission</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'submitted', 'graded', 'missing'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setCurrentTab(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${currentTab === status ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {status === 'all' ? 'All' : status === 'pending' ? 'To do' : status === 'submitted' ? 'Submitted' : status === 'graded' ? 'Graded' : 'Missing'}
                <span className="opacity-70 font-normal"> {tabCounts[status]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <div className="relative max-w-xs w-full sm:w-auto">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assignments…"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAssignments.length ? (
            filteredAssignments.map((assignment) => {
              const isLate = assignment.status === 'Not submitted' && isPastDue(assignment.deadline);
              const statusTone = assignment.status === 'Not submitted' ? (isLate ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600') : assignment.status === 'Submitted' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600';
              const dotTone = assignment.status === 'Not submitted' ? (isLate ? 'bg-rose-500' : 'bg-amber-500') : assignment.status === 'Submitted' ? 'bg-sky-500' : 'bg-emerald-500';
              const badgeLabel = assignment.status === 'Not submitted' ? (isLate ? 'Missing' : 'Due in 3 days') : assignment.status === 'Submitted' ? 'Submitted' : 'Graded';

              return (
                <div
                  key={assignment.id}
                  className={`bg-white rounded-2xl border p-5 ${assignment.status === 'Not submitted' && isLate ? 'border-rose-200' : 'border-slate-200'} ${assignment.status === 'Not submitted' && isLate ? 'border-dashed' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-slate-800">{assignment.title}</p>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${assignment.subject === 'Mathematics' ? 'bg-brand-50 text-brand-700' : assignment.subject === 'Physics' ? 'bg-sky-50 text-sky-700' : assignment.subject === 'Biology' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>
                          {assignment.subject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{assignment.subject === 'Mathematics' ? 'Rafiul Islam' : assignment.subject === 'Physics' ? 'Rafiul Islam' : 'Dr. Nasrin Chowdhury'}</p>
                    </div>
                    <span className={`badge ${statusTone}`}>
                      <span className={`badge-dot ${dotTone}`} />{badgeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">{assignment.status === 'Not submitted' ? (isLate ? 'Deadline passed — this assignment is overdue.' : 'Complete the task and upload your file before the deadline.') : assignment.status === 'Submitted' ? 'Submitted on time · waiting for your teacher to grade it.' : 'Graded by your teacher. Review the feedback below.'}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{assignment.status === 'Not submitted' ? `Due: ${assignment.deadline}` : assignment.status === 'Submitted' ? `Submitted: ${new Date(assignment.deadline.replace(' ', 'T')).toLocaleString('en-US', {month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit'})}` : `Graded: ${assignment.deadline}`}</span>
                    <button
                      type="button"
                      onClick={() => (assignment.status === 'Graded' ? openView(assignment) : openSubmit(assignment))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold ${assignment.status === 'Graded' ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : isLate ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                    >
                      {assignment.status === 'Graded' ? 'View feedback' : submitLabel}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-400 flex items-center justify-center mb-4">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
              <p className="text-base font-bold text-slate-700">Nothing here</p>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">No assignments match this filter right now.</p>
            </div>
          )}
        </div>

        {modalType && selectedAssignment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{modalType === 'submit' ? (isPastDue(selectedAssignment.deadline) ? 'Submit late work' : 'Submit work') : selectedAssignment.title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{selectedAssignment.subject} · {selectedAssignment.subject === 'Mathematics' ? 'Rafiul Islam' : selectedAssignment.subject === 'Physics' ? 'Rafiul Islam' : 'Dr. Nasrin Chowdhury'}</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto px-7 py-6 space-y-5">
                {modalType === 'submit' ? (
                  <>
                    {isPastDue(selectedAssignment.deadline) ? (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2.5 text-rose-600">
                        <svg className="w-4.5 h-4.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <p className="text-xs">The deadline has passed — this will be submitted as <span className="font-semibold">late</span>. Your teacher decides whether late work is accepted.</p>
                      </div>
                    ) : null}
                    <div className="border border-slate-100 rounded-xl px-4 py-3 bg-slate-50">
                      <p className="text-xs text-slate-500">Due: {selectedAssignment.deadline}</p>
                      <p className="text-xs text-slate-500 mt-1">Max marks: {selectedAssignment.maxMarks}</p>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 mb-2 block">Upload your work <span className="text-rose-500">*</span></label>
                      <button type="button" className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-brand-300 hover:text-brand-500">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span className="text-xs font-semibold">Click to upload a file, or drag and drop</span>
                        <span className="text-[11px] text-slate-400">PDF, DOCX, or image — up to 20MB</span>
                        {uploadedFileName ? <span className="text-[11px] text-slate-500 mt-2">Selected: {uploadedFileName}</span> : null}
                      </button>
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 mb-2 block">Comment for your teacher <span className="text-slate-400 font-normal">(optional)</span></label>
                      <textarea
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Anything you want your teacher to know about this submission…"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-brand-500 shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">my_submission.pdf</p>
                        <p className="text-xs text-slate-400">Submitted {selectedAssignment.deadline}</p>
                      </div>
                    </div>
                    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                      <p className="text-[13px] font-semibold text-slate-700 mb-2">Teacher's feedback</p>
                      <p className="text-sm text-slate-600">This work is under review. Your teacher will add feedback soon.</p>
                    </div>
                    <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sky-700">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      <p className="text-xs">Your teacher hasn't graded this yet. You'll be notified when marks are posted.</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl shrink-0">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">{modalType === 'submit' ? 'Submit' : 'Close'}</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

export function StudentSubmissionsPage() {
  const [currentTab, setCurrentTab] = useState<'all' | 'graded' | 'pending'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<typeof STUDENT_SUBMISSIONS[number] | null>(STUDENT_SUBMISSIONS[0] ?? null);
  const [modalOpen, setModalOpen] = useState(false);

  const statusCounts = useMemo(() => ({
    all: STUDENT_SUBMISSIONS.length,
    graded: STUDENT_SUBMISSIONS.filter((item) => item.status === 'Graded').length,
    pending: STUDENT_SUBMISSIONS.filter((item) => item.status === 'Pending').length,
  }), []);

  const averageGrade = useMemo(() => {
    const graded = STUDENT_SUBMISSIONS.filter((item) => item.status === 'Graded');
    if (!graded.length) return 0;
    return Math.round((graded.reduce((sum, item) => sum + (item.marks ?? 0) / item.max * 100, 0) / graded.length));
  }, []);

  const subjectStats = useMemo(() => {
    return [
      { subject: 'Mathematics', ratio: 95, graded: 2, color: 'bg-brand-500' },
      { subject: 'Physics', ratio: 80, graded: 1, color: 'bg-sky-500' },
      { subject: 'Biology', ratio: 86, graded: 2, color: 'bg-emerald-500' },
      { subject: 'English', ratio: 90, graded: 1, color: 'bg-violet-500' },
    ];
  }, []);

  const filteredSubmissions = useMemo(() => {
    return STUDENT_SUBMISSIONS.filter((item) => {
      const matchesTab = currentTab === 'all' || (currentTab === 'graded' && item.status === 'Graded') || (currentTab === 'pending' && item.status !== 'Graded');
      const matchesSubject = !subjectFilter || item.subject === subjectFilter;
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSubject && matchesSearch;
    });
  }, [currentTab, subjectFilter, searchTerm]);

  const subjectOptions = useMemo(() => Array.from(new Set(STUDENT_SUBMISSIONS.map((item) => item.subject))), []);

  const openView = (submission: typeof STUDENT_SUBMISSIONS[number]) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <AppShell role="Student" breadcrumb="Student / Submissions">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">My Submissions</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">TOTAL SUBMISSIONS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12a10 10 0 1 1-4-8"/><path d="M22 4 12 14.01l-3-3"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{statusCounts.all}</p>
            <p className="text-xs text-slate-400 mt-1">This term</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">GRADED</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{statusCounts.graded}</p>
            <p className="text-xs text-slate-400 mt-1">Marks received</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">AWAITING GRADE</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{statusCounts.pending}</p>
            <p className="text-xs text-slate-400 mt-1">Submitted, not graded yet</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">OVERALL AVERAGE</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{averageGrade}%</p>
            <p className="text-xs text-slate-400 mt-1">Across all graded work</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-3">Grades by subject</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {subjectStats.map((subject) => (
              <div key={subject.subject} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-bold ${subject.color.replace('bg-', 'text-')}`}>{subject.subject}</p>
                  <span className="text-lg font-extrabold text-slate-800">{subject.ratio}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${subject.color} rounded-full`} style={{ width: `${subject.ratio}%` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{subject.graded} of {subject.graded} graded</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'graded', 'pending'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setCurrentTab(status)}
                className={`tab px-4 py-2 rounded-xl text-sm font-semibold transition ${currentTab === status ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {status === 'all' ? 'All' : status === 'graded' ? 'Graded' : 'Awaiting grade'}
                <span className="opacity-70 font-normal"> {statusCounts[status]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white"
            >
              <option value="">All subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <div className="relative max-w-xs w-full sm:w-auto">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search submissions…"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">ASSIGNMENT</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">SUBJECT</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">SUBMITTED</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">STATUS</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">MARKS</th>
                <th className="w-24 px-5 py-3.5 text-right text-[11px] font-bold tracking-widest text-slate-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{submission.title}</td>
                  <td className="px-2 py-3.5 text-slate-500">{submission.subject}</td>
                  <td className="px-2 py-3.5 text-slate-500">{submission.submittedAt}</td>
                  <td className="px-2 py-3.5">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${submission.status === 'Graded' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                      {submission.status === 'Graded' ? 'Graded' : 'Awaiting grade'}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 font-semibold text-slate-700">{submission.status === 'Graded' ? `${submission.marks} / ${submission.max}` : '— / ' + submission.max}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openView(submission)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-600">1–{filteredSubmissions.length}</span> of <span className="font-semibold text-slate-600">{statusCounts.all}</span> submissions</p>
          </div>
        </div>

        {modalOpen && selectedSubmission ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{selectedSubmission.title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{selectedSubmission.subject} · {selectedSubmission.teacher}</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto px-7 py-6 space-y-5">
                {selectedSubmission.status === 'Graded' ? (
                  <>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold tracking-widest text-emerald-600">YOUR GRADE</p>
                        <p className="text-2xl font-extrabold text-slate-800 mt-1">{selectedSubmission.marks} <span className="text-slate-400 font-normal text-base">/ {selectedSubmission.max}</span></p>
                      </div>
                      <svg className="w-9 h-9 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 mb-2">Your submitted file</p>
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-brand-500 shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">my_submission.pdf</p>
                          <p className="text-xs text-slate-400">Submitted {selectedSubmission.submittedAt}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 mb-2">Teacher's feedback</p>
                      <p className="text-sm text-slate-600 border border-slate-100 rounded-xl p-4 bg-slate-50">{selectedSubmission.feedback}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 mb-2">Your submitted file</p>
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-brand-500 shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">my_submission.pdf</p>
                          <p className="text-xs text-slate-400">Submitted {selectedSubmission.submittedAt}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sky-700">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      <p className="text-xs">Your teacher hasn't graded this yet. You'll be notified when marks are posted.</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-end px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl shrink-0">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Close</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
