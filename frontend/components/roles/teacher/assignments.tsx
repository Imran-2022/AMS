"use client";

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, ClipboardList, Copy, FileText, Layers, Pencil, Plus, Search, Send, Trash2, Eye } from 'lucide-react';
import { AppShell } from '@/shared/layout';
import { AmsDeleteComfiramtionModal, AmsPagination, Button, FileUpload } from '../../ui';
import { getAssignments, getClassCourses, getSubjects, createAssignment, duplicateAssignment as duplicateAssignmentApi, updateAssignment, deleteAssignment, publishAssignment, unpublishAssignment, uploadAttachment, listAttachments, renameAttachment, deleteAttachment } from '@/lib/api';
import type { AssignmentDto, ClassCourseDto, SubjectDto, CreateAssignmentDto, UpdateAssignmentDto } from '@/lib/api';

type AssignmentStatus = 'Published' | 'Draft';
type FilterState = 'all' | 'published' | 'drafts';

type AssignmentFormValues = {
  title: string;
  description: string;
  classCourseId: string;
  classCourseName: string;
  classCourseSection: string;
  subjectId: string;
  subjectName: string;
  deadline: string;
  maxMarks: string;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
};

type ExistingAttachment = {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  sizeBytes: number;
};

const createEmptyForm = (): AssignmentFormValues => ({
  title: '',
  description: '',
  classCourseId: '',
  classCourseName: '',
  classCourseSection: '',
  subjectId: '',
  subjectName: '',
  deadline: '',
  maxMarks: '20',
  allowLateSubmission: false,
  allowResubmission: true,
});

const formatDateForInput = (value: string) => {
  if (!value) return '';
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  if (isoMatch) {
    return value.slice(0, 16);
  }

  const usMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (usMatch) {
    const month = String(Number(usMatch[1])).padStart(2, '0');
    const day = String(Number(usMatch[2])).padStart(2, '0');
    const year = usMatch[3];
    let hour = Number(usMatch[4]);
    const minute = usMatch[5];
    const period = usMatch[6].toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${minute}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold  text-slate-400">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">{icon}</div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

export function TeacherAssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [filter, setFilter] = useState<FilterState>('all');
  const [classFilter, setClassFilter] = useState('All classes');
  const [sectionFilter, setSectionFilter] = useState('All sections');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AssignmentDto | null>(null);
  const [form, setForm] = useState<AssignmentFormValues>(createEmptyForm());
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([]);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
  const [pageSize, setPageSize] = useState<typeof PAGE_SIZE_OPTIONS[number]>(10);
  const [pageIndex, setPageIndex] = useState(0);

  const selectedClassCourseId = searchParams.get('classCourseId');

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoadError(null);
      setLoading(true);
      try {
        const [apiAssignments, apiClasses, apiSubjects] = await Promise.all([getAssignments(), getClassCourses(), getSubjects()]);
        setAssignments(apiAssignments);
        setClasses(apiClasses);
        setSubjects(apiSubjects);
      } catch (error) {
        console.error(error);
        setLoadError('Unable to load assignments. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    if (!form.classCourseId && classes.length && !modalOpen) {
      const defaultClass = classes[0];
      const classSubjects = subjects.filter((subject) => subject.classCourseId === defaultClass.id);
      setForm((current) => ({
        ...current,
        classCourseId: defaultClass.id,
        classCourseName: defaultClass.name,
        classCourseSection: defaultClass.section,
        subjectId: classSubjects[0]?.id ?? '',
        subjectName: classSubjects[0]?.name ?? '',
      }));
      setSelectedClassName(defaultClass.name);
      setSelectedSection(defaultClass.section);
    }
  }, [classes, subjects, form.classCourseId, modalOpen]);

  const selectedClassLabel = useMemo(() => {
    const selectedClass = classes.find((classCourse) => classCourse.id === selectedClassCourseId);
    return selectedClass ? `${selectedClass.name} — ${selectedClass.section}` : null;
  }, [classes, selectedClassCourseId]);

  useEffect(() => {
    setClassFilter(selectedClassLabel ?? 'All classes');
  }, [selectedClassLabel]);

  const visibleAssignments = useMemo(() => {
    return assignments
      .filter((assignment) => {
        const matchesFilter =
          filter === 'all' ||
          (filter === 'published' && assignment.status === 'Published') ||
          (filter === 'drafts' && assignment.status === 'Draft');

        const matchesClass = classFilter === 'All classes' || `${assignment.classCourseName} — ${assignment.classCourseSection}` === classFilter;
        const matchesSection = sectionFilter === 'All sections' || assignment.classCourseSection === sectionFilter;
        const matchesSubject = subjectFilter === 'All subjects' || assignment.subjectName === subjectFilter;
        const matchesSearch = [assignment.title, assignment.subjectName, assignment.classCourseName]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        return matchesFilter && matchesClass && matchesSection && matchesSubject && matchesSearch;
      })
      .sort((a, b) => {
        const aTime = new Date((a.updatedAt ?? a.createdAt) as string).getTime();
        const bTime = new Date((b.updatedAt ?? b.createdAt) as string).getTime();
        return bTime - aTime;
      });
  }, [assignments, classFilter, filter, searchTerm, sectionFilter, subjectFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [filter, classFilter, sectionFilter, subjectFilter, searchTerm, searchParams]);

  const pagedAssignments = useMemo(() => {
    const start = pageIndex * pageSize;
    return visibleAssignments.slice(start, start + pageSize);
  }, [pageIndex, pageSize, visibleAssignments]);

  const stats = useMemo(() => {
    const published = assignments.filter((assignment) => assignment.status === 'Published').length;
    const drafts = assignments.length - published;
    const pendingReviews = 0;

    return {
      total: assignments.length,
      published,
      drafts,
      pendingReviews,
    };
  }, [assignments]);

  const availableClasses = useMemo(() => {
    const classNames = assignments.map((assignment) => `${assignment.classCourseName} — ${assignment.classCourseSection}`);
    if (selectedClassLabel) classNames.push(selectedClassLabel);
    return ['All classes', ...Array.from(new Set(classNames))];
  }, [assignments, selectedClassLabel]);

  const availableSections = useMemo(
    () => ['All sections', ...Array.from(new Set(assignments.map((assignment) => assignment.classCourseSection)))],
    [assignments]
  );

  const availableSubjects = useMemo(
    () => ['All subjects', ...Array.from(new Set(assignments.map((assignment) => assignment.subjectName)))],
    [assignments]
  );

  const classNames = useMemo(
    () => Array.from(new Set(classes.map((cls) => cls.name))),
    [classes]
  );

  const sectionOptions = useMemo(
    () => classes.filter((cls) => cls.name === selectedClassName).map((cls) => cls.section),
    [classes, selectedClassName]
  );

  const selectedClass = useMemo(
    () => classes.find((cls) => cls.name === selectedClassName && cls.section === selectedSection),
    [classes, selectedClassName, selectedSection]
  );

  const availableSubjectsForForm = useMemo(
    () => subjects.filter((subject) => subject.classCourseId === form.classCourseId),
    [subjects, form.classCourseId]
  );

  useEffect(() => {
    if (searchParams.get('create') === '1' && !modalOpen) {
      void openCreateModal();
    }
  }, [searchParams, modalOpen]);

  const openCreateModal = async (assignment?: AssignmentDto) => {
    if (assignment) {
      setEditingAssignment(assignment);
      const assignmentClass = classes.find((c) => c.id === assignment.classCourseId);
      setSelectedClassName(assignmentClass?.name ?? '');
      setSelectedSection(assignmentClass?.section ?? '');
      const fetchedAttachments = await listAttachments('Assignment', assignment.id);
      const attachments = fetchedAttachments.map((item) => ({
        id: item.id,
        originalFileName: item.originalFileName,
        downloadUrl: item.downloadUrl,
        sizeBytes: item.sizeBytes,
      }));

      setExistingAttachments(attachments);
      setRemovedAttachmentIds([]);

      setForm({
        title: assignment.title,
        description: assignment.description,
        classCourseId: assignment.classCourseId,
        classCourseName: assignment.classCourseName,
        classCourseSection: assignment.classCourseSection,
        subjectId: assignment.subjectId,
        subjectName: assignment.subjectName,
        deadline: formatDateForInput(assignment.deadline),
        maxMarks: String(assignment.maxMarks),
        allowLateSubmission: assignment.allowLateSubmission,
        allowResubmission: assignment.allowResubmission,
      });
    } else {
      const defaultClass = classes[0];
      const defaultSubject = subjects.find((subject) => subject.classCourseId === defaultClass?.id);
      setEditingAssignment(null);
      setSelectedClassName(defaultClass?.name ?? '');
      setSelectedSection(defaultClass?.section ?? '');
      setForm({
        title: '',
        description: '',
        classCourseId: defaultClass?.id ?? '',
        classCourseName: defaultClass?.name ?? '',
        classCourseSection: defaultClass?.section ?? '',
        subjectId: defaultSubject?.id ?? '',
        subjectName: defaultSubject?.name ?? '',
        deadline: '',
        maxMarks: '20',
        allowLateSubmission: false,
        allowResubmission: true,
      });
      setAttachmentFiles([]);
      setExistingAttachments([]);
      setRemovedAttachmentIds([]);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAssignment(null);
    setForm(createEmptyForm());
    setAttachmentFiles([]);
    setExistingAttachments([]);
    setRemovedAttachmentIds([]);
    setSelectedClassName('');
    setSelectedSection('');

    if (searchParams.get('create') === '1') {
      router.replace('/roles/teacher/assignments');
    }
  };

  const handleSubmit = async (status?: AssignmentStatus) => {
    if (!form.title.trim() || !form.description.trim() || !form.deadline.trim() || !form.classCourseId || !form.subjectId) {
      return;
    }

    try {
      setLoadError(null);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        classCourseId: form.classCourseId,
        subjectId: form.subjectId,
        deadline: form.deadline,
        maxMarks: Number(form.maxMarks || 20),
        allowLateSubmission: form.allowLateSubmission,
        allowResubmission: form.allowResubmission,
      } as CreateAssignmentDto;

      if (editingAssignment) {
        const realRemovedIds = removedAttachmentIds.filter((id) => !id.startsWith('assignment-record-attachment'));
        if (realRemovedIds.length > 0) {
          await Promise.all(realRemovedIds.map((id) => deleteAttachment(id)));
        }

        const updatedAssignment = await updateAssignment(editingAssignment.id, payload as UpdateAssignmentDto);
        setAssignments((current) => current.map((item) => (item.id === updatedAssignment.id ? updatedAssignment : item)));
        if (attachmentFiles.length > 0) {
          await Promise.all(attachmentFiles.map((file) => uploadAttachment('Assignment', editingAssignment.id, file)));
        }
      } else {
        const createdAssignment = await createAssignment(payload);
        if (attachmentFiles.length > 0) {
          await Promise.all(attachmentFiles.map((file) => uploadAttachment('Assignment', createdAssignment.id, file)));
        }
        setAssignments((current) => [createdAssignment, ...current]);
        if (status === 'Published') {
          const publishedAssignment = await publishAssignment(createdAssignment.id);
          setAssignments((current) => current.map((item) => (item.id === publishedAssignment.id ? publishedAssignment : item)));
        }
      }

      closeModal();
    } catch (error) {
      console.error(error);
      try {
        const msg = error instanceof Error ? error.message : String(error);
        const parsed = (() => {
          try {
            const obj = JSON.parse(msg);
            return obj?.error ?? msg;
          } catch {
            return msg;
          }
        })();
        setLoadError(parsed || 'Unable to save assignment. Please try again.');
      } catch {
        setLoadError('Unable to save assignment. Please try again.');
      }
    }
  };

  const handlePublish = async (assignment: AssignmentDto) => {
    try {
      setLoadError(null);
      const publishedAssignment = await publishAssignment(assignment.id);
      setAssignments((current) => current.map((item) => (item.id === publishedAssignment.id ? publishedAssignment : item)));
    } catch (error) {
      console.error(error);
      try {
        const msg = error instanceof Error ? error.message : String(error);
        const parsed = (() => {
          try {
            const obj = JSON.parse(msg);
            return obj?.error ?? msg;
          } catch {
            return msg;
          }
        })();
        setLoadError(parsed || 'Unable to publish assignment.');
      } catch {
        setLoadError('Unable to publish assignment.');
      }
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleUnpublish = async (assignment: AssignmentDto) => {
    try {
      setLoadError(null);
      const unpublishedAssignment = await unpublishAssignment(assignment.id);
      setAssignments((current) => current.map((item) => (item.id === unpublishedAssignment.id ? unpublishedAssignment : item)));
    } catch (error) {
      console.error(error);
      try {
        const msg = error instanceof Error ? error.message : String(error);
        const parsed = (() => {
          try {
            const obj = JSON.parse(msg);
            return obj?.error ?? msg;
          } catch {
            return msg;
          }
        })();
        setLoadError(parsed || 'Unable to unpublish assignment.');
      } catch {
        setLoadError('Unable to unpublish assignment.');
      }
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDuplicate = async (assignment: AssignmentDto) => {
    try {
      setLoadError(null);
      const duplicate = await duplicateAssignmentApi(assignment.id);
      setAssignments((current) => [duplicate, ...current]);
    } catch (error) {
      console.error(error);
      try {
        const msg = error instanceof Error ? error.message : String(error);
        const parsed = (() => {
          try {
            const obj = JSON.parse(msg);
            return obj?.error ?? msg;
          } catch {
            return msg;
          }
        })();
        setLoadError(parsed || 'Unable to duplicate assignment.');
      } catch {
        setLoadError('Unable to duplicate assignment.');
      }
    } finally {
      setOpenMenuId(null);
    }
  };

  const confirmDelete = (assignment: AssignmentDto) => {
    setPendingDelete(assignment);
    setDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      setLoadError(null);
      await deleteAssignment(pendingDelete.id);
      setAssignments((current) => current.filter((assignment) => assignment.id !== pendingDelete.id));
      setDeleteModalOpen(false);
      setPendingDelete(null);
    } catch (error) {
      console.error(error);
      setLoadError('Unable to delete assignment.');
    }
  };

  const handleClassNameChange = (className: string) => {
    setSelectedClassName(className);
    const firstSection = classes.find((cls) => cls.name === className)?.section ?? '';
    setSelectedSection(firstSection);
  };

  const handleSectionChange = (section: string) => {
    setSelectedSection(section);
    const selected = classes.find((cls) => cls.name === selectedClassName && cls.section === section);
    if (selected) {
      const classSubjects = subjects.filter((subject) => subject.classCourseId === selected.id);
      setForm((current) => ({
        ...current,
        classCourseId: selected.id,
        classCourseName: selected.name,
        classCourseSection: selected.section,
        subjectId: classSubjects[0]?.id ?? current.subjectId,
        subjectName: classSubjects[0]?.name ?? current.subjectName,
      }));
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    const selectedSubject = subjects.find((subject) => subject.id === subjectId);
    setForm((current) => ({
      ...current,
      subjectId,
      subjectName: selectedSubject?.name ?? current.subjectName,
    }));
  };

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My Assignments">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase  text-brand-600">Teacher portal</p>
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
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setFilter('all')} className={`cursor-pointer rounded px-4 py-2 text-sm font-semibold transition ${filter === 'all' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                All <span className="ml-1 font-normal opacity-70">{stats.total}</span>
              </button>
              <button type="button" onClick={() => setFilter('published')} className={`cursor-pointer rounded px-4 py-2 text-sm font-semibold transition ${filter === 'published' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Published <span className="ml-1 font-normal opacity-70">{stats.published}</span>
              </button>
              <button type="button" onClick={() => setFilter('drafts')} className={`cursor-pointer rounded px-4 py-2 text-sm font-semibold transition ${filter === 'drafts' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                Drafts <span className="ml-1 font-normal opacity-70">{stats.drafts}</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                {availableClasses.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                {availableSections.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none focus:border-brand-500">
                {availableSubjects.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="text" placeholder="Search assignments…" className="w-full rounded border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-600 outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{loadError}</div>
        )}

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
            {pagedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/roles/teacher/assignments/${assignment.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/roles/teacher/assignments/${assignment.id}`);
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer transition hover:border-brand-200 hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{assignment.title}</span>
                      <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold ${assignment.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`h-2 w-2 rounded-full ${assignment.status === 'Published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {assignment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium uppercase  text-slate-400">{assignment.classCourseName} — {assignment.classCourseSection} · {assignment.subjectName} · Max marks: {assignment.maxMarks}</p>
                    <p className="mt-3 text-sm text-slate-600">{assignment.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-500">Due: {new Date(assignment.deadline).toLocaleString()}</span>
                      {assignment.attachments && assignment.attachments.length > 0 ? (
                        assignment.attachments.map((attachment) => (
                          <span key={attachment.id} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                            {attachment.originalFileName}
                          </span>
                        ))
                      ) : null}
                    </div>
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.12em] text-slate-500">
                        <span>{assignment.submittedCount ?? 0}/{assignment.totalStudents ?? 0} submitted</span>
                        <span>{Math.round(((assignment.totalStudents ?? 0) > 0 ? ((assignment.submittedCount ?? 0) / (assignment.totalStudents ?? 0)) * 100 : 0))}% complete</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand-600 transition-all duration-300"
                          style={{ width: `${Math.round(((assignment.totalStudents ?? 0) > 0 ? ((assignment.submittedCount ?? 0) / (assignment.totalStudents ?? 0)) * 100 : 0))}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="relative xl:shrink-0">
                    <button
                      type="button"
                      aria-label="Open assignment actions"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuId(openMenuId === assignment.id ? null : assignment.id);
                      }}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:ring-offset-2 focus:ring-offset-white"
                      data-menu-trigger="true"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                    </button>
                    {openMenuId === assignment.id && (
                      <div className="absolute right-0 z-20 mt-2 w-52 rounded border border-slate-200 bg-white p-1.5 shadow-xl" onClick={(event) => event.stopPropagation()}>
                        <button type="button" onClick={() => openCreateModal(assignment)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button type="button" onClick={() => router.push(`/roles/teacher/submissions?assignmentId=${encodeURIComponent(assignment.id)}`)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Eye className="h-4 w-4" /> View submissions
                        </button>
                        <button type="button" onClick={() => handleDuplicate(assignment)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Copy className="h-4 w-4" /> Duplicate
                        </button>
                        {assignment.status === 'Draft' ? (
                          <button type="button" onClick={() => handlePublish(assignment)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                            <Send className="h-4 w-4" /> Publish now
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleUnpublish(assignment)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                            <Layers className="h-4 w-4" /> Unpublish
                          </button>
                        )}
                        <button type="button" onClick={() => confirmDelete(assignment)} className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {visibleAssignments.length > 0 && (
              <AmsPagination
                currentPage={pageIndex}
                pageSize={pageSize}
                totalItems={visibleAssignments.length}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => setPageSize(size as typeof PAGE_SIZE_OPTIONS[number])}
                label="Showing"
                itemLabel="assignments"
              />
            )}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">{editingAssignment ? 'Edit assignment' : 'Create assignment'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Fill in the details, then save as a draft or publish.</p>
                </div>
                <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
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
                    <select value={selectedClassName} onChange={(event) => handleClassNameChange(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100">
                      <option value="" disabled>
                        Select class
                      </option>
                      {classNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Section <span className="text-rose-500">*</span></label>
                    <select value={selectedSection} onChange={(event) => handleSectionChange(event.target.value)} className={`w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 ${!selectedClassName ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-700'}`} disabled={!selectedClassName}>
                      <option value="" disabled>
                        {selectedClassName ? 'Select section' : 'Select class first'}
                      </option>
                      {sectionOptions.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-semibold text-slate-800">Subject <span className="text-rose-500">*</span></label>
                    <select value={form.subjectId} onChange={(event) => handleSubjectChange(event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100" disabled={!selectedClass}>
                      <option value="" disabled>
                        {selectedClass ? 'Select subject' : 'Select class first'}
                      </option>
                      {availableSubjectsForForm.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
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
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Attachments <span className="text-slate-400 font-normal">(optional)</span></label>
                  <FileUpload
                    multiple
                    selectedFiles={attachmentFiles}
                    existingAttachments={existingAttachments}
                    onRemoveExistingAttachment={(id) => {
                      const next = existingAttachments.filter((item) => item.id !== id);
                      setExistingAttachments(next);
                      setRemovedAttachmentIds((current) => (current.includes(id) ? current : [...current, id]));
                    }}
                    onRenameExistingAttachment={async (id, name) => {
                      const attachment = existingAttachments.find((item) => item.id === id);
                      if (!attachment) return;

                      const normalizedName = (() => {
                        const extIndex = attachment.originalFileName.lastIndexOf('.');
                        if (extIndex >= 0) {
                          const extension = attachment.originalFileName.substring(extIndex);
                          return name.endsWith(extension) ? name : `${name}${extension}`;
                        }
                        return name;
                      })();

                      const updateLocal = (updatedName: string) => {
                        setExistingAttachments((current) => current.map((item) => (item.id === id ? { ...item, originalFileName: updatedName } : item)));
                      };

                      try {
                        const renamed = await renameAttachment(id, normalizedName);
                        updateLocal(renamed.originalFileName);
                      } catch (error) {
                        console.error('Unable to rename attachment', error);
                        updateLocal(normalizedName);
                      }
                    }}
                    onFileSelected={(file) => {
                      setAttachmentFiles([file]);
                    }}
                    onFilesSelected={(files) => {
                      setAttachmentFiles(files);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-3xl border-t border-slate-100 bg-slate-50/80 px-7 py-5">
                {editingAssignment ? (
                  <div className="ml-auto flex items-center gap-3">
                    <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
                    <Button type="button" onClick={() => handleSubmit()}>Update Assignment</Button>
                  </div>
                ) : (
                  <>
                    <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="button" variant="secondary" onClick={() => handleSubmit('Draft')}>Save as draft</Button>
                      <Button type="button" onClick={() => handleSubmit('Published')}>Publish</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <AmsDeleteComfiramtionModal
          open={deleteModalOpen && Boolean(pendingDelete)}
          onClose={() => { setDeleteModalOpen(false); setPendingDelete(null); }}
          title="Delete this assignment?"
          description={pendingDelete ? `${pendingDelete.title} will be permanently deleted. This can’t be undone.` : undefined}
          onConfirm={handleDelete}
          confirmVariant="danger"
        >
        </AmsDeleteComfiramtionModal>
      </div>
    </AppShell>
  );
}
