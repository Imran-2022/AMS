'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Modal } from '@/shared/ui';

type ClassCourseOption = {
  id: string;
  name: string;
  section: string;
  groupName?: string;
};

type SubjectOption = {
  id: string;
  name: string;
  code?: string;
  classCourseId: string;
};

type TeacherOption = {
  id: string;
  fullName: string;
  subjectSpecialization?: string;
};

type TeacherAssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  teachers: TeacherOption[];
  classCourses: ClassCourseOption[];
  subjects: SubjectOption[];
  assignments?: { subjectId: string; teacherId: string }[];
  initialValues?: {
    teacherId?: string;
    classCourseId?: string;
    subjectId?: string;
  };
  isSubmitting?: boolean;
  onSubmit: (values: { teacherId: string; classCourseId: string; subjectId: string }) => Promise<void>;
};

const inputClass =
  'w-full rounded-[12px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-2 block text-[13px] font-semibold text-slate-800';
const hintClass = 'mt-1 text-[11.5px] text-slate-400';

export function TeacherAssignmentModal({
  open,
  onClose,
  title,
  submitLabel,
  teachers,
  classCourses,
  subjects,
  assignments,
  initialValues,
  isSubmitting = false,
  onSubmit,
}: TeacherAssignmentModalProps) {
  const [teacherId, setTeacherId] = useState(initialValues?.teacherId ?? '');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subjectId, setSubjectId] = useState(initialValues?.subjectId ?? '');

  const classNames = Array.from(new Set(classCourses.map((cls) => cls.name)));
  const sectionOptions = Array.from(
    new Map(
      classCourses
        .filter((cls) => cls.name === selectedClassName)
        .map((cls) => [`${cls.name}|${cls.section}|${cls.groupName ?? 'default'}`, cls])
    ).values()
  );
  const selectedClass = classCourses.find((cls) => cls.name === selectedClassName && cls.section === selectedSection);
  const classCourseId = selectedClass?.id ?? '';

  const normalizeSubjectSpecializations = (raw?: string) =>
    (raw ?? '')
      .split(',')
      .map((v) => v.trim())
      .map((val) => val.split('—')[0].trim())
      .filter(Boolean);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === subjectId) ?? null,
    [subjects, subjectId]
  );

  const assignedTeacherIds = useMemo(
    () => new Set((assignments ?? []).filter((assignment) => assignment.subjectId === selectedSubject?.id).map((assignment) => assignment.teacherId)),
    [assignments, selectedSubject]
  );

  // Specialization is a hint for sorting, not a gate for who can be assigned.
  // A hard filter here is fragile (exact string match against subject.name,
  // split on commas/em-dashes) -- a teacher whose specialization text
  // doesn't line up perfectly shouldn't become impossible to select. Every
  // teacher stays in the list; matching ones are just surfaced first.
  const isSpecializedFor = (teacher: TeacherOption, subject: SubjectOption | null) => {
    if (!subject) return false;
    const want = subject.name.toLowerCase();
    return normalizeSubjectSpecializations(teacher.subjectSpecialization).some((spec) => spec.toLowerCase() === want);
  };

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => {
      const aMatch = isSpecializedFor(a, selectedSubject) || assignedTeacherIds.has(a.id);
      const bMatch = isSpecializedFor(b, selectedSubject) || assignedTeacherIds.has(b.id);
      if (aMatch === bMatch) return a.fullName.localeCompare(b.fullName);
      return aMatch ? -1 : 1;
    });
  }, [teachers, selectedSubject, assignedTeacherIds]);

  useEffect(() => {
    setTeacherId(initialValues?.teacherId ?? '');
    const initialClass = classCourses.find((cls) => cls.id === initialValues?.classCourseId) ?? classCourses[0];
    setSelectedClassName(initialClass?.name ?? '');
    setSelectedSection(initialClass?.section ?? '');
    setSubjectId(initialValues?.subjectId ?? '');
  }, [initialValues, classCourses, open]);

  useEffect(() => {
    if (teacherId && !sortedTeachers.some((teacher) => teacher.id === teacherId)) {
      setTeacherId('');
    }
  }, [sortedTeachers, teacherId]);

  const availableSubjects = useMemo(
    () => subjects.filter((subject) => subject.classCourseId === selectedClass?.id),
    [subjects, selectedClass?.id]
  );

  useEffect(() => {
    if (selectedClass && !availableSubjects.some((subject) => subject.id === subjectId)) {
      setSubjectId(availableSubjects[0]?.id ?? '');
    }

    if (!selectedClass) {
      setSubjectId('');
    }
  }, [availableSubjects, selectedClass, subjectId]);

  const canSubmit = Boolean(teacherId && classCourseId && subjectId && teachers.length && classCourses.length && availableSubjects.length);

  async function handleSubmit() {
    if (!canSubmit) return;
    await onSubmit({ teacherId, classCourseId, subjectId });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Link a teacher to a class, section and subject."
      className="max-w-lg h-[min(90vh,calc(100vh-2rem))]"
      footer={
        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" className="min-w-[140px]" disabled={isSubmitting || !canSubmit} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className={labelClass}>
            Teacher <span className="text-rose-500">*</span>
          </label>
          <div>
            <select
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select teacher
              </option>
              {sortedTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {isSpecializedFor(teacher, selectedSubject) ? `${teacher.fullName} — Recommended` : teacher.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Class <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedClassName}
              onChange={(event) => {
                setSelectedClassName(event.target.value);
                const firstSection = classCourses.find((cls) => cls.name === event.target.value)?.section ?? '';
                setSelectedSection(firstSection);
              }}
              className={inputClass}
            >
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
            <label className={labelClass}>
              Section <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSection}
              onChange={(event) => setSelectedSection(event.target.value)}
              className={`${inputClass} ${!selectedClassName ? 'text-slate-400' : 'text-slate-700'}`}
              disabled={!selectedClassName}
            >
              <option value="" disabled>
                {selectedClassName ? 'Select section' : 'Select class first'}
              </option>
              {sectionOptions.map((option) => (
                <option key={`${selectedClassName}-${option.section}-${option.groupName ?? 'default'}`} value={option.section}>
                  {option.section}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Subject <span className="text-rose-500">*</span>
          </label>
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className={inputClass}
            disabled={!selectedClass}
          >
            <option value="" disabled>
              {selectedClass ? 'Select subject' : 'Select class first'}
            </option>
            {availableSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code ? `${subject.name} — ${subject.code}` : subject.name}
              </option>
            ))}
          </select>
        </div>

      </div>
    </Modal>
  );
}
