"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, BookOpen, ClipboardList, Copy, FileText, Layers, Pencil, Plus, Search, Send, Trash2, Eye } from 'lucide-react';
import { AppShell } from '../../layout/AppShell';
import { Button, FileUpload } from '../../ui';
import { ASSIGNMENTS, SUBMISSIONS } from '../../data';

type AssignmentStatus = 'Published' | 'Draft';
type FilterState = 'all' | 'published' | 'drafts';

type AssignmentRecord = {
  id: number;
  title: string;
  subject: string;
  cls: string;
  section: string;
  teacher: string;
  deadline: string;
  maxMarks: number;
  status: AssignmentStatus;
  submissions: number;
  total: number;
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
};

type AssignmentFormValues = {
  title: string;
  description: string;
  className: string;
  section: string;
  subject: string;
  deadline: string;
  maxMarks: string;
  attachmentUrl: string;
  attachmentName: string;
};

const createEmptyForm = (): AssignmentFormValues => ({
  title: '',
  description: '',
  className: 'Class 9 - A',
  section: 'A',
  subject: 'Mathematics',
  deadline: '',
  maxMarks: '20',
  attachmentUrl: '',
  attachmentName: '',
});

const teacherAssignmentsSeed: AssignmentRecord[] = (ASSIGNMENTS.filter((assignment) => assignment.teacher === 'Rafiul Islam') as Array<{
  id: number;
  title: string;
  subject: string;
  cls: string;
  teacher: string;
  deadline: string;
  maxMarks: number;
  status: AssignmentStatus;
  submissions: number;
  total: number;
}>).map((assignment) => ({
  ...assignment,
  section: assignment.cls.includes(' - ') ? assignment.cls.split(' - ')[1] : 'A',
  description:
    assignment.title === 'Algebraic Expressions — Set 4'
      ? 'Solve the attached worksheet covering factoring and expansion of algebraic expressions.'
      : assignment.title === 'Quadratic Equations — Quiz'
        ? '15-question quiz on solving quadratic equations by factoring and the quadratic formula.'
        : 'Draft assignment details will appear here once the teacher adds them.',
}));

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

export function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>(teacherAssignmentsSeed);
  const [filter, setFilter] = useState<FilterState>('all');
  const [classFilter, setClassFilter] = useState('All classes');
  const [sectionFilter, setSectionFilter] = useState('All sections');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentRecord | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AssignmentRecord | null>(null);
  const [form, setForm] = useState<AssignmentFormValues>(createEmptyForm());

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesFilter =
        filter === 'all' || (filter === 'published' && assignment.status === 'Published') || (filter === 'drafts' && assignment.status === 'Draft');
      const matchesClass = classFilter === 'All classes' || assignment.cls === classFilter;
      const matchesSection = sectionFilter === 'All sections' || assignment.section === sectionFilter;
      const matchesSubject = subjectFilter === 'All subjects' || assignment.subject === subjectFilter;
      const matchesSearch = [assignment.title, assignment.subject, assignment.cls]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesFilter && matchesClass && matchesSection && matchesSubject && matchesSearch;
    });
  }, [assignments, classFilter, filter, searchTerm, sectionFilter, subjectFilter]);

  const stats = useMemo(() => {
    const published = assignments.filter((assignment) => assignment.status === 'Published').length;
    const drafts = assignments.length - published;
    const pendingReviews = SUBMISSIONS.filter((submission) => ['Submitted', 'Late', 'Resubmission requested'].includes(submission.status)).length;

    return {
      total: assignments.length,
      published,
      drafts,
      pendingReviews,
    };
  }, [assignments]);

  const availableClasses = useMemo(() => ['All classes', ...Array.from(new Set(assignments.map((assignment) => assignment.cls)))], [assignments]);
  const availableSections = useMemo(() => ['All sections', ...Array.from(new Set(assignments.map((assignment) => assignment.section)))], [assignments]);
  const availableSubjects = useMemo(() => ['All subjects', ...Array.from(new Set(assignments.map((assignment) => assignment.subject)))], [assignments]);

  const openCreateModal = (assignment?: AssignmentRecord) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setForm({
        title: assignment.title,
        description: assignment.description,
        className: assignment.cls,
        section: assignment.section,
        subject: assignment.subject,
        deadline: assignment.deadline,
        maxMarks: String(assignment.maxMarks),
        attachmentUrl: assignment.attachmentUrl ?? '',
        attachmentName: assignment.attachmentName ?? '',
      });
    } else {
      setEditingAssignment(null);
      setForm(createEmptyForm());
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAssignment(null);
    setForm(createEmptyForm());
  };

  const handleSave = (status: AssignmentStatus) => {
    if (!form.title.trim() || !form.description.trim() || !form.deadline.trim()) {
      return;
    }

    const nextAssignment: AssignmentRecord = {
      id: editingAssignment?.id ?? Date.now(),
      title: form.title.trim(),
      subject: form.subject,
      cls: form.className,
      section: form.section,
      teacher: 'Rafiul Islam',
      deadline: form.deadline,
      maxMarks: Number(form.maxMarks || 20),
      status,
      submissions: editingAssignment?.submissions ?? 0,
      total: editingAssignment?.total ?? 32,
      description: form.description.trim(),
      attachmentUrl: form.attachmentUrl,
      attachmentName: form.attachmentName,
    };

    setAssignments((current) => {
      if (editingAssignment) {
        return current.map((item) => (item.id === editingAssignment.id ? nextAssignment : item));
      }
      return [nextAssignment, ...current];
    });

    closeModal();
  };

  const handlePublishToggle = (assignment: AssignmentRecord) => {
    setAssignments((current) => current.map((item) => (item.id === assignment.id ? { ...item, status: item.status === 'Published' ? 'Draft' : 'Published' } : item)));
    setOpenMenuId(null);
  };

  const handleDuplicate = (assignment: AssignmentRecord) => {
    const duplicate: AssignmentRecord = {
      ...assignment,
      id: Date.now(),
      title: `${assignment.title} (Copy)`,
      status: 'Draft',
      submissions: 0,
      total: assignment.total,
    };

    setAssignments((current) => [duplicate, ...current]);
    setOpenMenuId(null);
  };

  const confirmDelete = (assignment: AssignmentRecord) => {
    setPendingDelete(assignment);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = () => {
    if (!pendingDelete) return;
    setAssignments((current) => current.filter((assignment) => assignment.id !== pendingDelete.id));
    setDeleteModalOpen(false);
    setPendingDelete(null);
  };

  const handleClassChange = (nextClass: string) => {
    const nextSection = nextClass === 'Class 10 - B' ? 'B' : 'A';
    setForm((current) => ({
      ...current,
      className: nextClass,
      section: nextSection,
      subject: nextClass === 'Class 10 - B' ? 'Mathematics' : current.subject,
    }));
  };

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My Assignments">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-600">Teacher portal</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">My Assignments</h1>
            <p className="mt-1 text-sm text-slate-500">Create, publish, edit, and track every assignment in one place.</p>
          </div>
          <Button onClick={() => openCreateModal()} className="min-w-[190px]">
            <Plus className="h-4 w-4" />
            Create assignment
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total" value={stats.total} sub="Created by you" icon={<ClipboardList className="h-4 w-4" />} />
          <StatCard label="Published" value={stats.published} sub="Visible to students" icon={<BookOpen className="h-4 w-4" />} />
          <StatCard label="Drafts" value={stats.drafts} sub="Still being prepared" icon={<FileText className="h-4 w-4" />} />
          <StatCard label="Needs grading" value={stats.pendingReviews} sub="Submissions awaiting marks" icon={<Layers className="h-4 w-4" />} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setFilter('all')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                All <span className="ml-1 font-normal opacity-70">{stats.total}</span>
              </button>
              <button type="button" onClick={() => setFilter('published')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === 'published' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Published <span className="ml-1 font-normal opacity-70">{stats.published}</span>
              </button>
              <button type="button" onClick={() => setFilter('drafts')} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === 'drafts' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Drafts <span className="ml-1 font-normal opacity-70">{stats.drafts}</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500">
                {availableClasses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500">
                {availableSections.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500">
                {availableSubjects.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search assignments…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>
        </div>

        {visibleAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <ClipboardList className="h-7 w-7" />
            </div>
            <p className="text-base font-bold text-slate-800">No assignments yet</p>
            <p className="mt-2 max-w-md text-sm text-slate-500">Create your first assignment for one of your classes. You can save it as a draft and publish when ready.</p>
            <Button onClick={() => openCreateModal()} className="mt-5">
              <Plus className="h-4 w-4" />
              Create assignment
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{assignment.title}</p>
                      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${assignment.status === 'Published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {assignment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">{assignment.cls} · {assignment.subject} · Max marks: {assignment.maxMarks}</p>
                    <p className="mt-3 text-sm text-slate-600">{assignment.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-500">Due: {assignment.deadline}</span>
                      {assignment.attachmentName && (
                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">Attachment: {assignment.attachmentName}</span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.round((assignment.submissions / assignment.total) * 100))}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-slate-500">{assignment.submissions} / {assignment.total} submitted</span>
                    </div>
                  </div>

                  <div className="relative xl:shrink-0">
                    <button type="button" onClick={(event) => { event.stopPropagation(); setOpenMenuId(openMenuId === assignment.id ? null : assignment.id); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100" data-menu-trigger="true">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                    </button>
                    {openMenuId === assignment.id && (
                      <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => openCreateModal(assignment)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button type="button" onClick={() => {}} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Eye className="h-4 w-4" /> View submissions
                        </button>
                        <button type="button" onClick={() => handleDuplicate(assignment)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Copy className="h-4 w-4" /> Duplicate
                        </button>
                        <button type="button" onClick={() => handlePublishToggle(assignment)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Send className="h-4 w-4" /> {assignment.status === 'Published' ? 'Unpublish' : 'Publish now'}
                        </button>
                        <button type="button" onClick={() => confirmDelete(assignment)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{editingAssignment ? 'Edit assignment' : 'Create assignment'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Fill in the details, then save as a draft or publish.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-5 px-7 py-6">
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Title <span className="text-rose-500">*</span></label>
                  <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} type="text" placeholder="e.g. Algebraic Expressions — Set 4" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Description <span className="text-rose-500">*</span></label>
                  <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} placeholder="Instructions for students…" className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Class <span className="text-rose-500">*</span></label>
                    <select value={form.className} onChange={(event) => handleClassChange(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                      <option>Class 9 - A</option>
                      <option>Class 10 - B</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Section <span className="text-rose-500">*</span></label>
                    <select value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                      {form.className === 'Class 10 - B' ? <option value="B">B</option> : <option value="A">A</option>}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Subject <span className="text-rose-500">*</span></label>
                    <select value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                      {form.className === 'Class 10 - B' ? (
                        <option>Mathematics</option>
                      ) : (
                        <>
                          <option>Mathematics</option>
                          <option>Physics</option>
                          <option>English</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Deadline <span className="text-rose-500">*</span></label>
                    <input value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} type="datetime-local" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Max marks <span className="text-rose-500">*</span></label>
                    <input value={form.maxMarks} onChange={(event) => setForm((current) => ({ ...current, maxMarks: event.target.value }))} type="number" placeholder="e.g. 20" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Attachment <span className="text-slate-400 font-normal">(optional)</span></label>
                  <FileUpload onFileUploaded={(url, name) => setForm((current) => ({ ...current, attachmentUrl: url, attachmentName: name }))} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-3xl border-t border-slate-100 bg-slate-50/80 px-7 py-5">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" onClick={() => handleSave('Draft')}>Save as draft</Button>
                  <Button type="button" onClick={() => handleSave('Published')}>Publish</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteModalOpen && pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Delete this assignment?</h3>
              <p className="mt-2 text-sm text-slate-500">{pendingDelete.title} will be permanently deleted. This can’t be undone.</p>
              <div className="mt-6 flex items-center gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => { setDeleteModalOpen(false); setPendingDelete(null); }}>Cancel</Button>
                <Button type="button" variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
