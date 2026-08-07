"use client";

import { useEffect, useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { ASSIGNMENTS, SUBMISSIONS } from '../../data';
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
  const greeting = new Date().getHours() < 12 ? 'GOOD MORNING' : new Date().getHours() < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-600 mb-1">{greeting}, RAFIUL</p>
            <h1 className="text-2xl font-extrabold text-slate-800">You have {pendingReviews} submissions waiting on grading.</h1>
            <p className="text-sm text-slate-400 mt-1">Across 3 classes — Mathematics and Physics.</p>
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
              <p className="text-[11px] font-bold tracking-widest text-slate-400">MY CLASSES</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">3</p>
            <p className="text-xs text-slate-400 mt-1">This academic term</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">MY STUDENTS</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">84</p>
            <p className="text-xs text-slate-400 mt-1">Across all your classes</p>
          </div>
          <div className="bg-amber-50/40 rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-amber-600">PENDING GRADING</p>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{pendingReviews}</p>
            <p className="text-xs text-amber-600 mt-1 font-medium">Needs your review</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">DUE THIS WEEK</p>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">2</p>
            <p className="text-xs text-slate-400 mt-1">Assignment deadlines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">Needs grading</p>
                <p className="text-xs text-slate-400 mt-0.5">Newest submissions across your classes.</p>
              </div>
              <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View all →</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-2.5 text-[11px] font-bold tracking-widest text-slate-400">STUDENT</th>
                  <th className="px-2 py-2.5 text-[11px] font-bold tracking-widest text-slate-400">ASSIGNMENT</th>
                  <th className="px-2 py-2.5 text-[11px] font-bold tracking-widest text-slate-400">SUBMITTED</th>
                  <th className="w-20 px-5 py-2.5 text-right text-[11px] font-bold tracking-widest text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0">AR</div>
                      <span className="font-semibold text-slate-700">Ayesha Rahman</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-500">Algebra Worksheet 3</td>
                  <td className="px-2 py-3 text-slate-400">2 hours ago</td>
                  <td className="px-5 py-3 text-right"><button className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">Grade</button></td>
                </tr>
                <tr>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold shrink-0">NF</div>
                      <span className="font-semibold text-slate-700">Nusrat Farah</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-500">Algebra Worksheet 3</td>
                  <td className="px-2 py-3 text-slate-400">5 hours ago</td>
                  <td className="px-5 py-3 text-right"><button className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">Grade</button></td>
                </tr>
                <tr>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold shrink-0">SA</div>
                      <span className="font-semibold text-slate-700">Sadia Akter</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-slate-500">Quadratic Equations Quiz</td>
                  <td className="px-2 py-3 text-slate-400">Yesterday</td>
                  <td className="px-5 py-3 text-right"><button className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">Grade</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-bold text-slate-700 mb-1">Upcoming deadlines</p>
            <p className="text-xs text-slate-400 mb-4">Your published assignments.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Newton's Laws Lab</p>
                  <p className="text-xs text-slate-400">Class 9 - A · Physics</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-600"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Tomorrow</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Geometry Basics Quiz</p>
                  <p className="text-xs text-slate-400">Class 10 - B · Mathematics</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700"><span className="h-2 w-2 rounded-full bg-amber-500"></span>3 days</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Motion & Forces Review</p>
                  <p className="text-xs text-slate-400">Class 9 - A · Physics</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600"><span className="h-2 w-2 rounded-full bg-slate-400"></span>1 week</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-slate-700 mb-3">My classes</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-base font-bold text-slate-800">Class 9 — A</p>
              <p className="text-xs text-slate-400 mt-0.5">Mathematics</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500"><span className="font-bold text-slate-700">28</span> students</p>
                <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View roster →</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-base font-bold text-slate-800">Class 9 — A</p>
              <p className="text-xs text-slate-400 mt-0.5">Physics</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500"><span className="font-bold text-slate-700">28</span> students</p>
                <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View roster →</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-base font-bold text-slate-800">Class 10 — B</p>
              <p className="text-xs text-slate-400 mt-0.5">Mathematics</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500"><span className="font-bold text-slate-700">24</span> students</p>
                <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View roster →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
