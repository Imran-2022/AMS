"use client";

import { useMemo, useState, type ChangeEvent } from 'react';
import { FileText, Search, X } from 'lucide-react';
import { AppShell } from '../../layout/AppShell';

type SubmissionStatus = 'Pending review' | 'Graded' | 'Missing';
type StatusFilter = 'all' | 'pending' | 'graded' | 'missing';

type SubmissionRecord = {
  id: number;
  student: string;
  initials: string;
  assignment: string;
  submittedAt: string;
  status: SubmissionStatus;
  className: string;
  section: string;
  marks?: number;
  maxMarks: number;
  feedback?: string;
  isLate?: boolean;
};

type GradeModalState = SubmissionRecord | null;

const initialSubmissions: SubmissionRecord[] = [
  {
    id: 1,
    student: 'Ayesha Rahman',
    initials: 'AR',
    assignment: 'Algebraic Expressions — Set 4',
    submittedAt: 'Aug 9, 2026 · 6:40 PM',
    status: 'Pending review',
    className: 'Class 9',
    section: 'A',
    maxMarks: 20,
    isLate: false,
  },
  {
    id: 2,
    student: 'Karim Hasan',
    initials: 'KH',
    assignment: 'Algebraic Expressions — Set 4',
    submittedAt: 'Aug 11, 2026 · 1:20 AM',
    status: 'Pending review',
    className: 'Class 9',
    section: 'A',
    maxMarks: 20,
    isLate: true,
  },
  {
    id: 3,
    student: 'Nusrat Farah',
    initials: 'NF',
    assignment: "Newton's Laws Lab Report",
    submittedAt: 'Aug 6, 2026 · 4:02 PM',
    status: 'Graded',
    className: 'Class 9',
    section: 'A',
    marks: 22,
    maxMarks: 25,
    feedback: 'Solid lab write-up. Add more detail on your error analysis next time.',
    isLate: false,
  },
  {
    id: 4,
    student: 'Sadia Akter',
    initials: 'SA',
    assignment: 'Algebraic Expressions — Set 4',
    submittedAt: 'Aug 9, 2026 · 8:15 PM',
    status: 'Pending review',
    className: 'Class 9',
    section: 'A',
    maxMarks: 20,
    isLate: false,
  },
  {
    id: 5,
    student: 'Tanvir Islam',
    initials: 'TI',
    assignment: "Newton's Laws Lab Report",
    submittedAt: 'Not submitted',
    status: 'Missing',
    className: 'Class 9',
    section: 'A',
    maxMarks: 25,
    isLate: false,
  },
];

const statusStyles: Record<SubmissionStatus, string> = {
  'Pending review': 'bg-amber-50 text-amber-600',
  Graded: 'bg-emerald-50 text-emerald-600',
  Missing: 'bg-rose-50 text-rose-600',
};

const statusDotStyles: Record<SubmissionStatus, string> = {
  'Pending review': 'bg-amber-500',
  Graded: 'bg-emerald-500',
  Missing: 'bg-rose-500',
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[status]}`}>
      <span className={`h-2 w-2 rounded-full ${statusDotStyles[status]}`} />
      {status}
    </span>
  );
}

export function TeacherSubmissionsPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('All assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeModal, setGradeModal] = useState<GradeModalState>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'graded' | 'needs_revision' | 'excused' | 'pending'>('graded');

  const stats = useMemo(() => {
    const total = initialSubmissions.length;
    const pending = initialSubmissions.filter((item) => item.status === 'Pending review').length;
    const graded = initialSubmissions.filter((item) => item.status === 'Graded').length;
    const missing = initialSubmissions.filter((item) => item.status === 'Missing').length;

    return { total, pending, graded, missing };
  }, []);

  const visibleSubmissions = useMemo(() => {
    return initialSubmissions.filter((submission) => {
      const matchesTab = activeTab === 'all' || (activeTab === 'pending' && submission.status === 'Pending review') || (activeTab === 'graded' && submission.status === 'Graded') || (activeTab === 'missing' && submission.status === 'Missing');
      const matchesClass = !classFilter || submission.className === classFilter;
      const matchesSection = !sectionFilter || submission.section === sectionFilter;
      const matchesAssignment = assignmentFilter === 'All assignments' || submission.assignment === assignmentFilter;
      const matchesSearch = [submission.student, submission.assignment].join(' ').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesClass && matchesSection && matchesAssignment && matchesSearch;
    });
  }, [activeTab, assignmentFilter, classFilter, searchTerm, sectionFilter]);

  const availableSections = useMemo(() => {
    const sections = initialSubmissions.filter((submission) => !classFilter || submission.className === classFilter).map((submission) => submission.section);
    return ['A', 'B'].filter((section) => sections.includes(section));
  }, [classFilter]);

  const openGradeModal = (submission: SubmissionRecord) => {
    setGradeModal(submission);
    setMarks(submission.marks?.toString() ?? '');
    setFeedback(submission.feedback ?? '');
    setStatus(submission.status === 'Missing' ? 'excused' : submission.status === 'Graded' ? 'graded' : 'pending');
  };

  const closeGradeModal = () => {
    setGradeModal(null);
  };

  const handleClassChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextClass = event.target.value;
    setClassFilter(nextClass);
    setSectionFilter('');
  };

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Submissions">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold tracking-[0.24em] text-brand-600">TEACHER PORTAL</p>
          <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">Submissions Review &amp; Grading</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">TOTAL SUBMISSIONS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.total}</p>
            <p className="mt-1 text-xs text-slate-400">Across your assignments</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">PENDING REVIEW</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.pending}</p>
            <p className="mt-1 text-xs text-slate-400">Needs marks &amp; feedback</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">GRADED</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.graded}</p>
            <p className="mt-1 text-xs text-slate-400">Marks entered</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">MISSING</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{stats.missing}</p>
            <p className="mt-1 text-xs text-slate-400">Never submitted, past deadline</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setActiveTab('all')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'all' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              All <span className="ml-1 font-normal opacity-70">{stats.total}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('pending')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'pending' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Pending <span className="ml-1 font-normal opacity-70">{stats.pending}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('graded')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'graded' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Graded <span className="ml-1 font-normal opacity-70">{stats.graded}</span>
            </button>
            <button type="button" onClick={() => setActiveTab('missing')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${activeTab === 'missing' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Missing <span className="ml-1 font-normal opacity-70">{stats.missing}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <select value={classFilter} onChange={handleClassChange} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              <option value="">All classes</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>
            <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              <option value="">All sections</option>
              {availableSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600">
              <option value="All assignments">All assignments</option>
              <option value="Algebraic Expressions — Set 4">Algebraic Expressions — Set 4</option>
              <option value="Newton's Laws Lab Report">Newton's Laws Lab Report</option>
            </select>
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search by student…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500" />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3.5 text-[11px] font-bold tracking-[0.24em] text-slate-400">STUDENT</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-[0.24em] text-slate-400">ASSIGNMENT</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-[0.24em] text-slate-400">SUBMITTED</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-[0.24em] text-slate-400">STATUS</th>
                <th className="px-2 py-3.5 text-[11px] font-bold tracking-[0.24em] text-slate-400">MARKS</th>
                <th className="w-28 px-5 py-3.5 text-right text-[11px] font-bold tracking-[0.24em] text-slate-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {submission.initials}
                      </div>
                      <span className="font-semibold text-slate-700">{submission.student}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-slate-500">{submission.assignment}</td>
                  <td className={`px-2 py-3.5 ${submission.status === 'Missing' ? 'text-slate-400 italic' : 'text-slate-500'}`}>{submission.submittedAt}</td>
                  <td className="px-2 py-3.5">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-2 py-3.5 text-slate-600">
                    {submission.status === 'Graded' ? `${submission.marks} / ${submission.maxMarks}` : `— / ${submission.maxMarks}`}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button type="button" onClick={() => openGradeModal(submission)} className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${submission.status === 'Missing' ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
                      {submission.status === 'Missing' ? 'Mark excused' : submission.status === 'Graded' ? 'View' : 'Grade'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">1–{visibleSubmissions.length}</span> of <span className="font-semibold text-slate-600">{stats.total}</span> submissions
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-300" disabled>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white">1</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50">2</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50">3</span>
              <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={closeGradeModal}>
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {gradeModal.initials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{gradeModal.student}</h2>
                  <p className="text-sm text-slate-400">{gradeModal.assignment}</p>
                </div>
              </div>
              <button type="button" onClick={closeGradeModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 overflow-y-auto px-7 py-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 block text-[13px] font-semibold text-slate-800">Submitted work</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">worksheet_answers.pdf</p>
                      <p className="text-xs text-slate-400">2.4 MB · {gradeModal.status === 'Graded' ? 'uploaded on time' : 'uploaded recently'}</p>
                    </div>
                  </div>
                  <button type="button" className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Open attachment
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-400">Student comment: “Struggled a bit with question 6, let me know if my approach was right.”</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Marks <span className="text-rose-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input value={marks} onChange={(event) => setMarks(event.target.value)} type="number" placeholder="0" className="w-24 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                    <span className="text-sm text-slate-400">/ {gradeModal.maxMarks}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Feedback for student</label>
                  <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Add comments on their work…" className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Submission status</label>
                  <select value={status} onChange={(event) => setStatus(event.target.value as 'graded' | 'needs_revision' | 'excused' | 'pending')} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                    <option value="graded">Graded</option>
                    <option value="needs_revision">Needs revision — ask to resubmit</option>
                    <option value="excused">Excused — no penalty</option>
                    <option value="pending">Leave as pending review</option>
                  </select>
                  <p className="mt-2 text-xs text-slate-400">Changing status notifies the student automatically.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-3xl border-t border-slate-100 bg-slate-50/60 px-7 py-5">
              <button type="button" onClick={closeGradeModal} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={closeGradeModal} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Save &amp; notify student
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
