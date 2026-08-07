"use client";

import { useState } from 'react';
import { AppShell } from '../../layout/AppShell';

type RosterStudent = {
  initials: string;
  color: 'brand' | 'amber' | 'violet' | 'rose' | 'sky' | 'emerald';
  name: string;
  vals: string[];
};

type RosterKey = '9A' | '10B';

type RosterData = {
  title: string;
  subtitle: string;
  cols: string[];
  students: RosterStudent[];
};

const ROSTERS: Record<RosterKey, RosterData> = {
  '9A': {
    title: 'Class 9 — A roster',
    subtitle: '32 students · Mathematics, Physics',
    cols: ['MATHEMATICS AVG.', 'PHYSICS AVG.'],
    students: [
      { initials: 'AR', color: 'brand', name: 'Ayesha Rahman', vals: ['84%', '—'] },
      { initials: 'KH', color: 'amber', name: 'Karim Hasan', vals: ['—', '78%'] },
      { initials: 'SA', color: 'violet', name: 'Sadia Akter', vals: ['91%', '88%'] },
      { initials: 'TI', color: 'rose', name: 'Tanvir Islam', vals: ['—', '—'] },
    ],
  },
  '10B': {
    title: 'Class 10 — B roster',
    subtitle: '26 students · Mathematics',
    cols: ['MATHEMATICS AVG.'],
    students: [
      { initials: 'NF', color: 'sky', name: 'Nusrat Farah', vals: ['—'] },
      { initials: 'RM', color: 'emerald', name: 'Rafiq Mia', vals: ['—'] },
    ],
  },
};

const avatarBg = (color: string) => {
  switch (color) {
    case 'brand':
      return 'bg-brand-100 text-brand-700';
    case 'amber':
      return 'bg-amber-100 text-amber-700';
    case 'violet':
      return 'bg-violet-100 text-violet-700';
    case 'rose':
      return 'bg-rose-100 text-rose-700';
    case 'sky':
      return 'bg-sky-100 text-sky-700';
    case 'emerald':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export function TeacherClassesPage() {
  const [activeRoster, setActiveRoster] = useState<RosterKey | null>(null);
  const roster = activeRoster ? ROSTERS[activeRoster] : null;

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My Classes">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold tracking-[0.24em] text-brand-600">TEACHER PORTAL</p>
          <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">My Classes</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">CLASSES</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">2</p>
            <p className="mt-1 text-xs text-slate-400">Class 9-A and Class 10-B</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">SUBJECTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">2</p>
            <p className="mt-1 text-xs text-slate-400">Mathematics and Physics</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">TOTAL STUDENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">58</p>
            <p className="mt-1 text-xs text-slate-400">Across both classes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">ACTIVE ASSIGNMENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">2</p>
            <p className="mt-1 text-xs text-slate-400">Published, awaiting submissions</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-extrabold text-slate-800">Class 9 — A</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">Mathematics</span>
                  <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">Physics</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold text-slate-800">32</p>
                <p className="text-[11px] text-slate-400">students</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">2</p>
                <p className="text-[11px] text-slate-400">Assignments</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">88%</p>
                <p className="text-[11px] text-slate-400">Avg. submitted</p>
              </div>
              <div>
                <p className="text-sm font-bold text-rose-500">2</p>
                <p className="text-[11px] text-slate-400">Needs grading</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-5">
              <button type="button" onClick={() => setActiveRoster('9A')} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">View roster</button>
              <button type="button" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">View assignments</button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-extrabold text-slate-800">Class 10 — B</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">Mathematics</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold text-slate-800">26</p>
                <p className="text-[11px] text-slate-400">students</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">0</p>
                <p className="text-[11px] text-slate-400">Assignments</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">—</p>
                <p className="text-[11px] text-slate-400">Avg. submitted</p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">0</p>
                <p className="text-[11px] text-slate-400">Needs grading</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 flex items-center gap-2 text-xs text-amber-700">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>You have a draft assignment for this class — publish it to get started.</span>
            </div>

            <div className="flex items-center gap-2.5 mt-4">
              <button type="button" onClick={() => setActiveRoster('10B')} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">View roster</button>
              <button type="button" className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">View assignments</button>
            </div>
          </div>
        </div>

        {roster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => setActiveRoster(null)}>
            <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-slate-100 px-7 pt-6 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{roster.title}</h2>
                  <p className="mt-0.5 text-sm text-slate-400">{roster.subtitle}</p>
                </div>
                <button type="button" onClick={() => setActiveRoster(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky top-0 bg-white border-b border-slate-100 text-left">
                      <th className="px-7 py-3 text-[11px] font-bold tracking-[0.24em] text-slate-400">STUDENT</th>
                      <th className="px-2 py-3 text-[11px] font-bold tracking-[0.24em] text-slate-400">{roster.cols[0]}</th>
                      <th className={`px-2 py-3 text-[11px] font-bold tracking-[0.24em] text-slate-400 ${roster.cols[1] ? '' : 'hidden'}`}>{roster.cols[1] ?? ''}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {roster.students.map((student) => (
                      <tr key={student.initials}>
                        <td className="px-7 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${avatarBg(student.color)}`}>
                              {student.initials}
                            </div>
                            <span className="font-semibold text-slate-700">{student.name}</span>
                          </div>
                        </td>
                        <td className={`px-2 py-3 ${student.vals[0] === '—' ? 'text-slate-400' : 'font-semibold text-slate-700'}`}>{student.vals[0]}</td>
                        <td className={`px-2 py-3 ${!roster.cols[1] ? 'hidden' : student.vals[1] === '—' ? 'text-slate-400' : 'font-semibold text-slate-700'}`}>{roster.cols[1] ? student.vals[1] : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/60 px-7 py-4 rounded-b-3xl">
                <button type="button" onClick={() => setActiveRoster(null)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
