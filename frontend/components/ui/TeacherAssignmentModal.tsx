'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

type ClassCourseOption = {
  id: string;
  name: string;
  section: string;
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
};

type TeacherAssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  teachers: TeacherOption[];
  classCourses: ClassCourseOption[];
  subjects: SubjectOption[];
  initialValues?: {
    teacherId?: string;
    classCourseId?: string;
    subjectId?: string;
  };
  isSubmitting?: boolean;
  onSubmit: (values: { teacherId: string; classCourseId: string; subjectId: string }) => Promise<void>;
};

export function TeacherAssignmentModal({
  open,
  onClose,
  title,
  submitLabel,
  teachers,
  classCourses,
  subjects,
  initialValues,
  isSubmitting = false,
  onSubmit,
}: TeacherAssignmentModalProps) {
  const [teacherId, setTeacherId] = useState(initialValues?.teacherId ?? '');
  const [classCourseId, setClassCourseId] = useState(initialValues?.classCourseId ?? '');
  const [subjectId, setSubjectId] = useState(initialValues?.subjectId ?? '');

  useEffect(() => {
    setTeacherId(initialValues?.teacherId ?? '');
    setClassCourseId(initialValues?.classCourseId ?? classCourses[0]?.id ?? '');
    setSubjectId(initialValues?.subjectId ?? '');
  }, [initialValues, classCourses, open]);

  useEffect(() => {
    if (!classCourseId && classCourses.length) {
      setClassCourseId(classCourses[0].id);
    }
  }, [classCourseId, classCourses]);

  const availableSubjects = useMemo(
    () => subjects.filter((subject) => subject.classCourseId === classCourseId),
    [subjects, classCourseId]
  );

  useEffect(() => {
    if (!subjectId && availableSubjects.length) {
      setSubjectId(availableSubjects[0].id);
    }
  }, [availableSubjects, subjectId]);

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
      description="Link a teacher to a class and subject."
      footer={
        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting || !canSubmit} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Teacher</label>
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="" disabled>
              Select teacher
            </option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
          <select
            value={classCourseId}
            onChange={(event) => setClassCourseId(event.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="" disabled>
              Select class
            </option>
            {classCourses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} — {cls.section}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
        <select
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          disabled={!availableSubjects.length}
        >
          <option value="" disabled>
            {availableSubjects.length ? 'Select subject' : 'Select class first'}
          </option>
          {availableSubjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
}
