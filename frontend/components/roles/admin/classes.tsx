"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AppShell } from '../../layout/AppShell';
import { Button, AmsDeleteComfiramtionModal, AmsPagination, TeacherAssignmentModal } from '../../ui';
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
  getClassDefinitions,
  getGroupsForClass,
  getAcademicYears,
  getActiveAcademicYear,
} from '@/lib/api';
import { getEnrollments } from '@/lib/api/enrollments';
import { createTeacherAssignment, deleteTeacherAssignment, getTeacherAssignments } from '@/lib/api/teacherAssignments';
import type { ClassCourseDto, SubjectDto, UserDto } from '@/lib/api';
import type { TeacherSubjectAssignmentDto } from '@/lib/api/teacherAssignments';

function isHigherSecondaryClassName(className?: string) {
  if (!className) return false;

  const normalized = className.trim().toLowerCase();
  const numericValue = Number.parseInt(normalized.replace(/[^0-9]/g, ''), 10);

  return numericValue >= 9 && numericValue <= 12 || ['nine', 'ten', 'eleven', 'twelve', 'class 9', 'class 10', 'class 11', 'class 12'].includes(normalized);
}

export function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [assignments, setAssignments] = useState<TeacherSubjectAssignmentDto[]>([]);
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'class' | 'subject' | 'assign' | 'delete' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'class' | 'subject'; label: string } | null>(null);
  const [classForm, setClassForm] = useState({ classDefinitionId: '', groupId: '', name: '', section: '', year: '' });
  const [classDefinitions, setClassDefinitions] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; isActive: boolean }[]>([]);
  const [availableGroups, setAvailableGroups] = useState<{ id: string; name: string }[]>([]);
  const [groupNameMap, setGroupNameMap] = useState<Record<string, string>>({});
  const [editingClass, setEditingClass] = useState<ClassCourseDto | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', gradeId: '', groupId: '' });
  const [subjectAvailableGroups, setSubjectAvailableGroups] = useState<{ id: string; name: string }[]>([]);
  const [editingSubject, setEditingSubject] = useState<SubjectDto | null>(null);
  const [assignForm, setAssignForm] = useState({ classDefinitionId: '', classCourseId: '', subjectId: '', teacherId: '' });
  const [classDefinitionMenuOpen, setClassDefinitionMenuOpen] = useState(false);
  const classDefinitionMenuRef = useRef<HTMLDivElement | null>(null);
  const [assignClassMenuOpen, setAssignClassMenuOpen] = useState(false);
  const assignClassMenuRef = useRef<HTMLDivElement | null>(null);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classStudentCountsState, setClassStudentCountsState] = useState<Record<string, number>>({});
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    void loadData();
    void loadClassDefinitions();
    void loadAcademicYears();
  }, []);

  async function loadAcademicYears() {
    try {
      const years = await getAcademicYears();
      setAcademicYears(years);
      
      // Set active year as default
      const activeYear = years.find(y => y.isActive);
      if (activeYear && !classForm.year) {
        setClassForm(c => ({ ...c, year: activeYear.id }));
      }
    } catch (err) {
      console.error('Failed to load academic years', err);
    }
  }

  useEffect(() => {
    async function loadGroups() {
      if (!classForm.classDefinitionId) {
        setAvailableGroups([]);
        setClassForm((c) => ({ ...c, groupId: '' }));
        return;
      }

      try {
        const groups = await getGroupsForClass(classForm.classDefinitionId);
        setAvailableGroups(groups);
        if (!groups.some((g) => g.id === classForm.groupId)) {
          setClassForm((c) => ({ ...c, groupId: '' }));
        }
      } catch (err) {
        console.error('Failed to load groups', err);
        setAvailableGroups([]);
        setClassForm((c) => ({ ...c, groupId: '' }));
      }
    }

    void loadGroups();
  }, [classForm.classDefinitionId]);

  useEffect(() => {
    async function loadSubjectGroups() {
      if (!subjectForm.gradeId) {
        setSubjectAvailableGroups([]);
        setSubjectForm((s) => ({ ...s, groupId: '' }));
        return;
      }

      try {
        const groups = await getGroupsForClass(subjectForm.gradeId);
        // sort preferred order: Science, Arts, Commerce
        const preferred = ['Science', 'Arts', 'Commerce'];
        groups.sort((a, b) => Math.max(0, preferred.indexOf(a.name)) - Math.max(0, preferred.indexOf(b.name)));
        setSubjectAvailableGroups(groups);
        if (!groups.some((g) => g.id === subjectForm.groupId)) {
          // default to Science if present
          const science = groups.find((g) => g.name.toLowerCase() === 'science');
          setSubjectForm((s) => ({ ...s, groupId: science ? science.id : '' }));
        }
      } catch (err) {
        console.error('Failed to load subject groups', err);
        setSubjectAvailableGroups([]);
        setSubjectForm((s) => ({ ...s, groupId: '' }));
      }
    }

    void loadSubjectGroups();
  }, [subjectForm.gradeId]);

  async function loadClassDefinitions() {
    try {
      const defs = await getClassDefinitions();
      setClassDefinitions(defs);
      try {
        const groupsByDef = await Promise.all(defs.map(async (d) => ({ id: d.id, groups: await getGroupsForClass(d.id) })));
        const map: Record<string, string> = {};
        groupsByDef.forEach((entry) => entry.groups.forEach((g) => (map[g.id] = g.name)));
        setGroupNameMap(map);
      } catch (err) {
        console.error('Failed to load groups for class definitions', err);
        setGroupNameMap({});
      }
      if (defs.length && !classForm.classDefinitionId) {
        setClassForm((c) => ({ ...c, classDefinitionId: defs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load class definitions', err);
    }
  }

  useEffect(() => {
    if (classes.length && !subjectForm) {
      setSubjectForm((current) => ({ ...current, classCourseId: classes[0].id }));
    }
  }, [classes, subjectForm]);

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

  useEffect(() => {
    if (!classDefinitionMenuOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!classDefinitionMenuRef.current || classDefinitionMenuRef.current.contains(target)) {
        return;
      }
      setClassDefinitionMenuOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [classDefinitionMenuOpen]);

  useEffect(() => {
    if (!assignClassMenuOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!assignClassMenuRef.current || assignClassMenuRef.current.contains(target)) {
        return;
      }
      setAssignClassMenuOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [assignClassMenuOpen]);

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
      // fetch groups for the currently selected class definition (if any)
      if (classForm.classDefinitionId) {
        try {
          const groups = await getGroupsForClass(classForm.classDefinitionId);
          // sort preferred order: Science, Arts, Commerce
          const preferred = ['Science', 'Arts', 'Commerce'];
          groups.sort((a, b) => Math.max(0, preferred.indexOf(a.name)) - Math.max(0, preferred.indexOf(b.name)));
          setAvailableGroups(groups);
          // ensure groupNameMap updated
          setGroupNameMap((m) => {
            const next = { ...m };
            groups.forEach((g) => (next[g.id] = g.name));
            return next;
          });
          // default select Science when opening/refreshing groups
          const science = groups.find((g) => g.name.toLowerCase() === 'science');
          if (science && !classForm.groupId) {
            setClassForm((c) => ({ ...c, groupId: science.id }));
          } else if (!groups.some((g) => g.id === classForm.groupId)) {
            setClassForm((c) => ({ ...c, groupId: '' }));
          }
        } catch (err) {
          console.error('Failed to load groups in loadData', err);
          setAvailableGroups([]);
        }
      } else {
        setAvailableGroups([]);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load class data. Please refresh the page.');
    }
  }

  function openModal(modal: 'class' | 'subject' | 'assign') {
    if (modal === 'class') {
      setEditingClass(null);
      const activeYear = academicYears.find(y => y.isActive)?.id ?? academicYears[0]?.id ?? '';
      setClassForm({ classDefinitionId: classDefinitions[0]?.id ?? '', groupId: '', name: '', section: '', year: activeYear });
      // fetch groups for the default class definition immediately to ensure dropdown is fresh
      (async () => {
        try {
          const defId = classDefinitions[0]?.id ?? '';
          if (defId) {
            const groups = await getGroupsForClass(defId);
            setAvailableGroups(groups);
            if (!groups.some((g) => g.id === (classForm.groupId ?? ''))) {
              setClassForm((c) => ({ ...c, groupId: '' }));
            }
          }
        } catch (err) {
          console.error('Failed to load groups when opening modal', err);
          setAvailableGroups([]);
          setClassForm((c) => ({ ...c, groupId: '' }));
        }
      })();
    }

    if (modal === 'subject') {
      setEditingSubject(null);
      setSubjectForm({ name: '', code: '', gradeId: classDefinitions[0]?.id ?? '', groupId: '' });
    }

    if (modal === 'assign') {
      const defaultClassDefinitionId = classDefinitions[0]?.id ?? '';
      const defaultClassCourseId = classes.find((cls) => cls.classDefinitionId === defaultClassDefinitionId)?.id ?? classes[0]?.id ?? '';
      const defaultSubjectId = subjects.find((subject) => subject.classCourseId === defaultClassCourseId)?.id ?? '';
      setAssignForm({ classDefinitionId: defaultClassDefinitionId, classCourseId: defaultClassCourseId, subjectId: defaultSubjectId, teacherId: teachers[0]?.id ?? '' });
    }

    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
    setEditingSubject(null);
    setSubjectForm({ name: '', code: '', gradeId: classDefinitions[0]?.id ?? '', groupId: '' });
    setEditingClass(null);
    const activeYear = academicYears.find(y => y.isActive)?.id ?? academicYears[0]?.id ?? '';
    setClassForm({ classDefinitionId: classDefinitions[0]?.id ?? '', groupId: '', name: '', section: '', year: activeYear });
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

    if (requiresGroupSelection && !classForm.groupId) {
      alert('Please select a group for this higher secondary class.');
      return;
    }

    try {
      const yearName = academicYears.find(y => y.id === classForm.year)?.name || '';
      if (editingClass) {
        const nameToSend = classForm.name || classDefinitions.find((c) => c.id === classForm.classDefinitionId)?.name || '';
        await updateClassCourse(editingClass.id, {
          classDefinitionId: classForm.classDefinitionId || undefined,
          groupId: classForm.groupId || undefined,
          name: nameToSend,
          section: classForm.section,
          academicYear: yearName,
        });
      } else {
        const nameToSend = classForm.name || classDefinitions.find((c) => c.id === classForm.classDefinitionId)?.name || '';
        await createClassCourse({
          classDefinitionId: classForm.classDefinitionId || undefined,
          groupId: classForm.groupId || undefined,
          name: nameToSend,
          section: classForm.section,
          academicYear: yearName,
        });
      }
      const activeYear = academicYears.find(y => y.isActive)?.id ?? academicYears[0]?.id ?? '';
      setClassForm({ classDefinitionId: classDefinitions[0]?.id ?? '', groupId: '', name: '', section: '', year: activeYear });
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
    const yearId = academicYears.find(y => y.name === cls.academicYear)?.id ?? '';
    setClassForm({ classDefinitionId: cls.classDefinitionId ?? '', groupId: cls.groupId ?? '', name: cls.name, section: cls.section, year: yearId });
    setActiveModal('class');
  }

  async function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const gradeId = subjectForm.gradeId?.trim();
    if (!subjectForm.name.trim() || !subjectForm.code.trim() || !gradeId) {
      alert('Please enter a valid subject name, code, and grade before saving.');
      return;
    }

    const matchingClasses = classes.filter((cls) => {
      if (cls.classDefinitionId !== gradeId) return false;
      if (subjectForm.groupId) return cls.groupId === subjectForm.groupId;
      return true;
    });

    if (matchingClasses.length === 0) {
      alert('No class sections were found for the selected grade and group. Please verify your selection.');
      return;
    }

    try {
      if (editingSubject) {
        const repClass = classes.find((cls) => cls.id === editingSubject.classCourseId) ?? matchingClasses[0];
        await updateSubject(editingSubject.id, {
          name: subjectForm.name,
          code: subjectForm.code,
          classCourseId: repClass.id,
        });
      } else {
        await Promise.all(
          matchingClasses.map((cls) =>
            createSubject({
              name: subjectForm.name,
              code: subjectForm.code,
              classCourseId: cls.id,
            })
          )
        );
      }

      setSubjectForm({ name: '', code: '', gradeId: classDefinitions[0]?.id ?? '', groupId: '' });
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
    const repClass = classes.find((cls) => cls.id === subject.classCourseId) ?? null;
    const gradeId = repClass?.classDefinitionId ?? classDefinitions[0]?.id ?? '';
    const groupId = repClass?.groupId ?? '';
    setSubjectForm({ name: subject.name, code: subject.code, gradeId, groupId });
    setActiveModal('subject');
  }

  async function handleAssignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const selectedTeacherId = assignForm.teacherId?.trim();
    const selectedClassCourseId = assignForm.classCourseId?.trim();
    const subject = subjects.find((item) => item.id === assignForm.subjectId);

    if (!assignForm.classDefinitionId || !selectedClassCourseId) {
      alert('Please select a valid class and section to assign.');
      return;
    }

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
        classCourseId: selectedClassCourseId,
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

  const gradeOptions = useMemo(
    () => classDefinitions.map((definition) => ({ id: definition.id, label: definition.name })),
    [classDefinitions]
  );

  const teacherOptions = useMemo(() => {
    const subject = subjects.find((s) => s.id === assignForm.subjectId) ?? null;

    // Build a set of teacherIds who already have this subject assigned
    const assignedTeacherIds = new Set<string>(
      (subject ? assignments.filter((a) => a.subjectId === subject.id).map((a) => a.teacherId) : [])
    );

    // Normalize helper: from stored "Name — CODE" or plain name to name
    const normalize = (raw?: string) =>
      (raw ?? '')
        .split(',')
        .map((v) => v.trim())
        .map((val) => val.split('—')[0].trim())
        .filter(Boolean);

    if (!subject) {
      // No subject selected — show all teachers
      return teachers.map((teacher) => ({ id: teacher.id, label: teacher.fullName }));
    }

    const want = subject.name;

    const filtered = teachers.filter((teacher) => {
      // include if teacher already assigned to this subject
      if (assignedTeacherIds.has(teacher.id)) return true;

      const specs = normalize(teacher.subjectSpecialization);
      return specs.some((s) => s.toLowerCase() === want.toLowerCase());
    });

    return filtered.map((t) => ({ id: t.id, label: t.fullName }));
  }, [teachers, subjects, assignForm.subjectId, assignments]);

  const sectionOptions = useMemo(
    () => classes.map((cls) => ({ id: cls.id, label: `${cls.name} — ${cls.section}` })),
    [classes]
  );

  const subjectAssignmentsBySubject = useMemo(
    () =>
      assignments.reduce<Record<string, TeacherSubjectAssignmentDto[]>>((acc, assignment) => {
        acc[assignment.subjectId] = [...(acc[assignment.subjectId] ?? []), assignment];
        return acc;
      }, {}),
    [assignments]
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

  const pagedSubjects = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, pageIndex, pageSize]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredSubjects.length / pageSize)), [filteredSubjects.length, pageSize]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  const classDefinitionOptions = useMemo(
    () => classDefinitions.map((definition) => ({ id: definition.id, label: definition.name })),
    [classDefinitions]
  );

  const selectedClassDefinition = classDefinitions.find((definition) => definition.id === classForm.classDefinitionId);
  const selectedClassDefinitionLabel = selectedClassDefinition?.name ?? 'Select class';
  const requiresGroupSelection = isHigherSecondaryClassName(selectedClassDefinition?.name);

  const selectedAssignClassDefinitionLabel = assignForm.classDefinitionId
    ? classDefinitions.find((definition) => definition.id === assignForm.classDefinitionId)?.name ?? 'Select class'
    : 'Select class';

  const sectionOptionsForClass = useMemo(
    () =>
      classes
        .filter((cls) => !assignForm.classDefinitionId || cls.classDefinitionId === assignForm.classDefinitionId)
        .map((cls) => ({
          id: cls.id,
          label: `${cls.name} — ${cls.section}${cls.groupId ? ` (${groupNameMap[cls.groupId] ?? ''})` : ''}`,
        })),
    [classes, assignForm.classDefinitionId, groupNameMap]
  );

  const subjectSelectOptions = useMemo(() => {
    return subjects
      .filter((subject) => {
        if (assignForm.classCourseId) {
          return subject.classCourseId === assignForm.classCourseId;
        }

        if (assignForm.classDefinitionId) {
          const course = classCourseMap[subject.classCourseId];
          return course?.classDefinitionId === assignForm.classDefinitionId;
        }

        return false;
      })
      .map((subject) => ({
        id: subject.id,
        label: `${subject.name} — ${subject.code}`,
      }));
  }, [subjects, assignForm.classCourseId, assignForm.classDefinitionId, classCourseMap]);

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
          <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700">Class roster</p>
              <p className="text-xs text-slate-400 mt-0.5">Manage classes and see enrollment at a glance.</p>
            </div>
            <Button
              type="button"
              onClick={() => openModal('class')}
              className="px-4 py-2.5 flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add class
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded border border-slate-200 p-5">
                  <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-800">{cls.name} — {cls.section}{cls.groupId ? `(${groupNameMap[cls.groupId] ?? ''})` : ''}</p>
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
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md p-0 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                    </button>
                    {actionMenuFor === `class-${cls.id}` ? (
                      <div
                        data-action-menu={`class-${cls.id}`}
                        onClick={(ev) => ev.stopPropagation()}
                        className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded border border-slate-200 bg-white shadow-xl"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => openEditClass(cls)}
                          className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Edit class
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDelete('class', cls.id, `${cls.name} — ${cls.section}`)}
                          className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50"
                        >
                          Delete class
                        </Button>
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => openModal('subject')}
                className="px-4 py-2.5"
              >
                Add subject
              </Button>
              <Button
                type="button"
                onClick={() => openModal('assign')}
                className="px-4 py-2.5"
              >
                Assign teacher
              </Button>
            </div>
          </div>

          <div className="bg-white rounded border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="text-sm border border-slate-200 rounded px-3 py-2.5 text-slate-600 bg-white"
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
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded text-sm outline-none focus:border-brand-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          <div className="bg-white rounded border border-slate-200 overflow-visible">
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
                      <td className="px-2 py-3.5 text-slate-500">{course ? `${course.name} — ${course.section}${course.groupId ? ` (${groupNameMap[course.groupId] ?? ''})` : ''}` : 'Unassigned'}</td>
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
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md p-0 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                          </button>
                          {actionMenuFor === `subject-${subject.id}` ? (
                            <div
                              data-action-menu={`subject-${subject.id}`}
                              onClick={(ev) => ev.stopPropagation()}
                              className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded border border-slate-200 bg-white shadow-xl"
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => openEditSubject(subject)}
                                className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                Edit subject
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleDelete('subject', subject.id, subject.name)}
                                className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50"
                              >
                                Delete subject
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <AmsPagination
              currentPage={pageIndex}
              pageSize={pageSize}
              totalItems={filteredSubjects.length}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
              label="Showing"
              itemLabel="subjects"
            />
          </div>
        </div>
      </div>

      <div className={`${activeModal === 'class' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">{editingClass ? 'Edit class' : 'Add class'}</h2>
            <button
              type="button"
              onClick={closeModal}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleCreateClass} className="px-7 py-6 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Academic year <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={classForm.year}
                    onChange={(event) => setClassForm({ ...classForm, year: event.target.value })}
                    required
                    className="w-full appearance-none rounded border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.name} {year.isActive ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                <div ref={classDefinitionMenuRef} className="relative" data-class-definition-menu>
                  <button
                    type="button"
                    onClick={() => setClassDefinitionMenuOpen((open) => !open)}
                    className="relative w-full cursor-pointer rounded border border-slate-300 bg-white px-4 py-2.5 pr-12 text-left text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <span className="block truncate">{selectedClassDefinitionLabel}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center border-l border-slate-200 bg-slate-50 text-slate-500">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                      </svg>
                    </span>
                  </button>

                  {classDefinitionMenuOpen ? (
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded border border-slate-200 bg-white shadow-xl">
                      <div className="max-h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                        {classDefinitions.map((cd) => (
                          <button
                            key={cd.id}
                            type="button"
                            onClick={() => {
                              setClassForm({ ...classForm, classDefinitionId: cd.id });
                              setClassDefinitionMenuOpen(false);
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm transition ${classForm.classDefinitionId === cd.id ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}
                          >
                            <span>{cd.name}</span>
                            {classForm.classDefinitionId === cd.id ? (
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0l-3.5-3.5a1 1 0 011.4-1.4l2.8 2.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd"/>
                              </svg>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {requiresGroupSelection || availableGroups.length > 0 ? (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Group {requiresGroupSelection ? <span className="text-rose-500">*</span> : null}</label>
                  <div className="relative">
                    <select
                      value={classForm.groupId}
                      onChange={(event) => setClassForm({ ...classForm, groupId: event.target.value })}
                      required={requiresGroupSelection}
                      className="w-full appearance-none rounded border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="">{requiresGroupSelection ? 'Select group' : 'Unassigned'}</option>
                      {availableGroups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                      </svg>
                    </span>
                  </div>
                  {requiresGroupSelection ? (
                    <p className="mt-2 text-xs text-slate-500">Select Science, Arts, or Commerce for this higher secondary class.</p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Section <span className="text-rose-500">*</span></label>
                <input
                  value={classForm.section}
                  onChange={(event) => setClassForm({ ...classForm, section: event.target.value })}
                  placeholder="e.g. A"
                  required
                  className="w-full rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit">{editingClass ? 'Save changes' : 'Create class'}</Button>
            </div>
          </form>
        </div>
      </div>

      <div className={`${activeModal === 'subject' ? 'flex' : 'hidden'} fixed inset-0 z-50 items-center justify-center bg-slate-900/40 p-4`}>
        <div className="bg-white rounded w-full max-w-md shadow-2xl">
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">{editingSubject ? 'Edit subject' : 'Add subject'}</h2>
            <button
              type="button"
              onClick={closeModal}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:text-slate-600 focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
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
                className="w-full rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
                  className="w-full rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={subjectForm.gradeId}
                    onChange={(event) => setSubjectForm({ ...subjectForm, gradeId: event.target.value })}
                    required
                    className="w-full appearance-none rounded border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select class</option>
                    {gradeOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            {subjectAvailableGroups.length > 0 ? (
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Group</label>
                <div className="relative">
                  <select
                    value={subjectForm.groupId}
                    onChange={(event) => setSubjectForm({ ...subjectForm, groupId: event.target.value })}
                    className="w-full appearance-none rounded border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Unassigned</option>
                    {subjectAvailableGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd"/>
                    </svg>
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Optionally select a group; subjects can vary by group.</p>
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-3 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit">{editingSubject ? 'Save changes' : 'Create subject'}</Button>
            </div>
          </form>
        </div>
      </div>

      <TeacherAssignmentModal
        open={activeModal === 'assign'}
        onClose={closeModal}
        title="Assign teacher"
        submitLabel="Save assignment"
        teachers={teachers.map((teacher) => ({
          id: teacher.id,
          fullName: teacher.fullName,
          subjectSpecialization: teacher.subjectSpecialization,
        }))}
        classCourses={classes.map((cls) => ({ id: cls.id, name: cls.name, section: cls.section }))}
        subjects={subjects.map((subject) => ({ id: subject.id, name: subject.name, code: subject.code, classCourseId: subject.classCourseId }))}
        assignments={assignments.map((assignment) => ({ subjectId: assignment.subjectId, teacherId: assignment.teacherId }))}
        initialValues={{
          teacherId: assignForm.teacherId,
          classCourseId: assignForm.classCourseId,
          subjectId: assignForm.subjectId,
        }}
        isSubmitting={false}
        onSubmit={async (values) => {
          try {
            await createTeacherAssignment({
              teacherId: values.teacherId,
              classCourseId: values.classCourseId,
              subjectId: values.subjectId,
            });
            await loadData();
            closeModal();
          } catch (err) {
            console.error('Teacher assignment failed:', err);
            const message = err instanceof Error ? err.message : String(err);
            alert(`Unable to assign the teacher. ${message}`);
          }
        }}
      />

      <AmsDeleteComfiramtionModal
        open={activeModal === 'delete' && Boolean(deleteTarget)}
        onClose={closeModal}
        title={deleteTarget?.type === 'class' ? 'Remove class?' : 'Remove subject?'}
        description={
          deleteTarget?.type === 'class'
            ? `${deleteTarget?.label ?? 'This class'} will be removed, along with its subjects and assignments.`
            : `${deleteTarget?.label ?? 'This subject'} will be removed from this class. Any teacher assignment for it will also be cleared.`
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}