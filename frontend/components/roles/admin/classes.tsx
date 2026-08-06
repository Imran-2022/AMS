"use client";

import { useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../../layout/AppShell';
import type { ClassRecord, SubjectRecord } from './types';

const INITIAL_TEACHERS = [
  { id: 1, name: 'Rafiul Islam' },
  { id: 2, name: 'Farzana Karim' },
];

const INITIAL_CLASSES: ClassRecord[] = [
  { id: 1, name: 'Class 9', section: 'A', year: '2026', subjects: 3, students: 28 },
  { id: 2, name: 'Class 10', section: 'B', year: '2026', subjects: 2, students: 24 },
];

const INITIAL_SUBJECTS: SubjectRecord[] = [
  { id: 1, name: 'Mathematics', code: 'MTH-101', cls: 'Class 9 — A', teacher: 'Rafiul Islam' },
  { id: 2, name: 'Physics', code: 'PHY-101', cls: 'Class 9 — A', teacher: 'Farzana Karim' },
  { id: 3, name: 'English', code: 'ENG-101', cls: 'Class 10 — B', teacher: 'Farzana Karim' },
  { id: 4, name: 'Chemistry', code: 'CHM-101', cls: 'Class 10 — B', teacher: 'Unassigned' },
];

export function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>(INITIAL_CLASSES);
  const [subjects, setSubjects] = useState<SubjectRecord[]>(INITIAL_SUBJECTS);
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'class' | 'subject' | 'assign' | 'delete' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: 'class' | 'subject'; label: string } | null>(null);
  const [classForm, setClassForm] = useState({ name: '', section: '', year: '2026' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', cls: 'Class 9 — A', teacher: 'Unassigned' });
  const [assignForm, setAssignForm] = useState({ subjectId: 4, teacher: 'Rafiul Islam' });

  const teacherOptions = useMemo(() => INITIAL_TEACHERS.map((teacher) => teacher.name), []);
  const classOptions = useMemo(() => classes.map((cls) => `${cls.name} — ${cls.section}`), [classes]);

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesClass = selectedClass === 'All classes' || subject.cls === selectedClass;
      const matchesSearch =
        !term ||
        subject.name.toLowerCase().includes(term) ||
        subject.code.toLowerCase().includes(term) ||
        subject.cls.toLowerCase().includes(term) ||
        subject.teacher.toLowerCase().includes(term);
      return matchesClass && matchesSearch;
    });
  }, [search, selectedClass, subjects]);

  function openModal(modal: 'class' | 'subject' | 'assign') {
    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
  }

  function handleDelete(type: 'class' | 'subject', id: number, label: string) {
    setDeleteTarget({ id, type, label });
    setActiveModal('delete');
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'class') {
      setClasses((current) => current.filter((cls) => `${cls.name} — ${cls.section}` !== deleteTarget.label));
      setSubjects((current) => current.filter((subject) => subject.cls !== deleteTarget.label));
    } else {
      setSubjects((current) => current.filter((subject) => subject.id !== deleteTarget.id));
    }
    closeModal();
  }

  function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClasses((current) => [
      ...current,
      {
        id: Date.now(),
        name: classForm.name,
        section: classForm.section,
        year: classForm.year,
        subjects: 0,
        students: 0,
      },
    ]);
    setClassForm({ name: '', section: '', year: '2026' });
    closeModal();
  }

  function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubjects((current) => [
      ...current,
      {
        id: Date.now(),
        name: subjectForm.name,
        code: subjectForm.code,
        cls: subjectForm.cls,
        teacher: subjectForm.teacher,
      },
    ]);
    setSubjectForm({ name: '', code: '', cls: classOptions[0] ?? 'Class 9 — A', teacher: 'Unassigned' });
    closeModal();
  }

  function handleAssignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === assignForm.subjectId ? { ...subject, teacher: assignForm.teacher } : subject
      )
    );
    closeModal();
  }

  const subjectSelectOptions = subjects.map((subject) => ({
    id: subject.id,
    label: `${subject.name} — ${subject.cls}${subject.teacher === 'Unassigned' ? ' (unassigned)' : ''}`,
  }));

  return (
    <AppShell role="Admin" breadcrumb="Admin / Classes & subjects">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Classes &amp; subjects</h1>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">Class roster</p>
              <p className="text-xs text-slate-400 mt-0.5">Manage classes and see enrollment at a glance.</p>
            </div>
            <button onClick={() => openModal('class')} className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-800">{cls.name} — {cls.section}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {cls.year}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete('class', cls.id, `${cls.name} — ${cls.section}`)} className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                  <p><span className="font-bold text-slate-900">{cls.subjects}</span> subjects</p>
                  <p><span className="font-bold text-slate-900">{cls.students}</span> students</p>
                </div>
              </div>
            ))}

            <button onClick={() => openModal('class')} className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 flex flex-col items-center justify-center gap-2 py-8 text-slate-400 hover:text-brand-500 transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span className="text-xs font-semibold">Add another class</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Subjects &amp; teacher assignments</p>
              <p className="text-xs text-slate-400 mt-0.5">Manage subject ownership and teacher alignment.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => openModal('subject')} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Add subject</button>
              <button onClick={() => openModal('assign')} className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Assign teacher</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
              <option>All classes</option>
              {classOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <div className="relative flex-1 max-w-xs ml-auto">
              <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search subjects…" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500" />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">SUBJECT</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">CODE</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">CLASS</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">TEACHER</th>
                  <th className="w-20 px-5 py-3.5 text-right text-[11px] font-bold tracking-widest text-slate-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">{subject.name}</td>
                    <td className="px-2 py-3.5 text-slate-500 font-mono text-xs">{subject.code}</td>
                    <td className="px-2 py-3.5 text-slate-500">{subject.cls}</td>
                    <td className="px-2 py-3.5">
                      {subject.teacher === 'Unassigned' ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Unassigned
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                            {subject.teacher.split(' ').map((p) => p[0]).join('')}
                          </div>
                          <span className="text-slate-600">{subject.teacher}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleDelete('subject', subject.id, `${subject.name} — ${subject.cls}`)} className="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 inline-flex items-center justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-600">1–{filteredSubjects.length}</span> of <span className="font-semibold text-slate-600">{filteredSubjects.length}</span> subjects</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${activeModal === 'class' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">Add class</h2>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleCreateClass} className="px-7 py-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class name <span className="text-rose-500">*</span></label>
                <input value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} placeholder="e.g. Class 9" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Section <span className="text-rose-500">*</span></label>
                <input value={classForm.section} onChange={(event) => setClassForm({ ...classForm, section: event.target.value })} placeholder="e.g. A" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Academic year</label>
              <select value={classForm.year} onChange={(event) => setClassForm({ ...classForm, year: event.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                <option>2026 – 2027</option>
                <option>2025 – 2026</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Create class</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${activeModal === 'subject' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">Add subject</h2>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleCreateSubject} className="px-7 py-6 space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject name <span className="text-rose-500">*</span></label>
              <input value={subjectForm.name} onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })} placeholder="e.g. Mathematics" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject code <span className="text-rose-500">*</span></label>
                <input value={subjectForm.code} onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })} placeholder="e.g. MTH-101" className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                <select value={subjectForm.cls} onChange={(event) => setSubjectForm({ ...subjectForm, cls: event.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                  {classOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Teacher <span className="text-slate-400 font-normal">(optional — assign later)</span></label>
              <select value={subjectForm.teacher} onChange={(event) => setSubjectForm({ ...subjectForm, teacher: event.target.value })} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                <option value="Unassigned">Unassigned</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Create subject</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${activeModal === 'assign' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">Assign teacher</h2>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleAssignTeacher} className="px-7 py-6 space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject <span className="text-rose-500">*</span></label>
              <select value={assignForm.subjectId} onChange={(event) => setAssignForm({ ...assignForm, subjectId: Number(event.target.value) })} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                {subjectSelectOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Teacher <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input value={assignForm.teacher} onChange={(event) => setAssignForm({ ...assignForm, teacher: event.target.value })} placeholder="Search teacher by name…" className="w-full rounded-2xl border border-slate-300 px-10 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Assign teacher</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${activeModal === 'delete' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">{deleteTarget?.type === 'class' ? 'Remove class?' : 'Remove subject?'}</h3>
          <p className="text-sm text-slate-500 mt-1.5"><span className="font-semibold text-slate-700">{deleteTarget?.label}</span> <span className="text-slate-500">{deleteTarget?.type === 'class' ? 'will be removed, along with its subject and teacher assignments. Enrolled students will need to be reassigned.' : 'will be removed from this class. Any teacher assignment for it will also be cleared.'}</span></p>
          <div className="flex items-center gap-3 mt-6">
            <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">Remove</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
