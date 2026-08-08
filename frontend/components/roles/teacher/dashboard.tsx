"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { getAssignments, getClassCourses, getSubjects } from '@/lib/api';
import { getTeacherDashboardStats, type TeacherDashboardStats } from '@/lib/api/dashboard';
import type { AssignmentDto, ClassCourseDto, SubjectDto } from '@/lib/api';

export function TeacherDashboardPage() {
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const greeting = new Date().getHours() < 12 ? 'GOOD MORNING' : new Date().getHours() < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  useEffect(() => {
    async function loadDashboard() {
      setLoadError(null);
      setLoading(true);
      try {
        const [dashboardStats, apiClasses, apiSubjects, apiAssignments] = await Promise.all([
          getTeacherDashboardStats(),
          getClassCourses(),
          getSubjects(),
          getAssignments()
        ]);

        setStats(dashboardStats);
        setClasses(apiClasses);
        setSubjects(apiSubjects);
        setAssignments(apiAssignments);
      } catch (err) {
        console.error(err);
        setLoadError('Unable to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

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

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Dashboard">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold text-brand-600 mb-1">{greeting}, TEACHER</p>
            <h1 className="text-2xl font-extrabold text-slate-800">You have {pendingReviews} submissions waiting on grading.</h1>
            <p className="text-sm text-slate-400 mt-1">Review performance and keep your classes on track.</p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Grade submissions</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create assignment
            </button>
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

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">Most urgent assignments</p>
                <p className="text-xs text-slate-400 mt-0.5">Published assignments due soon.</p>
              </div>
              <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View assignments →</button>
            </div>
            <div className="divide-y divide-slate-100">
              {assignments.filter((assignment) => assignment.status === 'Published').slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{assignment.classCourseName} · {assignment.subjectName}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-600">{new Date(assignment.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {assignments.filter((assignment) => assignment.status === 'Published').length === 0 && (
                <div className="px-5 py-6 text-sm text-slate-500">No published assignments available yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-bold text-slate-700 mb-1">My classes</p>
            <p className="text-xs text-slate-400 mb-4">Classes and subjects assigned to you.</p>
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
                      <span key={subject} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{subject}</span>
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

        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{loadError}</div>
        )}
      </div>
    </AppShell>
  );
}
