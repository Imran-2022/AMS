"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AppShell } from '@/shared/layout';
import { Button, AmsDeleteComfiramtionModal, AmsPagination, Modal } from '../../ui';
import {
  createClassCourse,
  updateClassCourse,
  createSubject,
  updateSubject,
  deleteClassCourse,
  deleteSubject,
  getClassCourses,
  getSubjects,
  getClassDefinitions,
  getGroupsForClass,
  getAcademicYears,
} from '@/lib/api';
import { getEnrollments } from '@/lib/api/enrollments';
import { getTeacherAssignments } from '@/lib/api/teacherAssignments';
import type { ClassCourseDto, SubjectDto } from '@/lib/api';
import type { TeacherSubjectAssignmentDto } from '@/lib/api/teacherAssignments';

function isHigherSecondaryClassName(className?: string) {
  if (!className) return false;

  const normalized = className.trim().toLowerCase();
  const numericValue = Number.parseInt(normalized.replace(/[^0-9]/g, ''), 10);

  return numericValue >= 9 && numericValue <= 12 || ['nine', 'ten', 'eleven', 'twelve', 'class 9', 'class 10', 'class 11', 'class 12'].includes(normalized);
}

function formatClassCourseLabel(name?: string, section?: string, groupName?: string | null) {
  return [name, section, groupName].filter(Boolean).join(' - ');
}

export function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assignments, setAssignments] = useState<TeacherSubjectAssignmentDto[]>([]);
  const [activeModal, setActiveModal] = useState<'class' | 'subject' | 'view-subjects' | 'delete' | null>(null);
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
  const [classDefinitionMenuOpen, setClassDefinitionMenuOpen] = useState(false);
  const classDefinitionMenuRef = useRef<HTMLDivElement | null>(null);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [viewSubjectsForClass, setViewSubjectsForClass] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('All classes');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('All sections');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All groups');
  const [classStudentCountsState, setClassStudentCountsState] = useState<Record<string, number>>({});
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    void loadData();
    void loadClassDefinitions();
    void loadAcademicYears();
  }, []);

  // Listen for academic year changes and reload data
  useEffect(() => {
    const handleAcademicYearChanged = () => {
      void loadData();
      void loadAcademicYears();
    };

    window.addEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    return () => {
      window.removeEventListener('ams-academic-year-updated', handleAcademicYearChanged);
    };
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

  async function loadData() {
    try {
      setError(null);
      const [apiClasses, apiSubjects, apiAssignments, apiEnrollments] = await Promise.all([
        getClassCourses(),
        getSubjects(),
        getTeacherAssignments(),
        getEnrollments(),
      ]);

      setClasses(apiClasses);
      setSubjects(apiSubjects);
      setAssignments(apiAssignments);

      const enrollmentCounts = apiEnrollments.reduce<Record<string, number>>((acc: Record<string, number>, e: any) => {
        acc[e.classCourseId] = (acc[e.classCourseId] ?? 0) + 1;
        return acc;
      }, {});
      setClassStudentCountsState(enrollmentCounts);
    } catch (err) {
      console.error(err);
      setError('Unable to load class data. Please refresh the page.');
    }
  }

  function openModal(modal: 'class' | 'subject' | 'view-subjects', classCourseId?: string) {
    setActionMenuFor(null);
    setViewSubjectsForClass(null);

    if (modal === 'class') {
      setEditingClass(null);
      const activeYear = academicYears.find((y) => y.isActive)?.id ?? academicYears[0]?.id ?? '';
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
      const selectedClass = classes.find((cls) => cls.id === classCourseId);
      setSubjectForm({
        name: '',
        code: '',
        gradeId: selectedClass?.classDefinitionId ?? classDefinitions[0]?.id ?? '',
        groupId: selectedClass?.groupId ?? '',
      });
    }

    if (modal === 'view-subjects') {
      setViewSubjectsForClass(classCourseId ?? null);
    }

    setActiveModal(modal);
  }

  function closeModal() {
    setActiveModal(null);
    setViewSubjectsForClass(null);
    setEditingSubject(null);
    setSubjectForm({ name: '', code: '', gradeId: classDefinitions[0]?.id ?? '', groupId: '' });
    setEditingClass(null);
    const activeYear = academicYears.find((y) => y.isActive)?.id ?? academicYears[0]?.id ?? '';
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
      const nameToSend = classForm.name || classDefinitions.find((c) => c.id === classForm.classDefinitionId)?.name || '';
      let academicYearId = classForm.year || (academicYears.find((y) => y.isActive)?.id) || '';
      if (!academicYearId) {
        // if academic years were not loaded yet, fetch them directly and pick the active one
        try {
          const years = await getAcademicYears();
          setAcademicYears(years);
          academicYearId = years.find((y) => y.isActive)?.id ?? years[0]?.id ?? '';
        } catch (err) {
          console.error('Failed to load academic years before create:', err);
        }
      }
      if (!academicYearId) {
        alert('No academic year is available. Please create an academic year first.');
        return;
      }
      if (editingClass) {
        await updateClassCourse(editingClass.id, {
          classDefinitionId: classForm.classDefinitionId || undefined,
          groupId: classForm.groupId || undefined,
          name: nameToSend,
          section: classForm.section,
          academicYearId: academicYearId || undefined,
        });
      } else {
        await createClassCourse({
          classDefinitionId: classForm.classDefinitionId || undefined,
          groupId: classForm.groupId || undefined,
          name: nameToSend,
          section: classForm.section,
          academicYearId: academicYearId,
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


  const assignmentMap = useMemo(
    () => Object.fromEntries(assignments.map((assignment) => [assignment.subjectId, assignment])),
    [assignments]
  );

  const availableClassDefinitionIds = useMemo(
    () => new Set(classes.map((cls) => cls.classDefinitionId).filter(Boolean) as string[]),
    [classes]
  );

  const gradeOptions = useMemo(
    () => classDefinitions
      .filter((definition) => availableClassDefinitionIds.has(definition.id))
      .map((definition) => ({ id: definition.id, label: definition.name })),
    [classDefinitions, availableClassDefinitionIds]
  );

  const selectedGradeDefinitionId = useMemo(
    () => classDefinitions.find((definition) => definition.name === selectedGradeFilter)?.id ?? '',
    [selectedGradeFilter, classDefinitions]
  );

  const sectionOptions = useMemo(() => {
    if (selectedGradeFilter === 'All classes' || !selectedGradeDefinitionId) return [];
    return Array.from(
      new Set(
        classes
          .filter((cls) => cls.classDefinitionId === selectedGradeDefinitionId)
          .map((cls) => cls.section)
          .filter(Boolean)
      )
    ).sort();
  }, [classes, selectedGradeDefinitionId, selectedGradeFilter]);

  const groupOptions = useMemo(() => {
    if (selectedGradeFilter === 'All classes' || !selectedGradeDefinitionId) {
      return [];
    }

    const groups = classes
      .filter((cls) => cls.classDefinitionId === selectedGradeDefinitionId && Boolean(cls.groupId))
      .filter((cls) =>
        selectedSectionFilter === 'All sections'
          ? true
          : cls.section === selectedSectionFilter
      )
      .map((cls) => ({ id: cls.groupId as string, name: groupNameMap[cls.groupId ?? ''] ?? cls.groupId ?? '' }));

    return Array.from(new Map(groups.map((group) => [group.id, group])).values());
  }, [classes, selectedGradeDefinitionId, selectedGradeFilter, selectedSectionFilter, groupNameMap]);

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return classes.filter((cls) => {
      const gradeLabel = classDefinitions.find((definition) => definition.id === cls.classDefinitionId)?.name ?? '';
      const matchesGrade = selectedGradeFilter === 'All classes' || gradeLabel === selectedGradeFilter;
      const matchesSection = selectedSectionFilter === 'All sections' || cls.section === selectedSectionFilter;
      const matchesGroup = selectedGroupFilter === 'All groups' || cls.groupId === selectedGroupFilter;
      const matchesSearch =
        !term ||
        `${cls.name} ${cls.section} ${gradeLabel} ${groupNameMap[cls.groupId ?? ''] ?? ''}`.toLowerCase().includes(term);
      return matchesGrade && matchesSection && matchesGroup && matchesSearch;
    });
  }, [classes, search, selectedGradeFilter, selectedSectionFilter, selectedGroupFilter, classDefinitions, groupNameMap]);

  const pagedClasses = useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredClasses.slice(start, start + pageSize);
  }, [filteredClasses, pageIndex, pageSize]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(filteredClasses.length / pageSize)), [filteredClasses.length, pageSize]);

  useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  const selectedClassDefinition = classDefinitions.find((definition) => definition.id === classForm.classDefinitionId);
  const selectedClassDefinitionLabel = selectedClassDefinition?.name ?? 'Select class';
  const requiresGroupSelection = isHigherSecondaryClassName(selectedClassDefinition?.name);

  const classSubjectCounts = useMemo(
    () =>
      subjects.reduce<Record<string, number>>((acc, subject) => {
        acc[subject.classCourseId] = (acc[subject.classCourseId] ?? 0) + 1;
        return acc;
      }, {}),
    [subjects]
  );

  const summaryMetrics = useMemo(() => {
    const classIds = new Set(classes.map((cls) => cls.id));
    const totalClasses = classes.length;
    const totalSections = classes.filter((cls) => cls.section).length;
    const totalGroups = new Set(classes.filter((cls) => cls.groupId).map((cls) => cls.groupId as string)).size;
    const totalStudents = classes.reduce((sum, cls) => sum + (classStudentCountsState[cls.id] ?? 0), 0);
    const missingTeacherClassIds = new Set(
      subjects
        .filter((subject) => classIds.has(subject.classCourseId) && !assignmentMap[subject.id])
        .map((subject) => subject.classCourseId)
    );
    return {
      totalClasses,
      totalSections,
      totalGroups,
      totalStudents,
      classesMissingTeacher: missingTeacherClassIds.size,
    };
  }, [classes, classStudentCountsState, subjects, assignmentMap]);

  return (
    <AppShell role="Admin" breadcrumb="Admin / Classes & subjects">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Classes &amp; subjects</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={() => openModal('subject')}
              className="px-4 py-2.5 flex items-center gap-2"
              variant="secondary"
            >
              + Add subject
            </Button>
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
        </div>

        {error ? (
          <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">CLASSES</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.totalClasses}</p>
            <p className="mt-1 text-xs text-slate-400">Total class records</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">SECTIONS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.totalSections}</p>
            <p className="mt-1 text-xs text-slate-400">Distinct sections</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">STUDENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V8a4 4 0 0 1 4-4z"/><path d="M6 20a6 6 0 0 1 12 0"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.totalStudents}</p>
            <p className="mt-1 text-xs text-slate-400">Enrolled students</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-400">TEACHER ALLOCATION</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12v-2"/><path d="M12 16v-1"/><path d="M12 20c4.418 0 8-1.79 8-4v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2c0 2.21 3.582 4 8 4z"/><circle cx="12" cy="7" r="3"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{summaryMetrics.classesMissingTeacher}</p>
            <p className="mt-1 text-xs text-slate-400">Classes missing teacher allocation</p>
          </div>
        </div>

        {classes.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedGradeFilter}
                onChange={(event) => {
                  setSelectedGradeFilter(event.target.value);
                  setSelectedSectionFilter('All sections');
                  setSelectedGroupFilter('All groups');
                  setPageIndex(0);
                }}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white"
              >
                <option>All classes</option>
                {gradeOptions.map((option) => (
                  <option key={option.id} value={option.label}>{option.label}</option>
                ))}
              </select>
              <select
                value={selectedSectionFilter}
                onChange={(event) => { setSelectedSectionFilter(event.target.value); setSelectedGroupFilter('All groups'); setPageIndex(0); }}
                disabled={selectedGradeFilter === 'All classes'}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option>All sections</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
              {selectedGradeFilter !== 'All classes' && selectedSectionFilter !== 'All sections' && groupOptions.length > 0 ? (
                <select
                  value={selectedGroupFilter}
                  onChange={(event) => { setSelectedGroupFilter(event.target.value); setPageIndex(0); }}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white"
                >
                  <option>All groups</option>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>{group.name || group.id}</option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="relative max-w-xs w-full md:w-auto">
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPageIndex(0); }}
                type="text"
                placeholder="Search classes…"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {filteredClasses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-8 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 mx-auto">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h10" />
                </svg>
              </div>
              <p className="text-base font-bold text-slate-800">No classes found</p>
              <p className="mt-2 max-w-md text-sm text-slate-500 mx-auto">
                {search || selectedGradeFilter !== 'All classes' || selectedSectionFilter !== 'All sections' || selectedGroupFilter !== 'All groups'
                  ? 'Try a different search or filter to find the class you need.'
                  : 'There are no classes available yet. Add a class to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pagedClasses.map((cls) => (
                <div key={cls.id} className="bg-white rounded border border-slate-200 p-5">
                  <div className="flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-slate-800">{formatClassCourseLabel(cls.name, cls.section, cls.groupId ? (groupNameMap[cls.groupId] ?? cls.groupName ?? '') : cls.groupName ?? undefined)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {cls.academicYear}
                      </span>
                    </div>
                  </div>
                  <div className="relative inline-flex">
                    <button
                      type="button" data-action-button={`class-${cls.id}`}
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
                          onClick={() => openModal('subject', cls.id)}
                          className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Add subjects
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => openModal('view-subjects', cls.id)}
                          className="w-full justify-start rounded-none px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          View subjects
                        </Button>
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
          )}

          {classes.length > 0 && filteredClasses.length > 0 ? (
            <AmsPagination
              currentPage={pageIndex}
              pageSize={pageSize}
              totalItems={filteredClasses.length}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
              label="Showing"
              itemLabel="classes"
            />
          ) : null}
        </div>

        {/* Subjects & teacher allocation moved to Teacher allocation page */}

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
              {/* Academic year is auto-selected to the active year; not shown in the UI */}

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">Class <span className="text-rose-500">*</span></label>
                <div ref={classDefinitionMenuRef} className="relative" data-class-definition-menu>
                  <button
                    type="button" onClick={() => setClassDefinitionMenuOpen((open) => !open)}
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
                            type="button" onClick={() => {
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

{/* Subject creation/editing moved to Teacher allocation page */}

      <Modal open={activeModal === 'view-subjects'} onClose={closeModal} title={(() => {
        const selectedClass = classes.find((cls) => cls.id === viewSubjectsForClass);
        if (!selectedClass) return 'Class subjects';
        return formatClassCourseLabel(selectedClass.name, selectedClass.section, selectedClass.groupId ? (groupNameMap[selectedClass.groupId] ?? selectedClass.groupName ?? '') : selectedClass.groupName ?? undefined);
      })()} description="View all subjects that belong to this class.">
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

      {/* Teacher assignment moved to Teacher allocation page */}

      </div>

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