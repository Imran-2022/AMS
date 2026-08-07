"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, StatusBadge, Metric, FileUpload } from '../ui';
import { STUDENT_ASSIGNMENTS, STUDENT_GRADES, STUDENT_SUBMISSIONS } from '../data';
import { getStudentDashboardStats, type StudentDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getMySubmissions, createSubmission, updateSubmission, uploadAttachment, type AssignmentDto, type SubmissionDto } from '@/lib/api';

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
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null } | null>(null);
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(false);

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [apiAssignments, apiSubmissions] = await Promise.all([getAssignments(), getMySubmissions()]);
        setAssignments(apiAssignments);
        setSubmissions(apiSubmissions);
      } catch (err) {
        // ignore for now
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const mapAssignments = useMemo(() => {
    return assignments.map((a) => {
      const sub = submissions.find((s) => s.assignmentId === a.id) ?? null;
      return {
        ...a,
        studentStatus: sub ? sub.status : 'Not submitted',
        submission: sub
      } as AssignmentDto & { studentStatus: string; submission: SubmissionDto | null };
    });
  }, [assignments, submissions]);

  const isPastDue = (deadline: string) => new Date(deadline) < now;
  const isDueThisWeek = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 7;
  };

  const tabCounts = useMemo(() => {
    return {
      all: mapAssignments.length,
      pending: mapAssignments.filter((item) => item.studentStatus === 'Not submitted').length,
      submitted: mapAssignments.filter((item) => item.studentStatus === 'Submitted').length,
      graded: mapAssignments.filter((item) => item.studentStatus === 'Graded').length,
      missing: mapAssignments.filter((item) => item.studentStatus === 'Not submitted' && isPastDue(item.deadline)).length,
    };
  }, [mapAssignments, now]);

  const subjectOptions = useMemo(() => Array.from(new Set(assignments.map((a) => a.subjectName))), [assignments]);

  const filteredAssignments = useMemo(() => {
    return mapAssignments.filter((item) => {
      const matchesTab =
        currentTab === 'all' ||
        (currentTab === 'pending' && item.studentStatus === 'Not submitted' && !isPastDue(item.deadline)) ||
        (currentTab === 'submitted' && item.studentStatus === 'Submitted') ||
        (currentTab === 'graded' && item.studentStatus === 'Graded') ||
        (currentTab === 'missing' && item.studentStatus === 'Not submitted' && isPastDue(item.deadline));
      const matchesSubject = !subjectFilter || item.subjectName === subjectFilter;
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSubject && matchesSearch;
    });
  }, [mapAssignments, currentTab, subjectFilter, searchTerm, now]);

  const openSubmit = (assignment: AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null }) => {
    setSelectedAssignment(assignment);
    setModalType('submit');
    setComment('');
    setSelectedFile(null);
    setUploadedFileName('');
  };

  const openView = (assignment: AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null }) => {
    setSelectedAssignment(assignment);
    setModalType('view');
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedAssignment(null);
    setComment('');
    setUploadedFileName('');
  };

  async function submitAssignment() {
    if (!selectedAssignment) return;
    try {
      setLoading(true);
      // create submission first
      const submission = await createSubmission({ assignmentId: selectedAssignment.id, contentText: comment });
      // if file was selected, upload as attachment linked to the submission
      if (selectedFile) {
        await uploadAttachment('Submission', submission.id, selectedFile);
      }
      const mine = await getMySubmissions();
      setSubmissions(mine);
      setModalType(null);
      setSelectedAssignment(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  }

  const submitLabel = selectedAssignment ? (isPastDue(selectedAssignment.deadline) ? 'Submit late' : 'Submit work') : 'Submit';
  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">My Assignments</h1>
          <p className="text-sm text-slate-400 mt-1">View and submit your work</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'submitted', 'graded', 'missing'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setCurrentTab(status)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${currentTab === status ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {status === 'all' ? 'All' : status === 'pending' ? 'To do' : status === 'submitted' ? 'Submitted' : status === 'graded' ? 'Graded' : 'Missing'}
                <span className="opacity-70 font-normal"> {tabCounts[status]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
              <option value="">All subjects</option>
              {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assignments…"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredAssignments.length ? (
            filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-2xl border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-800">{assignment.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{assignment.teacherName ?? ''} · {assignment.subjectName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${assignment.studentStatus === 'Not submitted' ? 'bg-amber-50 text-amber-600' : assignment.studentStatus === 'Submitted' ? 'bg-sky-50 text-sky-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {assignment.studentStatus}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-3">{assignment.description ?? ''}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Due: {new Date(assignment.deadline).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => assignment.studentStatus === 'Graded' ? openView(assignment) : openSubmit(assignment)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${assignment.studentStatus === 'Graded' ? 'border border-slate-200 text-slate-600' : 'bg-brand-600 text-white'}`}>
                      {assignment.studentStatus === 'Graded' ? 'View feedback' : submitLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">No assignments match this filter.</div>
          )}
        </div>

        {modalType && selectedAssignment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{modalType === 'submit' ? (isPastDue(selectedAssignment.deadline) ? 'Submit late work' : 'Submit work') : selectedAssignment.title}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{selectedAssignment.subjectName} · {selectedAssignment.teacherName}</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="overflow-y-auto px-7 py-6 space-y-5">
                {modalType === 'submit' ? (
                  <>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700 mb-2">Upload your work</p>
                      <FileUpload onFileUploaded={(fileUrl, fileName) => { /* legacy: not used when using onFileSelected */ }} onFileSelected={(file) => { setSelectedFile(file); setUploadedFileName(file.name); }} />
                      {uploadedFileName ? <p className="text-xs text-slate-500 mt-2">Selected: {uploadedFileName}</p> : null}
                    </div>
                    <div>
                      <label className="text-[13px] font-semibold text-slate-700 mb-2 block">Comment (optional)</label>
                      <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700" />
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-slate-600">{selectedAssignment.submission?.feedback ?? 'No feedback yet.'}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold">Cancel</button>
                {modalType === 'submit' ? (
                  <button type="button" onClick={submitAssignment} className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold">Submit</button>
                ) : (
                  <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold">Close</button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
