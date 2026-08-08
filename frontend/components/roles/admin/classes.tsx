"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../../layout/AppShell';
import {
  createClassCourse,
  updateClassCourse,
  createSubject,
  updateSubject,
  deleteClassCourse,
  deleteSubject,
  getClassCourses,
  getSubjects,
  getUsers,
} from '@/lib/api';
import { getEnrollments } from '@/lib/api/enrollments';
import { createTeacherAssignment, deleteTeacherAssignment, getTeacherAssignments } from '@/lib/api/teacherAssignments';
import type { ClassCourseDto, SubjectDto, UserDto } from '@/lib/api';
import type { TeacherSubjectAssignmentDto } from '@/lib/api/teacherAssignments';

export function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [assignments, setAssignments] = useState<TeacherSubjectAssignmentDto[]>([]);
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'class' | 'subject' | 'assign' | 'delete' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'class' | 'subject'; label: string } | null>(null);
  const [classForm, setClassForm] = useState({ name: '', section: '', year: '2026 – 2027' });
  const [editingClass, setEditingClass] = useState<ClassCourseDto | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classCourseId: '', teacherId: '' });
  const [editingSubject, setEditingSubject] = useState<SubjectDto | null>(null);
  const [assignForm, setAssignForm] = useState({ subjectId: '', teacherId: '' });
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classStudentCountsState, setClassStudentCountsState] = useState<Record<string, number>>({});

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (classes.length && !subjectForm.classCourseId) {
      setSubjectForm((current) => ({ ...current, classCourseId: classes[0].id }));
    }
  }, [classes, subjectForm.classCourseId]);

  useEffect(() => {
    if (subjects.length && !assignForm.subjectId) {
      setAssignForm((current) => ({ ...current, subjectId: subjects[0].id }));
    }
  }, [subjects, assignForm.subjectId]);

  useEffect(() => {
    if (teachers.length && !assignForm.teacherId) {
      setAssignForm((current) => ({ ...current, teacherId: teachers[0].id }));
    }
  }, [teachers, assignForm.teacherId]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!actionMenuFor) return;
      const target = event.target as Node;
      const menuEl = document.querySelector(`[data-action-menu="${actionMenuFor}"]`);
      const btnEl = document.querySelector(`[data-action-button="${actionMenuFor}"]`);
      if (menuEl?.contains(target) || btnEl?.contains(target)) return;
      setActionMenuFor(null);
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [actionMenuFor]);

  async function loadData() {
    try {
      setError(null);
      const [apiClasses, apiSubjects, apiUsers, apiAssignments, apiEnrollments] = await Promise.all([
        getClassCourses(),
        getSubjects(),
        getUsers(),
        getTeacherAssignments(),
        getEnrollments(),
      ]);

      setClasses(apiClasses);
      setSubjects(apiSubjects);
      setTeachers(apiUsers.filter((user) => user.role === 'Teacher'));
      setAssignments(apiAssignments);

      // build enrollment counts per class
      const enrollmentCounts = apiEnrollments.reduce<Record<string, number>>((acc, e) => {
        acc[e.classCourseId] = (acc[e.classCourseId] ?? 0) + 1;
        return acc;
      }, {});
      // attach counts to classes state by replacing classes with enriched objects is not necessary; store counts locally
      // we'll compute classStudentCounts in a memo below
      // store enrollmentCounts via closure by setting a ref (simpler: compute classStudentCounts memo using apiEnrollments and setSubjects/classes)
      // For simplicity, set subjects/classes as before and compute counts later
      // Save enrollmentCounts to a local state? we'll compute via useMemo from classes and apiEnrollments stored in a ref — but to keep minimal, set a new state
      setClassStudentCountsState(enrollmentCounts);
    } catch (err) {
      console.error(err);
      setError('Unable to load class data. Please refresh the page.');
    }
  }

  function openModal(modal: 'class' | 'subject' | 'assign') {
    if (modal === 'class') {
      setEditingClass(null);
      setClassForm({ name: '', section: '', year: '2026 – 2027' });
    }

    if (modal === 'subject') {
      setEditingSubject(null);
      setSubjectForm({ name: '', code: '', classCourseId: classes[0]?.id ?? '', teacherId: '' });
    }

    if (modal === 'assign') {
      setAssignForm({ subjectId: subjects[0]?.id ?? '', teacherId: teachers[0]?.id ?? '' });
    }

    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
    setEditingSubject(null);
    setSubjectForm({ name: '', code: '', classCourseId: classes[0]?.id ?? '', teacherId: '' });
    setEditingClass(null);
    setClassForm({ name: '', section: '', year: '2026 – 2027' });
  }

  function handleDelete(type: 'class' | 'subject', id: string, label: string) {
    setActionMenuFor(null);
    setDeleteTarget({ id, type, label });
    setActiveModal('delete');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'class') {
        await deleteClassCourse(deleteTarget.id);
      } else {
        await deleteSubject(deleteTarget.id);
      }
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Unable to remove the item. Please try again.');
    } finally {
      closeModal();
    }
  }

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (editingClass) {
        await updateClassCourse(editingClass.id, {
          name: classForm.name,
          section: classForm.section,
          academicYear: classForm.year,
        });
      } else {
        await createClassCourse({
          name: classForm.name,
          section: classForm.section,
          academicYear: classForm.year,
        });
      }
      setClassForm({ name: '', section: '', year: classForm.year });
      setEditingClass(null);
      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Unable to create class. Please check the details and try again.');
    }
  }

  function openEditClass(cls: ClassCourseDto) {
    setEditingClass(cls);
    setClassForm({ name: cls.name, section: cls.section, year: cls.academicYear });
    setActiveModal('class');
  }

  async function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedTeacherId = subjectForm.teacherId?.trim();
    const classCourseId = subjectForm.classCourseId?.trim();

    if (!subjectForm.name.trim() || !subjectForm.code.trim() || !classCourseId) {
      alert('Please enter a valid subject name, code, and class before saving.');
      return;
    }

    if (selectedTeacherId && !teachers.some((teacher) => teacher.id === selectedTeacherId)) {
      alert('Selected teacher is not valid. Please choose a teacher from the list.');
      return;
    }

    try {
      let subjectId = editingSubject?.id;

      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          name: subjectForm.name,
          code: subjectForm.code,
          classCourseId,
        });

        subjectId = editingSubject.id;
        const currentAssignment = assignmentMap[editingSubject.id];

        if (selectedTeacherId) {
          if (currentAssignment?.teacherId !== selectedTeacherId || currentAssignment?.classCourseId !== classCourseId) {
            if (currentAssignment) {
              await deleteTeacherAssignment(currentAssignment.teacherId, editingSubject.id);
            }
            await createTeacherAssignment({
              teacherId: selectedTeacherId,
              subjectId: editingSubject.id,
              classCourseId,
            });
          }
        } else if (currentAssignment) {
          await deleteTeacherAssignment(currentAssignment.teacherId, editingSubject.id);
        }
      } else {
        const subject = await createSubject({
          name: subjectForm.name,
          code: subjectForm.code,
          classCourseId,
        });

        subjectId = subject.id;

        if (selectedTeacherId) {
          await createTeacherAssignment({
            teacherId: selectedTeacherId,
            subjectId,
            classCourseId,
          });
        }
      }

      setSubjectForm({ name: '', code: '', classCourseId: classes[0]?.id ?? '', teacherId: '' });
      setEditingSubject(null);
      await loadData();
      closeModal();
    } catch (err) {
      console.error('Subject save failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Unable to save subject. ${message}`);
    }
  }

  function openEditSubject(subject: SubjectDto) {
    setEditingSubject(subject);
    setSubjectForm({ name: subject.name, code: subject.code, classCourseId: subject.classCourseId, teacherId: assignmentMap[subject.id]?.teacherId ?? '' });
    setActiveModal('subject');
  }

  async function handleAssignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedTeacherId = assignForm.teacherId?.trim();
    const subject = subjects.find((item) => item.id === assignForm.subjectId);

    if (!subject) {
      alert('Please select a valid subject to assign.');
      return;
    }

    if (!selectedTeacherId || !teachers.some((teacher) => teacher.id === selectedTeacherId)) {
      alert('Please select a valid teacher to assign.');
      return;
    }

    try {
      await createTeacherAssignment({
        teacherId: selectedTeacherId,
        subjectId: subject.id,
        classCourseId: subject.classCourseId,
      });

      await loadData();
      closeModal();
    } catch (err) {
      console.error('Teacher assignment failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Unable to assign the teacher. ${message}`);
    }
  }

  const classCourseMap = useMemo(
    () => Object.fromEntries(classes.map((cls) => [cls.id, cls])) as Record<string, ClassCourseDto>,
    [classes]
  );

  const assignmentMap = useMemo(
    () => Object.fromEntries(assignments.map((assignment) => [assignment.subjectId, assignment])),
    [assignments]
  );

  const classOptions = useMemo(
    () => classes.map((cls) => ({ id: cls.id, label: `${cls.name} — ${cls.section}` })),
    [classes]
  );

  const teacherOptions = useMemo(
    () => teachers.map((teacher) => ({ id: teacher.id, label: teacher.fullName })),
    [teachers]
  );

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subjects.filter((subject) => {
      const course = classCourseMap[subject.classCourseId];
      const clsLabel = course ? `${course.name} — ${course.section}` : 'Unassigned';
      const teacherName = assignmentMap[subject.id]?.teacherName ?? 'Unassigned';
      const matchesClass = selectedClass === 'All classes' || clsLabel === selectedClass;
      const matchesSearch =
        !term ||
        subject.name.toLowerCase().includes(term) ||
        subject.code.toLowerCase().includes(term) ||
        clsLabel.toLowerCase().includes(term) ||
        teacherName.toLowerCase().includes(term);
      return matchesClass && matchesSearch;
    });
  }, [search, selectedClass, subjects, classCourseMap, assignmentMap]);

  const subjectSelectOptions = useMemo(
    () =>
      subjects.map((subject) => {
        const course = classCourseMap[subject.classCourseId];
        return {
          id: subject.id,
          label: `${subject.name} — ${course ? `${course.name} — ${course.section}` : 'Unassigned'}`,
        };
      }),
    [subjects, classCourseMap]
  );

  const classSubjectCounts = useMemo(
    () =>
      subjects.reduce<Record<string, number>>((acc, subject) => {
        acc[subject.classCourseId] = (acc[subject.classCourseId] ?? 0) + 1;
        return acc;
      }, {}),
    [subjects]
  );

  return (
    <AppShell role="Admin" breadcrumb="Admin / Classes & subjects">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Classes &amp; subjects</h1>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">Class roster</p>
              <p className="text-xs text-slate-400 mt-0.5">Manage classes and see enrollment at a glance.</p>
            </div>
            <button
              onClick={() => openModal('class')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
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
                        {cls.academicYear}
                      </span>
                    </div>
                  </div>
                  <div className="relative inline-flex">
                    <button
                      type="button"
                      data-action-button={`class-${cls.id}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setActionMenuFor(actionMenuFor === `class-${cls.id}` ? null : `class-${cls.id}`);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 inline-flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                    {actionMenuFor === `class-${cls.id}` ? (
                      <div
                        data-action-menu={`class-${cls.id}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
                      >
                        <button
                          type="button"
                          onClick={() => openEditClass(cls)}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Edit class
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete('class', cls.id, `${cls.name} — ${cls.section}`)}
                          className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50"
                        >
                          Delete class
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                  <p><span className="font-bold text-slate-900">{classSubjectCounts[cls.id] ?? 0}</span> subjects</p>
                  <p><span className="font-bold text-slate-900">{classStudentCountsState[cls.id] ?? 0}</span> students</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Subjects &amp; teacher assignments</p>
              <p className="text-xs text-slate-400 mt-0.5">Manage subject ownership and teacher alignment.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openModal('subject')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Add subject
              </button>
              <button
                onClick={() => openModal('assign')}
                className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
              >
                Assign teacher
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white"
            >
              <option>All classes</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.label}>{option.label}</option>
              ))}
            </select>
            <div className="relative flex-1 max-w-xs ml-auto">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder="Search subjects…"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">SUBJECT</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">CODE</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">CLASS</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">TEACHER</th>
                  <th className="w-20 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubjects.map((subject) => {
                  const course = classCourseMap[subject.classCourseId];
                  const teacherName = assignmentMap[subject.id]?.teacherName ?? 'Unassigned';
                  return (
                    <tr key={subject.id}>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{subject.name}</td>
                      <td className="px-2 py-3.5 text-slate-500 font-mono text-xs">{subject.code}</td>
                      <td className="px-2 py-3.5 text-slate-500">{course ? `${course.name} — ${course.section}` : 'Unassigned'}</td>
                      <td className="px-2 py-3.5">
                        {teacherName === 'Unassigned' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Unassigned
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                              {teacherName.split(' ').map((p) => p[0]).join('')}
                            </div>
                            <span className="text-slate-600">{teacherName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="relative inline-flex">
                          <button
                            type="button"
                            data-action-button={`subject-${subject.id}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setActionMenuFor(actionMenuFor === `subject-${subject.id}` ? null : `subject-${subject.id}`);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 inline-flex items-center justify-center"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                          </button>
                          {actionMenuFor === `subject-${subject.id}` ? (
                            <div
                              data-action-menu={`subject-${subject.id}`}
                              onClick={(ev) => ev.stopPropagation()}
                              className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
                            >
                              <button
                                type="button"
                                onClick={() => openEditSubject(subject)}
                                className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                Edit subject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete('subject', subject.id, subject.name)}
                                className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50"
                              >
                                Delete subject
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
            <h2 className="text-xl font-extrabold text-slate-800">{editingClass ? 'Edit class' : 'Add class'}</h2>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleCreateClass} className="px-7 py-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class name <span className="text-rose-500">*</span></label>
                <input
                  value={classForm.name}
                  onChange={(event) => setClassForm({ ...classForm, name: event.target.value })}
                  placeholder="e.g. Class 9"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Section <span className="text-rose-500">*</span></label>
                <input
                  value={classForm.section}
                  onChange={(event) => setClassForm({ ...classForm, section: event.target.value })}
                  placeholder="e.g. A"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Academic year</label>
              <select
                value={classForm.year}
                onChange={(event) => setClassForm({ ...classForm, year: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option>2026 – 2027</option>
                <option>2025 – 2026</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">{editingClass ? 'Save changes' : 'Create class'}</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${activeModal === 'subject' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">{editingSubject ? 'Edit subject' : 'Add subject'}</h2>
            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleCreateSubject} className="px-7 py-6 space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject name <span className="text-rose-500">*</span></label>
              <input
                value={subjectForm.name}
                onChange={(event) => setSubjectForm({ ...subjectForm, name: event.target.value })}
                placeholder="e.g. Mathematics"
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject code <span className="text-rose-500">*</span></label>
                <input
                  value={subjectForm.code}
                  onChange={(event) => setSubjectForm({ ...subjectForm, code: event.target.value })}
                  placeholder="e.g. MTH-101"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                <select
                  value={subjectForm.classCourseId}
                  onChange={(event) => setSubjectForm({ ...subjectForm, classCourseId: event.target.value })}
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Teacher <span className="text-slate-400 font-normal">(optional — assign later)</span></label>
              <select
                value={subjectForm.teacherId}
                onChange={(event) => setSubjectForm({ ...subjectForm, teacherId: event.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Unassigned</option>
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">{editingSubject ? 'Save changes' : 'Create subject'}</button>
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
              <select
                value={assignForm.subjectId}
                onChange={(event) => setAssignForm({ ...assignForm, subjectId: event.target.value })}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {subjectSelectOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Teacher <span className="text-rose-500">*</span></label>
              <select
                value={assignForm.teacherId}
                onChange={(event) => setAssignForm({ ...assignForm, teacherId: event.target.value })}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                {teacherOptions.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Assign teacher</button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${activeModal === 'delete' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded w-full max-w-sm shadow-2xl p-7 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 className="text-lg font-extrabold text-slate-800">{deleteTarget?.type === 'class' ? 'Remove class?' : 'Remove subject?'}</h3>
          <p className="text-sm text-slate-500 mt-1.5"><span className="font-semibold text-slate-700">{deleteTarget?.label}</span> <span className="text-slate-500">{deleteTarget?.type === 'class' ? 'will be removed, along with its subjects and assignments.' : 'will be removed from this class. Any teacher assignment for it will also be cleared.'}</span></p>
          <div className="flex items-center gap-3 mt-6">
            <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">Remove</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
