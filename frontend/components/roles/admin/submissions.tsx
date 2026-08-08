"use client";

import { useMemo, useState } from 'react';
import { AmsPagination } from '../../ui';
import { AppShell } from '../../layout/AppShell';
import { ASSIGNMENTS, CLASSES } from '../../data';

const CLASS_OPTIONS = ['All classes', ...CLASSES.map((item) => `${item.name} — ${item.section}`)];
const ASSIGNMENT_OPTIONS = ['All assignments', ...ASSIGNMENTS.map((item) => item.title)];

const INITIAL_SUBMISSIONS = [
  {
    id: 1,
    student: 'Ayesha Rahman',
    initials: 'AR',
    avatarBg: 'brand',
    assignment: 'Algebra Worksheet 3',
    cls: 'Class 9 — A',
    submittedAt: 'Aug 11, 2026 · 6:40 PM',
    status: 'Graded',
    marks: '18 / 20',
  },
  {
    id: 2,
    student: 'Karim Hasan',
    initials: 'KH',
    avatarBg: 'amber',
    assignment: "Newton's Laws Lab Report",
    cls: 'Class 9 — A',
    submittedAt: 'Aug 14, 2026 · 9:12 AM',
    status: 'Pending review',
    marks: '—',
  },
  {
    id: 3,
    student: 'Nusrat Farah',
    initials: 'NF',
    avatarBg: 'sky',
    assignment: 'Essay: My Summer Vacation',
    cls: 'Class 10 — B',
    submittedAt: 'Jul 29, 2026 · 11:58 PM',
    status: 'Graded',
    marks: '22 / 25',
  },
  {
    id: 4,
    student: 'Tanvir Islam',
    initials: 'TI',
    avatarBg: 'rose',
    assignment: 'Essay: My Summer Vacation',
    cls: 'Class 10 — B',
    submittedAt: null,
    status: 'Missing',
    marks: '—',
  },
  {
    id: 5,
    student: 'Sadia Akter',
    initials: 'SA',
    avatarBg: 'violet',
    assignment: 'Algebra Worksheet 3',
    cls: 'Class 9 — A',
    submittedAt: 'Aug 13, 2026 · 2:04 AM',
    status: 'Pending review',
    marks: '—',
    isLate: true,
  },
];

const statusClasses: Record<string, string> = {
  Graded: 'bg-emerald-50 text-emerald-600',
  'Pending review': 'bg-amber-50 text-amber-600',
  Missing: 'bg-rose-50 text-rose-600',
};

const avatarClasses: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
};

export function AdminSubmissionsPage() {
  const [activeTab, setActiveTab] = useState<'All' | 'Graded' | 'Pending' | 'Missing'>('All');
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [selectedAssignment, setSelectedAssignment] = useState(ASSIGNMENT_OPTIONS[0]);
  const [search, setSearch] = useState('');

  const totals = useMemo(() => {
    const total = INITIAL_SUBMISSIONS.length;
    const graded = INITIAL_SUBMISSIONS.filter((item) => item.status === 'Graded').length;
    const pending = INITIAL_SUBMISSIONS.filter((item) => item.status === 'Pending review').length;
    const missing = INITIAL_SUBMISSIONS.filter((item) => item.status === 'Missing').length;
    return { total, graded, pending, missing };
  }, []);

  const visibleSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return INITIAL_SUBMISSIONS.filter((submission) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Graded' && submission.status === 'Graded') ||
        (activeTab === 'Pending' && submission.status === 'Pending review') ||
        (activeTab === 'Missing' && submission.status === 'Missing');

      const matchesClass = selectedClass === 'All classes' || submission.cls === selectedClass;
      const matchesAssignment = selectedAssignment === 'All assignments' || submission.assignment === selectedAssignment;
      const matchesSearch = !query || submission.student.toLowerCase().includes(query);

      return matchesTab && matchesClass && matchesAssignment && matchesSearch;
    });
  }, [activeTab, selectedClass, selectedAssignment, search]);

  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  const pagedSubmissions = useMemo(() => {
    const start = pageIndex * pageSize;
    return visibleSubmissions.slice(start, start + pageSize);
  }, [visibleSubmissions, pageIndex, pageSize]);

  return (
    <AppShell role="Admin" breadcrumb="Admin / Submissions">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Submissions</h1>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">TOTAL SUBMISSIONS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12a10 10 0 1 1-4-8" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.total}</p>
            <p className="text-xs text-slate-400 mt-1">Across all assignments</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">GRADED</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.graded}</p>
            <p className="text-xs text-slate-400 mt-1">Marks entered</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">PENDING REVIEW</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.pending}</p>
            <p className="text-xs text-slate-400 mt-1">Submitted, awaiting marks</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">MISSING</p>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totals.missing}</p>
            <p className="text-xs text-slate-400 mt-1">Never submitted, past deadline</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {(['All', 'Graded', 'Pending', 'Missing'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                {tab} <span className="opacity-70 font-normal">{tab === 'All' ? totals.total : tab === 'Graded' ? totals.graded : tab === 'Pending' ? totals.pending : totals.missing}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 flex-1 justify-end min-w-[320px] flex-wrap">
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
              {CLASS_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select
              value={selectedAssignment}
              onChange={(event) => setSelectedAssignment(event.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
              {ASSIGNMENT_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student…"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">STUDENT</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">ASSIGNMENT</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">SUBMITTED</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">MARKS</th>
                    <th className="w-16 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pagedSubmissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarClasses[submission.avatarBg]}`}>
                            {submission.initials}
                          </div>
                          <span className="font-semibold text-slate-700">{submission.student}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3.5 text-slate-500">{submission.assignment}</td>
                      <td className="px-2 py-3.5 text-slate-500">{submission.submittedAt ?? <span className="italic text-slate-400">Not submitted</span>}</td>
                      <td className="px-2 py-3.5">
                        <span className={`badge ${statusClasses[submission.status]}`}>
                          <span className="badge-dot" />
                          {submission.status}
                        </span>
                      </td>
                      <td className={`px-2 py-3.5 ${submission.marks === '—' ? 'text-slate-400' : 'font-semibold text-slate-700'}`}>
                        {submission.marks}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={submission.status === 'Missing'}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${submission.status === 'Missing' ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>

              <AmsPagination
                currentPage={pageIndex}
                pageSize={pageSize}
                totalItems={visibleSubmissions.length}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
                label="Showing"
                itemLabel="submissions"
              />
        </div>
      </div>
    </AppShell>
  );
}
