"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button, PageHeader, AmsPagination, Modal, TeacherAssignmentModal, AmsDeleteComfiramtionModal } from '../../ui';
import {
  getClassCourses,
  getSubjects,
  getUsers,
  createSubject,
  updateSubject,
  deleteSubject,
} from '@/lib/api';
import { createTeacherAssignment, deleteTeacherAssignment, getTeacherAssignments } from '@/lib/api/teacherAssignments';
import type { ClassCourseDto, SubjectDto, UserDto } from '@/lib/api';
import type { TeacherSubjectAssignmentDto } from '@/lib/api/teacherAssignments';

export default function SubjectsAssignments() {
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [assignments, setAssignments] = useState<TeacherSubjectAssignmentDto[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [activeModal, setActiveModal] = useState<'subject' | 'assign' | 'view-subjects' | 'delete' | null>(null);
  const [viewSubjectsForClass, setViewSubjectsForClass] = useState<string | null>(null);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'subject'; label: string } | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', gradeId: '', groupId: '' });
  const [editingSubject, setEditingSubject] = useState<SubjectDto | null>(null);
  const [assignForm, setAssignForm] = useState({ classDefinitionId: '', classCourseId: '', subjectId: '', teacherId: '' });
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!actionMenuFor) return;

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      const menuEl = document.querySelector(`[data-action-menu="${actionMenuFor}"]`);
      const btnEl = document.querySelector(`[data-action-button="${actionMenuFor}"]`);
      if (menuEl && menuEl.contains(target)) return;
      if (btnEl && btnEl.contains(target)) return;
      setActionMenuFor(null);
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [actionMenuFor]);

  async function loadData() {
    try {
      setError(null);
      const [apiClasses, apiSubjects, apiUsers, apiAssignments] = await Promise.all([
        getClassCourses(),
        getSubjects(),
        getUsers(),
        getTeacherAssignments(),
      ]);
      setClasses(apiClasses);
      setSubjects(apiSubjects);
      setTeachers((apiUsers as UserDto[]).filter((u) => u.role === 'Teacher'));
      setAssignments(apiAssignments);
    } catch (err) {
      console.error(err);
      setError('Unable to load subjects data.');
    }
  }

  const classCourseMap = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])) as Record<string, ClassCourseDto>, [classes]);
  const assignmentMap = useMemo(() => Object.fromEntries(assignments.map((a) => [a.subjectId, a])) as Record<string, TeacherSubjectAssignmentDto>, [assignments]);

  const formatClassCourseLabel = (course?: ClassCourseDto | null) => {
    if (!course) return 'Class subjects';
    return [course.name, course.section, course.groupName].filter(Boolean).join(' - ');
  };

  const classOptions = useMemo(() => classes.map((cls) => ({ id: cls.id, label: formatClassCourseLabel(cls) })), [classes]);

  const summaryMetrics = useMemo(() => {
    const totalTeachers = teachers.length;
    const totalSubjects = subjects.length;
    const totalAllocations = assignments.length;
    const assignedSubjectIds = new Set(assignments.map((assignment) => assignment.subjectId));
    const unassignedSubjects = subjects.filter((subject) => !assignedSubjectIds.has(subject.id)).length;
    const classesPerTeacher = assignments.reduce<Record<string, Set<string>>>((acc, assignment) => {
      if (!acc[assignment.teacherId]) {
        acc[assignment.teacherId] = new Set();
      }
      acc[assignment.teacherId].add(assignment.classCourseId);
      return acc;
    }, {});
    const totalAssignedClasses = Object.values(classesPerTeacher).reduce((sum, classesSet) => sum + classesSet.size, 0);
    const avgClassesPerTeacher = totalTeachers > 0 ? totalAssignedClasses / totalTeachers : 0;

    return {
      totalTeachers,
      totalSubjects,
      totalAllocations,
      unassignedSubjects,
      avgClassesPerTeacher,
    };
  }, [teachers.length, subjects.length, assignments]);

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();
    return subjects.filter((subject) => {
      const course = classCourseMap[subject.classCourseId];
      const clsLabel = course ? formatClassCourseLabel(course) : 'Unassigned';
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

  const pagedSubjects = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, pageIndex, pageSize]);

  useEffect(() => {
    if (pageIndex >= Math.max(1, Math.ceil(filteredSubjects.length / pageSize))) {
      setPageIndex(Math.max(0, Math.ceil(filteredSubjects.length / pageSize) - 1));
    }
  }, [filteredSubjects.length, pageIndex, pageSize]);

  function openModal(modal: 'subject' | 'assign' | 'view-subjects', classCourseId?: string) {
    setActionMenuFor(null);
    setViewSubjectsForClass(null);
    if (modal === 'subject') {
      setEditingSubject(null);
      setSubjectForm({ name: '', code: '', gradeId: classCourseId ?? '', groupId: '' });
    }
    if (modal === 'view-subjects') {
      setViewSubjectsForClass(classCourseId ?? null);
    }
    if (modal === 'assign') {
      setAssignForm({ classDefinitionId: '', classCourseId: '', subjectId: '', teacherId: '' });
    }
    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
    setViewSubjectsForClass(null);
    setEditingSubject(null);
    setSubjectForm({ name: '', code: '', gradeId: '', groupId: '' });
  }

  async function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
      alert('Please enter a valid subject name and code.');
      return;
    }
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, { name: subjectForm.name, code: subjectForm.code, classCourseId: editingSubject.classCourseId });
      } else {
        const targetClassId = subjectForm.gradeId || classes[0]?.id;
        if (!targetClassId) throw new Error('No class available');
        await createSubject({ name: subjectForm.name, code: subjectForm.code, classCourseId: targetClassId });
      }
      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Unable to save subject.');
    }
  }

  function openEditSubject(subject: SubjectDto) {
    setEditingSubject(subject);
    const gradeId = subject.classCourseId ?? '';
    setSubjectForm({ name: subject.name, code: subject.code, gradeId, groupId: '' });
    setActiveModal('subject');
  }

  function handleDelete(type: 'subject', id: string, label: string) {
    setActionMenuFor(null);
    setDeleteTarget({ id, type, label });
    setActiveModal('delete');
  }

  function handleReassignTeacher(subject: SubjectDto) {
    const existingAssignment = assignmentMap[subject.id];
    setAssignForm({
      classDefinitionId: '',
      classCourseId: subject.classCourseId,
      subjectId: subject.id,
      teacherId: existingAssignment?.teacherId ?? '',
    });
    setActionMenuFor(null);
    setActiveModal('assign');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'subject') {
        await deleteSubject(deleteTarget.id);
      }
      await loadData();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Delete failed.');
    }
  }

  async function handleAssignTeacher(values: { teacherId: string; classCourseId: string; subjectId: string }) {
    try {
      // Check if this subject already has a teacher assigned
      const existingAssignment = assignmentMap[values.subjectId];
      
      // If there's an existing assignment and it's different from the new one, delete it first
      if (existingAssignment && existingAssignment.teacherId !== values.teacherId) {
        await deleteTeacherAssignment(existingAssignment.teacherId, values.subjectId);
      }
      
      // Create the new assignment (or skip if same teacher)
      if (!existingAssignment || existingAssignment.teacherId !== values.teacherId) {
        await createTeacherAssignment({
          teacherId: values.teacherId,
          classCourseId: values.classCourseId,
          subjectId: values.subjectId,
        });
      }
      
      await loadData();
      closeModal();
    } catch (err) {
      console.error('Teacher assignment failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Unable to assign the teacher. ${message}`);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Administration"
        title="Teacher Allocation"
        action={
          <Button type="button" onClick={() => openModal('assign')} className="px-4 py-2.5">
            Assign teacher
          </Button>
        }
      />

<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">TEACHERS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.totalTeachers}</p>
            <p className="mt-1 text-xs text-slate-400">Total teachers</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">SUBJECTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.totalSubjects}</p>
            <p className="mt-1 text-xs text-slate-400">Subjects available</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">ALLOCATIONS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><path d="M12 5v14"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.totalAllocations}</p>
            <p className="mt-1 text-xs text-slate-400">Teacher allocations</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">AVG CLASSES PER TEACHER</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V4"/><path d="M6 14l6-6 6 6"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.avgClassesPerTeacher.toFixed(1)}</p>
            <p className="mt-1 text-xs text-slate-400">Average classes per teacher</p>
          </div>
      </div>

      {subjects.length > 0 && classes.length > 0 ? (
        <div className="bg-white rounded border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="text-sm border border-slate-200 rounded px-3 py-2.5 text-slate-600 bg-white">
            <option>All classes</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.label}>{option.label}</option>
            ))}
          </select>
          <div className="relative flex-1 max-w-xs ml-auto">
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search subjects…" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded text-sm outline-none focus:border-brand-500" />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded border border-slate-200 overflow-visible">
        {filteredSubjects.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h10" />
                <path d="M4 4v16" />
              </svg>
            </div>
            <p className="text-base font-bold text-slate-800">
              {subjects.length === 0
                ? 'No subjects available'
                : search.trim() || selectedClass !== 'All classes'
                ? 'No allocations match your filters'
                : 'No teacher allocations yet'}
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {subjects.length === 0
                ? 'Create a subject and assign a teacher to begin managing allocation.'
                : search.trim() || selectedClass !== 'All classes'
                ? 'Try a different class filter or search term to find the allocation you need.'
                : 'Assign a teacher to a subject to display allocation records here.'}
            </p>
            <Button type="button" onClick={() => openModal('assign')} className="mt-6">
              Assign teacher
            </Button>
          </div>
        ) : (
          <>
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
                {pagedSubjects.map((subject) => {
                  const course = classCourseMap[subject.classCourseId];
                  const teacherName = assignmentMap[subject.id]?.teacherName ?? 'Unassigned';
                  return (
                    <tr key={subject.id}>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">{subject.name}</td>
                      <td className="px-2 py-3.5 text-slate-500 font-mono text-xs">{subject.code}</td>
                      <td className="px-2 py-3.5 text-slate-500">{course ? formatClassCourseLabel(course) : 'Unassigned'}</td>
                      <td className="px-2 py-3.5">
                        {teacherName === 'Unassigned' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11.5px] font-bold text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>Unassigned</span>
                        ) : (
                          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">{teacherName.split(' ').map((p) => p[0]).join('')}</div><span className="text-slate-600">{teacherName}</span></div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="relative inline-flex">
                          <button type="button" data-action-button={`subject-${subject.id}`} onClick={(ev) => { ev.stopPropagation(); setActionMenuFor(actionMenuFor === `subject-${subject.id}` ? null : `subject-${subject.id}`); }} className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md p-0 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></button>
                          {actionMenuFor === `subject-${subject.id}` ? (
                            <div data-action-menu={`subject-${subject.id}`} onClick={(ev) => ev.stopPropagation()} className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded border border-slate-200 bg-white shadow-xl">
                              {teacherName === 'Unassigned' ? (
                                <Button type="button" variant="ghost" onClick={() => handleReassignTeacher(subject)} className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">Assign teacher</Button>
                              ) : (
                                <Button type="button" variant="ghost" onClick={() => handleReassignTeacher(subject)} className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">Reassign teacher</Button>
                              )}
                              <Button type="button" variant="ghost" onClick={() => openEditSubject(subject)} className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">Edit subject</Button>
                              <Button type="button" variant="ghost" onClick={() => handleDelete('subject', subject.id, subject.name)} className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50">Delete subject</Button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <AmsPagination currentPage={pageIndex} pageSize={pageSize} totalItems={filteredSubjects.length} pageSizeOptions={[10,25,50]} onPageChange={setPageIndex} onPageSizeChange={(s) => setPageSize(s)} label="Showing" itemLabel="subjects" />
          </>
        )}
      </div>

      <div className={`${activeModal === 'subject' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">{editingSubject ? 'Edit subject' : 'Add subject'}</h2>
            <button type="button" onClick={closeModal} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 focus:outline-none" aria-label="Close modal"><svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          </div>
          <form onSubmit={handleCreateSubject} className="px-7 py-6 space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject name <span className="text-rose-500">*</span></label>
              <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} placeholder="e.g. Mathematics" required className="w-full rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Subject code <span className="text-rose-500">*</span></label>
                <input value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} placeholder="e.g. MTH-101" required className="w-full rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select value={subjectForm.gradeId} onChange={(e) => setSubjectForm({ ...subjectForm, gradeId: e.target.value })} required className="w-full appearance-none rounded border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                    <option value="">Select class</option>
                    {classOptions.map((option) => (<option key={option.id} value={option.id}>{option.label}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit">{editingSubject ? 'Save changes' : 'Create subject'}</Button>
            </div>
          </form>
        </div>
      </div>

      <Modal open={activeModal === 'view-subjects'} onClose={closeModal} title={formatClassCourseLabel(classes.find((cls) => cls.id === viewSubjectsForClass) ?? null)} description="View all subjects that belong to this class.">
        <div className="space-y-4">
          {subjects.filter((subject) => subject.classCourseId === viewSubjectsForClass).map((subject) => {
            const teacherName = assignmentMap[subject.id]?.teacherName ?? 'Unassigned';
            return (
              <div key={subject.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{subject.name}</p>
                <p className="text-sm text-slate-500">Code: {subject.code}</p>
                <p className="text-sm text-slate-500">Teacher: {teacherName}</p>
              </div>
            );
          })}
          {subjects.filter((subject) => subject.classCourseId === viewSubjectsForClass).length === 0 ? (
            <p className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">No subjects have been added to this class yet.</p>
          ) : null}
        </div>
      </Modal>

      <TeacherAssignmentModal open={activeModal === 'assign'} onClose={closeModal} title={assignForm.teacherId ? 'Reassign teacher' : 'Assign teacher'} submitLabel={assignForm.teacherId ? 'Save reassignment' : 'Save assignment'} teachers={teachers.map((teacher) => ({ id: teacher.id, fullName: teacher.fullName, subjectSpecialization: teacher.subjectSpecialization }))} classCourses={classes.map((cls) => ({ id: cls.id, name: cls.name, section: cls.section }))} subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name, code: subject.code, classCourseId: subject.classCourseId }))} assignments={assignments.map((assignment) => ({ subjectId: assignment.subjectId, teacherId: assignment.teacherId }))} initialValues={{ teacherId: assignForm.teacherId, classCourseId: assignForm.classCourseId, subjectId: assignForm.subjectId }} isSubmitting={false} onSubmit={handleAssignTeacher} />

      <AmsDeleteComfiramtionModal open={activeModal === 'delete' && Boolean(deleteTarget)} onClose={closeModal} title={deleteTarget?.type === 'subject' ? 'Remove subject?' : 'Remove'} description={`${deleteTarget?.label ?? 'This item'} will be removed.`} confirmLabel="Remove" onConfirm={confirmDelete} />
    </div>
  );
}
