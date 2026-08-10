"use client";

import { useEffect, useMemo, useState } from 'react';
import { AmsPagination } from '../../ui';
import { AppShell } from '../../layout/AppShell';
import { getMySubmissions, type SubmissionDto } from '@/lib/api';

export function StudentSubmissionsPage() {
  const [currentTab, setCurrentTab] = useState<'all' | 'graded' | 'pending'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);

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
    const graded = submissions.filter((item) => item.status === 'Graded' && typeof item.marks === 'number');
    if (!graded.length) return 0;
    return Math.round(graded.reduce((sum, item) => sum + (item.marks ?? 0), 0) / graded.length);
  }, [submissions]);

  const subjectStats = useMemo(() => {
    const grouped = new Map<string, { total: number; graded: number; marks: number[] }>();
    submissions.forEach((item) => {
      const subject = item.classCourseName || 'General';
      const entry = grouped.get(subject) ?? { total: 0, graded: 0, marks: [] };
      entry.total += 1;
      if (item.status === 'Graded') {
        entry.graded += 1;
        if (typeof item.marks === 'number') entry.marks.push(item.marks);
      }
      grouped.set(subject, entry);
    });

    return Array.from(grouped.entries())
      .slice(0, 4)
      .map(([subject, value]) => ({
        subject,
        ratio: value.graded ? Math.min(100, Math.round((value.marks.reduce((sum, mark) => sum + mark, 0) / (value.graded * 100)) * 100)) : 0,
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

  const openView = (submission: SubmissionDto) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

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

        <div>
          <p className="text-sm font-bold text-slate-700 mb-3">Class performance</p>
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
                <p className="text-[11px] text-slate-400 mt-2">{subject.graded} graded</p>
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
              <option value="">All classes</option>
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
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">ASSIGNMENT</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">CLASS</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">SUBMITTED</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">MARKS</th>
                <th className="w-24 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-6 text-sm text-slate-500">Loading submissions…</td></tr>
              ) : pagedSubmissions.length ? pagedSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-700">{submission.assignmentTitle}</td>
                  <td className="px-2 py-3.5 text-slate-500">{submission.classCourseName || '—'}</td>
                  <td className="px-2 py-3.5 text-slate-500">{new Date(submission.submittedAt).toLocaleString()}</td>
                  <td className="px-2 py-3.5">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${submission.status === 'Graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${submission.status === 'Graded' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                      {submission.status === 'Graded' ? 'Graded' : 'Awaiting grade'}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 font-semibold text-slate-700">{submission.status === 'Graded' ? `${submission.marks ?? 0}` : '—'}</td>
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
              )) : (
                <tr><td colSpan={6} className="px-5 py-6 text-sm text-slate-500">No submissions found.</td></tr>
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

        {modalOpen && selectedSubmission ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{selectedSubmission.assignmentTitle}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{selectedSubmission.classCourseName || 'Course'} · {selectedSubmission.classCourseSection || 'Section'}</p>
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
                        <p className="text-xs font-bold text-emerald-600">YOUR GRADE</p>
                        <p className="text-2xl font-extrabold text-slate-800 mt-1">{selectedSubmission.marks ?? 0} <span className="text-slate-400 font-normal text-base">/ 100</span></p>
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
