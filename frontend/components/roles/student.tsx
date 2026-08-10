"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../layout/AppShell';
import { Button, Card, PageHeader, StatusBadge, Metric, FileUpload } from '../ui';
import { getStudentDashboardStats, type StudentDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getMySubmissions, createSubmission, updateSubmission, uploadAttachment, listAttachments, deleteAttachment, type AssignmentDto, type SubmissionDto } from '@/lib/api';

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
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashboardStats, apiAssignments, apiSubmissions] = await Promise.all([
          getStudentDashboardStats(),
          getAssignments(),
          getMySubmissions(),
        ]);
        setStats(dashboardStats);
        setAssignments(apiAssignments);
        setSubmissions(apiSubmissions);
      } catch {
        setStats(null);
        setAssignments([]);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const assignmentRows = useMemo(() => {
    const submissionMap = new Map(submissions.map((submission) => [submission.assignmentId, submission]));
    return assignments.slice(0, 4).map((assignment) => {
      const submission = submissionMap.get(assignment.id);
      const hasSubmitted = Boolean(submission);
      const status = hasSubmitted ? (submission?.status === 'Graded' ? 'Graded' : 'Submitted') : 'Not submitted';
      return {
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subjectName,
        deadline: assignment.deadline,
        status,
      };
    });
  }, [assignments, submissions]);

  const pendingCount = assignmentRows.filter((item) => item.status === 'Not submitted').length;
  const submittedCount = assignmentRows.filter((item) => item.status !== 'Not submitted').length;
  const gradedCount = submissions.filter((item) => item.status === 'Graded').length;
  const averageGrade = gradedCount && submissions.some((item) => typeof item.marks === 'number')
    ? Math.round(submissions.filter((item) => typeof item.marks === 'number').reduce((sum, item) => sum + ((item.marks ?? 0) / 100) * 100, 0) / gradedCount)
    : 0;
  const completedCount = assignmentRows.filter((item) => item.status !== 'Not submitted').length;
  const totalCount = Math.max(assignmentRows.length, 1);
  const progress = Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));

  const dashboardStats = stats ?? {
    enrolledClassesCount: 0,
    activeAssignmentsCount: 0,
    submittedCount: 0,
    gradedCount: 0,
    upcomingDeadlinesCount: 0,
  };

  return (
    <AppShell role="Student" breadcrumb="Student / Dashboard">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold text-brand-600 mb-1">STUDENT PORTAL</p>
            <h1 className="text-2xl font-extrabold text-slate-800">You have {pendingCount} assignment{pendingCount === 1 ? '' : 's'} due this week.</h1>
            <p className="text-sm text-slate-400 mt-1">{dashboardStats.enrolledClassesCount} enrolled class{dashboardStats.enrolledClassesCount === 1 ? '' : 'es'} · {dashboardStats.activeAssignmentsCount} active assignments</p>
          </div>
          <Button className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">View assignments</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">DUE THIS WEEK</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.upcomingDeadlinesCount}</p>
            <p className="text-xs text-slate-400 mt-1">Upcoming deadlines</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">SUBMITTED</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.submittedCount}</p>
            <p className="text-xs text-slate-400 mt-1">This term</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">AVERAGE GRADE</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{averageGrade}%</p>
            <p className="text-xs text-slate-400 mt-1">Across graded work</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">GRADED</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.gradedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Marked submissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-bold text-slate-800">Upcoming deadlines</p>
              <span className="badge bg-brand-50 text-brand-600">{pendingCount} pending</span>
            </div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading assignments…</p>
              ) : assignmentRows.length ? (
                assignmentRows.map((item) => (
                  <div key={item.id} className={`border border-slate-100 rounded-xl p-4 ${item.status === 'Graded' ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.subject}</p>
                      </div>
                      <span className={`badge ${item.status === 'Not submitted' ? 'bg-rose-50 text-rose-600' : item.status === 'Submitted' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        <span className={`badge-dot ${item.status === 'Not submitted' ? 'bg-rose-500' : item.status === 'Submitted' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        {item.status === 'Not submitted' ? 'Due soon' : item.status === 'Submitted' ? 'In progress' : 'Submitted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">Due: {new Date(item.deadline).toLocaleString()}</span>
                      <Button className="px-3.5 py-1.5 bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700">Submit work</Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No assignments available.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">Recent grades & feedback</p>
              <div className="space-y-3">
                {submissions.filter((item) => item.status === 'Graded' && item.feedback).slice(0, 3).map((submission) => (
                  <div key={submission.id} className="border border-slate-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{submission.assignmentTitle}</p>
                      <span className="text-sm font-bold text-emerald-600">{submission.marks ?? 0}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{submission.feedback}</p>
                  </div>
                ))}
                {!submissions.some((item) => item.status === 'Graded' && item.feedback) && (
                  <p className="text-sm text-slate-500">No graded feedback yet.</p>
                )}
              </div>
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
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">{completedCount}</span> of {totalCount} assignment{totalCount === 1 ? '' : 's'} completed</p>
                  <p className="text-xs text-slate-400 mt-1">{dashboardStats.upcomingDeadlinesCount} due soon</p>
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
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<'all' | 'pending' | 'submitted' | 'graded' | 'missing'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalType, setModalType] = useState<'submit' | null>(null);
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
    setComment(assignment.submission?.contentText ?? '');
    setSelectedFile(null);
    setUploadedFileName(assignment.submission?.attachments?.[0]?.originalFileName ?? assignment.submission?.fileName ?? '');
  };

  const openAssignmentView = (assignment: AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null }) => {
    router.push(`/roles/student/assignments/${assignment.id}`);
  };

  const openSubmissionView = (assignment: AssignmentDto & { studentStatus?: string; submission?: SubmissionDto | null }) => {
    if (assignment.submission?.id) {
      router.push(`/roles/student/submissions/${assignment.submission.id}`);
      return;
    }

    router.push(`/roles/student/assignments/${assignment.id}`);
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
      let submission: SubmissionDto;
      if (selectedAssignment.submission) {
        submission = await updateSubmission(selectedAssignment.submission.id, { contentText: comment });
        if (selectedFile) {
          const existingAttachments = await listAttachments('Submission', submission.id);
          await Promise.all(existingAttachments.map((attachment) => deleteAttachment(attachment.id)));
        }
      } else {
        submission = await createSubmission({ assignmentId: selectedAssignment.id, contentText: comment });
      }
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

  const totalAssignments = mapAssignments.length;
  const dueThisWeekCount = mapAssignments.filter((item) => item.studentStatus === 'Not submitted' && !isPastDue(item.deadline)).length;
  const awaitingGradeCount = mapAssignments.filter((item) => item.studentStatus === 'Submitted').length;
  const missingCount = mapAssignments.filter((item) => item.studentStatus === 'Not submitted' && isPastDue(item.deadline)).length;

  const subjectBadgeClass = (subject: string) => {
    const normalized = subject.toLowerCase();
    if (normalized.includes('math')) return 'bg-brand-50 text-brand-700';
    if (normalized.includes('phys')) return 'bg-sky-50 text-sky-700';
    if (normalized.includes('bio')) return 'bg-emerald-50 text-emerald-700';
    if (normalized.includes('eng')) return 'bg-violet-50 text-violet-700';
    return 'bg-slate-100 text-slate-700';
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'Not submitted') return 'bg-amber-50 text-amber-600';
    if (status === 'Submitted') return 'bg-sky-50 text-sky-600';
    if (status === 'Graded') return 'bg-emerald-50 text-emerald-600';
    return 'bg-rose-50 text-rose-600';
  };

  return (
    <AppShell role="Student" breadcrumb="Student / Assignments">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-brand-600">STUDENT PORTAL</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-800">My Assignments</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">TOTAL</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totalAssignments}</p>
            <p className="mt-1 text-xs text-slate-400">Across all subjects</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">DUE THIS WEEK</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{dueThisWeekCount}</p>
            <p className="mt-1 text-xs text-slate-400">Not yet submitted</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">AWAITING GRADE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12a10 10 0 1 1-4-8" /><path d="M22 4 12 14.01l-3-3" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{awaitingGradeCount}</p>
            <p className="mt-1 text-xs text-slate-400">Submitted, not graded yet</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400">MISSING</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{missingCount}</p>
            <p className="mt-1 text-xs text-slate-400">Past deadline, no submission</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'submitted', 'graded', 'missing'] as const).map((status) => (
              <Button
                key={status}
                type="button"
                variant={currentTab === status ? 'primary' : 'ghost'}
                onClick={() => setCurrentTab(status)}
                className={`cursor-pointer px-4 py-2 text-sm font-semibold ${currentTab === status ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {status === 'all' ? 'All' : status === 'pending' ? 'To do' : status === 'submitted' ? 'Submitted' : status === 'graded' ? 'Graded' : 'Missing'}
                <span className="opacity-70 font-normal"> {tabCounts[status]}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              <option value="">All subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assignments…"
                className="w-56 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAssignments.length ? (
            filteredAssignments.map((assignment) => {
              const badgeClass = statusBadgeClass(assignment.studentStatus);
              const statusLabel = assignment.studentStatus === 'Not submitted' ? (isPastDue(assignment.deadline) ? 'Missing' : 'Due soon') : assignment.studentStatus === 'Submitted' ? 'Submitted' : assignment.studentStatus === 'Graded' ? 'Graded' : assignment.studentStatus;

              return (
                <div key={assignment.id} className={`rounded-2xl border bg-white p-5 ${assignment.studentStatus === 'Not submitted' && isPastDue(assignment.deadline) ? 'border-dashed border-rose-200' : 'border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => openAssignmentView(assignment)} className="text-left text-base font-bold text-slate-800 transition hover:text-brand-600">
                          {assignment.title}
                        </Button>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${subjectBadgeClass(assignment.subjectName)}`}>
                          {assignment.subjectName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{assignment.teacherName ?? ''} · Max marks: {assignment.maxMarks ?? 0}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${assignment.studentStatus === 'Not submitted' ? 'bg-amber-500' : assignment.studentStatus === 'Submitted' ? 'bg-sky-500' : assignment.studentStatus === 'Graded' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {statusLabel}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">{assignment.description ?? ''}</p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="rounded bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-400">Due: {new Date(assignment.deadline).toLocaleString()}</span>
                    {assignment.studentStatus === 'Not submitted' ? (
                      <Button
                        variant="primary"
                        type="button"
                        onClick={openSubmit.bind(null, assignment)}
                        className="cursor-pointer bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                        {isPastDue(assignment.deadline) ? 'Submit late' : 'Submit work'}
                      </Button>
                    ) : assignment.studentStatus === 'Graded' ? (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => openSubmissionView(assignment)}
                        className="cursor-pointer border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                        View feedback
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {(assignment.allowResubmission || assignment.studentStatus === 'ResubmissionRequested') ? (
                          <Button
                            variant="primary"
                            type="button"
                            onClick={openSubmit.bind(null, assignment)}
                            className="cursor-pointer bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700">
                            Resubmit work
                          </Button>
                        ) : null}
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => openSubmissionView(assignment)}
                          className="cursor-pointer border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                          View submission
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-400">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
              <p className="text-base font-bold text-slate-700">Nothing here</p>
              <p className="mt-1 max-w-sm text-sm text-slate-400">No assignments match this filter right now.</p>
            </div>
          )}
        </div>

        {modalType && selectedAssignment ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
            <div className="bg-white rounded-[28px] w-full max-w-[720px] max-h-[90vh] flex flex-col shadow-[0_18px_65px_rgba(15,23,42,0.18)] overflow-hidden">
              <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
                <div>
                  <h2 className="text-[32px] font-extrabold leading-none text-slate-800 tracking-[-0.03em]">
                    {selectedAssignment.submission ? 'Resubmit work' : (isPastDue(selectedAssignment.deadline) ? 'Submit late work' : 'Submit work')}
                  </h2>
                  <p className="text-base text-slate-400 mt-3">{selectedAssignment.subjectName} ·</p>
                </div>
                <Button type="button" variant="ghost" onClick={closeModal} className="inline-flex h-10 w-10 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </Button>
              </div>

              <div className="overflow-y-auto px-7 py-6 space-y-5">
                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Upload your work</label>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <FileUpload
                        selectedFiles={selectedFile ? [selectedFile] : []}
                        onFileSelected={(file) => {
                          setSelectedFile(file);
                          setUploadedFileName(file.name);
                        }}
                        onFilesSelected={(files) => {
                          const newest = files.at(-1) ?? null;
                          setSelectedFile(newest);
                          setUploadedFileName(newest ? newest.name : '');
                        }}
                        allowedTypesText="PDF, DOCX, TXT, ZIP, PNG, JPG (Max 10MB)"
                      />
                    </div>
                    {uploadedFileName ? (
                      <p className="mt-2 text-sm text-slate-500">Selected: <span className="font-medium text-slate-700">{uploadedFileName}</span></p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Comment <span className="font-normal text-slate-400">(optional)</span></label>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a note for your teacher…"
                      className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/80">
                <Button type="button" variant="secondary" onClick={closeModal} className="border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="button" onClick={submitAssignment} className="bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
                  {selectedAssignment.submission ? 'Resubmit' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
