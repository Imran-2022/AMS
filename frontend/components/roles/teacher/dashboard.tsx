"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/shared/layout';
import { Button } from '../../ui/Button';
import { getAssignments, getClassCourses, getSubjects, createAssignment, publishAssignment, uploadAttachment, getCurrentUser, getSubmissions } from '@/lib/api';
import { getTeacherDashboardStats, type TeacherDashboardStats } from '@/lib/api/dashboard';
import type { AssignmentDto, ClassCourseDto, SubjectDto, CreateAssignmentDto, UserDto, SubmissionDto } from '@/lib/api';
import { TeacherAssignmentCreateModal } from './AssignmentCreateModal';

export function TeacherDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [teacherName, setTeacherName] = useState<string>('Teacher');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const greeting = new Date().getHours() < 12 ? 'GOOD MORNING' : new Date().getHours() < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const goToSubmissions = () => {
    router.push('/roles/teacher/submissions');
  };

  const goToAssignments = () => {
    router.push('/roles/teacher/assignments');
  };

  const handleCreateAssignmentClick = () => {
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  async function loadDashboard() {
    setLoadError(null);
    setLoading(true);
    try {
      const [dashboardStats, apiClasses, apiSubjects, apiAssignments, apiSubmissions, currentUser] = await Promise.all([
        getTeacherDashboardStats(),
        getClassCourses(),
        getSubjects(),
        getAssignments(),
        getSubmissions(),
        getCurrentUser()
      ]);

      setStats(dashboardStats);
      setClasses(apiClasses);
      setSubjects(apiSubjects);
      setAssignments(apiAssignments);
      setSubmissions(apiSubmissions);
      setTeacherName(currentUser?.fullName || 'Teacher');
    } catch (err) {
      console.error(err);
      setLoadError('Unable to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  const handleSaveDraft = async (payload: {
    title: string;
    description: string;
    classCourseId: string;
    subjectId: string;
    deadline: string;
    maxMarks: number;
    attachmentFiles?: File[];
  }) => {
    const dto: CreateAssignmentDto = {
      title: payload.title,
      description: payload.description,
      classCourseId: payload.classCourseId,
      subjectId: payload.subjectId,
      deadline: payload.deadline,
      maxMarks: payload.maxMarks,
      allowLateSubmission: false,
      allowResubmission: true,
    };

    const created = await createAssignment(dto);

    if (payload.attachmentFiles?.length) {
      await Promise.all(payload.attachmentFiles.map((file) => uploadAttachment('Assignment', created.id, file)));
    }

    await loadDashboard();
  };

  const handlePublish = async (payload: {
    title: string;
    description: string;
    classCourseId: string;
    subjectId: string;
    deadline: string;
    maxMarks: number;
    attachmentFiles?: File[];
  }) => {
    const dto: CreateAssignmentDto = {
      title: payload.title,
      description: payload.description,
      classCourseId: payload.classCourseId,
      subjectId: payload.subjectId,
      deadline: payload.deadline,
      maxMarks: payload.maxMarks,
      allowLateSubmission: false,
      allowResubmission: true,
    };

    const created = await createAssignment(dto);

    if (payload.attachmentFiles?.length) {
      await Promise.all(payload.attachmentFiles.map((file) => uploadAttachment('Assignment', created.id, file)));
    }

    await publishAssignment(created.id);
    await loadDashboard();
  };

  const goToAssignmentDetail = (assignmentId: string) => {
    router.push(`/roles/teacher/assignments/${assignmentId}`);
  };

  const goToSubmissionDetail = (submissionId: string) => {
    router.push(`/roles/teacher/submissions/${encodeURIComponent(submissionId)}`);
  };

  const goToClasses = () => {
    router.push('/roles/teacher/classes');
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const activeAssignments = stats?.activeAssignmentsCount ?? assignments.filter((assignment) => assignment.status === 'Published').length;
  const gradedSubmissions = stats?.totalGradedSubmissionsCount ?? 0;
  const pendingReviews = stats?.pendingGradingSubmissionsCount ?? 0;
  const assignedSubjects = stats?.assignedSubjectsCount ?? subjects.length;
  const totalClasses = classes.length;

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    return assignments.filter((assignment) => {
      if (assignment.status !== 'Published') return false;
      const deadline = new Date(assignment.deadline);
      return deadline >= now && deadline <= inSevenDays;
    }).length;
  }, [assignments]);

  const classesWithSubjects = useMemo(() => {
    return classes.map((cls) => ({
      ...cls,
      subjects: subjects.filter((subject) => subject.classCourseId === cls.id).map((subject) => subject.name)
    }));
  }, [classes, subjects]);

  const recentSubmissions = useMemo(() => {
    return submissions
      .filter((submission) => !['Graded', 'ResubmissionRequested'].includes(submission.status))
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  }, [submissions]);

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-bold text-brand-600 mb-1 uppercase">{greeting}, {teacherName}</p>
            <p className="text-sm text-slate-700 mt-1">Review performance and keep your classes on track.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="px-2  text-xs" onClick={goToSubmissions}>Review Submissions</Button>
            <Button type="button" variant="primary" className="px-2  text-xs" onClick={handleCreateAssignmentClick}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Assignment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">MY CLASSES</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{loading ? '—' : totalClasses}</p>
            <p className="text-xs text-slate-400 mt-1">Your assigned classes</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">MY SUBJECTS</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{loading ? '—' : assignedSubjects}</p>
            <p className="text-xs text-slate-400 mt-1">Subjects you teach</p>
          </div>
          <div className="bg-amber-50/40 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-amber-600">PENDING GRADING</p>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{loading ? '—' : pendingReviews}</p>
            <p className="text-xs text-amber-600 mt-1 font-medium">Needs your review</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">DUE THIS WEEK</p>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{loading ? '—' : upcomingDeadlines}</p>
            <p className="text-xs text-slate-400 mt-1">Published deadlines in the next week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-base font-bold text-slate-800">Most Recent Submission</p>
              <span className="cursor-pointer text-xs font-bold text-brand-700 transition-colors hover:text-brand-900" onClick={() => goToSubmissions()}>View submissions →</span>
            </div>
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <button key={submission.id} type="button" className="block w-full cursor-pointer border border-slate-100 rounded-xl p-4 text-left transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none" onClick={() => goToSubmissionDetail(submission.id)}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold tracking-wide text-slate-800">{submission.assignmentTitle}</p>
                        {submission.status === 'Resubmitted' && (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">Resubmitted</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {submission.classCourseName}
                        {submission.classCourseSection ? ` · ${submission.classCourseSection}` : ''}
                        {submission.groupName ? ` · ${submission.groupName}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-right">
                      <span className="text-xs font-semibold text-amber-600">{new Date(submission.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </button>
              ))}
              {recentSubmissions.length === 0 && (
                <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M8 7h8M8 11h5M8 15l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-slate-700">You’re all caught up</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-400">There are no submissions waiting for your review.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-1">My Classes</p>
                  <p className="text-xs text-slate-400">Classes and subjects assigned to you.</p>
                </div>
                <span className="cursor-pointer text-xs font-bold text-brand-700 transition-colors hover:text-brand-900" onClick={goToClasses}>View classes →</span>
              </div>
              <div className="space-y-4">
                {classesWithSubjects.map((cls) => (
                  <div key={cls.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cls.name} — {cls.section}</p>
                        <p className="text-xs text-slate-400 mt-1">{cls.academicYear}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{cls.subjects.length} subjects</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cls.subjects.map((subject) => (
                        <span key={subject} className="rounded bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600">{subject}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {classesWithSubjects.length === 0 && (
                  <div className="p-5 text-sm text-slate-500">You have no classes assigned yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{loadError}</div>
        )}

        <TeacherAssignmentCreateModal
          open={createModalOpen}
          onClose={closeCreateModal}
          classes={classes}
          subjects={subjects}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      </div>
    </AppShell>
  );
}
