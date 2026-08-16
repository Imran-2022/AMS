"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/shared/layout';
import { PageLoader } from '@/shared/ui';
import { getAssignments, getMySubmissions, type AssignmentDto, type SubmissionDto } from '@/lib/api';
import { getStudentDashboardStats, type StudentDashboardStats } from '@/lib/api/dashboard';

function getStudentStatusLabel(status: string | undefined) {
  switch (status) {
    case 'ResubmissionRequested':
      return 'Resubmission Requested';
    case 'Resubmission':
      return 'Resubmission';
    case 'Submitted':
      return 'Submitted';
    case 'Graded':
      return 'Graded';
    case 'Not submitted':
      return 'Not submitted';
    default:
      return status ?? 'Not submitted';
  }
}

export function StudentDashboardPage() {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
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
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Listen for academic year changes and reload data
  useEffect(() => {
    const handleAcademicYearChanged = () => {
      void loadData();
    };

    window.addEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    return () => {
      window.removeEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    };
  }, []);

  const assignmentRows = useMemo(() => {
    const submissionMap = new Map(submissions.map((submission) => [submission.assignmentId, submission]));

    return assignments
      .filter((assignment) => {
        const submission = submissionMap.get(assignment.id);
        if (!submission) {
          return true;
        }

        if (submission.status === 'ResubmissionRequested') {
          return true;
        }

        return false;
      })
      .slice(0, 4)
      .map((assignment) => {
        const submission = submissionMap.get(assignment.id);
        return {
          id: assignment.id,
          title: assignment.title,
          subject: assignment.subjectName,
          deadline: assignment.deadline,
          maxMarks: assignment.maxMarks,
          status: submission?.status,
          isResubmissionRequested: submission?.status === 'ResubmissionRequested',
        };
      });
  }, [assignments, submissions]);

  const pendingCount = assignments
    .filter((assignment) => {
      const submission = submissions.find((item) => item.assignmentId === assignment.id);
      if (!submission || submission.status === 'ResubmissionRequested') {
        return true;
      }

      return false;
    }).length;

  const gradedSubmissions = submissions.filter((item) =>
    item.status === 'Graded' &&
    typeof item.marks === 'number' &&
    typeof item.maxMarks === 'number' &&
    item.maxMarks > 0
  );
  const totalEarnedMarks = gradedSubmissions.reduce((sum, item) => sum + (item.marks ?? 0), 0);
  const totalPossibleMarks = gradedSubmissions.reduce((sum, item) => sum + (item.maxMarks ?? 0), 0);
  const averageGrade = totalPossibleMarks > 0 ? Math.round((totalEarnedMarks / totalPossibleMarks) * 100) : 0;
  const totalAssignmentCount = assignments.length;
  const submittedAssignmentCount = assignments.filter((assignment) => {
    const submission = submissions.find((item) => item.assignmentId === assignment.id);
    return !!submission && submission.status !== 'ResubmissionRequested';
  }).length;
  const notSubmittedAssignmentCount = Math.max(0, totalAssignmentCount - submittedAssignmentCount);
  const progress = totalAssignmentCount ? Math.round((submittedAssignmentCount / totalAssignmentCount) * 100) : 0;

  const dashboardStats = stats ?? {
    studentName: '',
    studentId: '',
    role: 'Student',
    className: '',
    classSection: '',
    academicYear: '',
    enrolledClassesCount: 0,
    activeAssignmentsCount: 0,
    submittedCount: 0,
    gradedCount: 0,
    upcomingDeadlinesCount: 0,
  };

  if (loading) {
    return (
      <AppShell role="Student" breadcrumb="Student / Dashboard">
        <div className="space-y-6">
          <div>
            <p className="text-base font-semibold text-slate-800">
              <span className="text-xs font-bold text-brand-600">STUDENT PORTAL</span>
            </p>
          </div>
          <PageLoader title="Loading dashboard" subtitle="Loading your assignments and performance summary…" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Student" breadcrumb="Student / Dashboard">
      <div className="space-y-6">
        <div>
          <p className="text-base font-semibold text-slate-800">
            <span className="text-xs font-bold text-brand-600">STUDENT PORTAL</span>
            <span className="mx-2 text-slate-400">/</span>
            <span className="uppercase text-xs font-bold text-brand-600">{dashboardStats.studentName || 'Student'}</span>
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Class: {dashboardStats.className || 'Not assigned'}{dashboardStats.classSection ? ` / ${dashboardStats.classSection}` : ''}{dashboardStats.groupName ? ` / ${dashboardStats.groupName}` : ''} · Academic year: {dashboardStats.academicYear || 'Not available'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">DUE THIS WEEK</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{dashboardStats.upcomingDeadlinesCount}</p>
            <p className="text-xs text-slate-400 mt-1">Upcoming Deadlines</p>
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
              <p className="text-base font-bold text-slate-800">Upcoming Deadlines</p>
              <span className="badge bg-brand-50 text-brand-600">{pendingCount} Not Submitted</span>
            </div>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading assignments…</p>
              ) : assignmentRows.length ? (
                assignmentRows.map((item) => (
                  <Link
                    href={`/roles/student/assignments/${item.id}`}
                    key={item.id}
                    className="block cursor-pointer border border-slate-100 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700">
                          {item.title}
                          {item.isResubmissionRequested ? (
                            <span className="ml-1 text-[11px] font-semibold text-rose-600">(Resubmission Requested)</span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">{item.subject}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1 text-right">
                        <p className="text-[11.5px] font-medium text-slate-600">Max marks: {item.maxMarks}</p>
                        <p className="text-[11.5px] font-medium text-slate-500">
                          Due {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(item.deadline))}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M8 7h8M8 11h5M8 15l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-slate-700">You’re all caught up</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-400">There are no upcoming assignments waiting for your submission.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-bold text-slate-800 mb-4">Recent Grades & Feedback</p>
              <div className="space-y-3">
                {submissions.filter((item) => item.status === 'Graded' && item.feedback).slice(0, 3).map((submission) => (
                  <Link
                    key={submission.id}
                    href={`/roles/student/submissions/${submission.id}`}
                    className="block border border-slate-100 rounded-xl p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">{submission.assignmentTitle}</p>
                      <span className="text-sm font-bold text-emerald-600">{submission.marks ?? 0} / {submission.maxMarks ?? 100}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{submission.classCourseName}{submission.classCourseSection ? ` · Section ${submission.classCourseSection}` : ''}{submission.groupName ? ` · ${submission.groupName}` : ''} · {submission.feedback}</p>
                  </Link>
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
                  <p className="text-sm text-slate-600"><span className="font-bold text-slate-800">{submittedAssignmentCount}</span> of {totalAssignmentCount} assignment{totalAssignmentCount === 1 ? '' : 's'} submitted</p>
                  <p className="text-xs text-slate-400 mt-1">{notSubmittedAssignmentCount} not submitted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
