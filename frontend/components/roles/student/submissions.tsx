"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AmsPagination, Button } from '../../ui';
import { AppShell } from '../../layout/AppShell';
import { getMySubmissions, type SubmissionDto } from '@/lib/api';

export function StudentSubmissionsPage() {
  const [currentTab, setCurrentTab] = useState<'all' | 'graded' | 'pending'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const items = await getMySubmissions();
        setSubmissions(items);
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const statusCounts = useMemo(() => ({
    all: submissions.length,
    graded: submissions.filter((item) => item.status === 'Graded').length,
    pending: submissions.filter((item) => item.status !== 'Graded').length,
  }), [submissions]);

  const averageGrade = useMemo(() => {
    const graded = submissions.filter((item) =>
      item.status === 'Graded' &&
      typeof item.marks === 'number' &&
      typeof item.maxMarks === 'number' &&
      item.maxMarks > 0
    );
    const totalEarnedMarks = graded.reduce((sum, item) => sum + (item.marks ?? 0), 0);
    const totalPossibleMarks = graded.reduce((sum, item) => sum + (item.maxMarks ?? 0), 0);
    return totalPossibleMarks > 0 ? Math.round((totalEarnedMarks / totalPossibleMarks) * 100) : 0;
  }, [submissions]);

  const subjectStats = useMemo(() => {
    const grouped = new Map<string, { total: number; graded: number; earnedMarks: number; possibleMarks: number }>();
    submissions.forEach((item) => {
      const subject = item.classCourseName || 'General';
      const entry = grouped.get(subject) ?? { total: 0, graded: 0, earnedMarks: 0, possibleMarks: 0 };
      entry.total += 1;
      if (item.status === 'Graded') {
        entry.graded += 1;
        if (typeof item.marks === 'number' && typeof item.maxMarks === 'number' && item.maxMarks > 0) {
          entry.earnedMarks += item.marks;
          entry.possibleMarks += item.maxMarks;
        }
      }
      grouped.set(subject, entry);
    });

    return Array.from(grouped.entries())
      .slice(0, 4)
      .map(([subject, value]) => ({
        subject,
        ratio: value.possibleMarks > 0 ? Math.min(100, Math.round((value.earnedMarks / value.possibleMarks) * 100)) : 0,
        graded: value.graded,
        color: ['bg-brand-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500'][Math.abs(subject.length) % 4],
      }));
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      const matchesTab = currentTab === 'all' || (currentTab === 'graded' && item.status === 'Graded') || (currentTab === 'pending' && item.status !== 'Graded');
      const matchesSubject = !subjectFilter || item.classCourseName === subjectFilter;
      const matchesSearch = !searchTerm || item.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSubject && matchesSearch;
    });
  }, [submissions, currentTab, subjectFilter, searchTerm]);

  const subjectOptions = useMemo(() => Array.from(new Set(submissions.map((item) => item.classCourseName))), [submissions]);
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  const pagedSubmissions = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredSubmissions.slice(start, start + pageSize);
  }, [filteredSubmissions, pageIndex, pageSize]);

  return (
    <AppShell role="Student" breadcrumb="Student / Submissions">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">My Submissions</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">TOTAL SUBMISSIONS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12a10 10 0 1 1-4-8"/><path d="M22 4 12 14.01l-3-3"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{statusCounts.all}</p>
            <p className="text-xs text-slate-400 mt-1">This term</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">GRADED</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{statusCounts.graded}</p>
            <p className="text-xs text-slate-400 mt-1">Marks received</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">AWAITING GRADE</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{statusCounts.pending}</p>
            <p className="text-xs text-slate-400 mt-1">Submitted, not graded yet</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">OVERALL AVERAGE</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{averageGrade}%</p>
            <p className="text-xs text-slate-400 mt-1">Across all graded work</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'graded', 'pending'] as const).map((status) => (
              <Button
                key={status}
                type="button"
                variant={currentTab === status ? 'primary' : 'ghost'}
                onClick={() => setCurrentTab(status)}
                className={`tab cursor-pointer px-4 py-2 text-sm font-semibold transition ${currentTab === status ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                {status === 'all' ? 'All' : status === 'graded' ? 'Graded' : 'Awaiting grade'}
                <span className="opacity-70 font-normal"> {statusCounts[status]}</span>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All classes</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <div className="relative w-56">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search submissions…"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">ASSIGNMENT</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">CLASS / GROUP</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">SUBMITTED</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">MARKS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-6 text-sm text-slate-500">Loading submissions…</td></tr>
              ) : pagedSubmissions.length ? pagedSubmissions.map((submission) => (
                <tr
                  key={submission.id}
                  onClick={() => router.push(`/roles/student/submissions/${submission.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/roles/student/submissions/${submission.id}`);
                    }
                  }}
                  tabIndex={0}
                  className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{submission.assignmentTitle}</td>
                  <td className="px-2 py-3.5 text-slate-500">
                    <span>{submission.classCourseName || '—'}</span>
                    {submission.classCourseSection ? <span className="block text-xs text-slate-400">Section {submission.classCourseSection}{submission.groupName ? ` · ${submission.groupName}` : ''}</span> : null}
                  </td>
                  <td className="px-2 py-3.5 text-slate-500">{new Date(submission.submittedAt).toLocaleString()}</td>
                  <td className="px-2 py-3.5">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${submission.status === 'Graded' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                      {submission.status === 'Graded' ? 'Graded' : 'Awaiting grade'}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 font-semibold text-slate-700">{submission.marks ?? '—'} / {submission.maxMarks ?? '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-5 py-6 text-sm text-slate-500">No submissions found.</td></tr>
              )}
            </tbody>
          </table>
          {!loading && (
            <AmsPagination
              currentPage={pageIndex}
              pageSize={pageSize}
              totalItems={filteredSubmissions.length}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
              label="Showing"
              itemLabel="submissions"
            />
          )}
        </div>

      </div>
    </AppShell>
  );
}
