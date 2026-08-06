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
    role?: 'Subject teacher' | 'Class teacher';
    academicYear?: string;
  };
  isSubmitting?: boolean;
  onSubmit: (values: { teacherId: string; classCourseId: string; subjectId: string; role: 'Subject teacher' | 'Class teacher'; academicYear: string }) => Promise<void>;
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
  initialValues,
  isSubmitting = false,
  onSubmit,
}: TeacherAssignmentModalProps) {
  const [teacherId, setTeacherId] = useState(initialValues?.teacherId ?? '');
  const [teacherQuery, setTeacherQuery] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [subjectId, setSubjectId] = useState(initialValues?.subjectId ?? '');
  const [role, setRole] = useState(initialValues?.role ?? 'Subject teacher');
  const [academicYear, setAcademicYear] = useState(initialValues?.academicYear ?? '2026 – 2027');

  const classNames = Array.from(new Set(classCourses.map((cls) => cls.name)));
  const sectionOptions = classCourses
    .filter((cls) => cls.name === selectedClassName)
    .map((cls) => cls.section);
  const selectedClass = classCourses.find((cls) => cls.name === selectedClassName && cls.section === selectedSection);
  const classCourseId = selectedClass?.id ?? '';

  const teacherNameMap = Object.fromEntries(teachers.map((teacher) => [teacher.fullName, teacher.id]));

  useEffect(() => {
    if (teacherId) {
      const selectedTeacher = teachers.find((teacher) => teacher.id === teacherId);
      setTeacherQuery(selectedTeacher?.fullName ?? '');
    }
  }, [teacherId, teachers]);

  useEffect(() => {
    setTeacherId(initialValues?.teacherId ?? '');
    const initialClass = classCourses.find((cls) => cls.id === initialValues?.classCourseId) ?? classCourses[0];
    setSelectedClassName(initialClass?.name ?? '');
    setSelectedSection(initialClass?.section ?? '');
    setSubjectId(initialValues?.subjectId ?? '');
    setRole(initialValues?.role ?? 'Subject teacher');
    setAcademicYear(initialValues?.academicYear ?? '2026 – 2027');
  }, [initialValues, classCourses, open]);

  useEffect(() => {
    if (teacherQuery && teacherNameMap[teacherQuery]) {
      setTeacherId(teacherNameMap[teacherQuery]);
    }

    if (!teacherQuery) {
      setTeacherId('');
    }
  }, [teacherQuery, teacherNameMap]);

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
    await onSubmit({ teacherId, classCourseId, subjectId, role, academicYear });
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
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              list="teacher-list"
              value={teacherQuery}
              onChange={(event) => setTeacherQuery(event.target.value)}
              placeholder="Search teacher by name..."
              className={`${inputClass} pl-10`}
            />
            <datalist id="teacher-list">
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.fullName} />
              ))}
            </datalist>
          </div>
          <p className={hintClass}>Suggestions are filtered by subject specialization once you pick a subject below.</p>
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
              {sectionOptions.map((section) => (
                <option key={section} value={section}>
                  {section}
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
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Role</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 rounded-[1.25rem] border px-4 py-4 cursor-pointer transition ${role === 'Subject teacher' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="role"
                  value="Subject teacher"
                  checked={role === 'Subject teacher'}
                  onChange={() => setRole('Subject teacher')}
                  className="accent-brand-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Subject teacher</p>
                  <p className="text-[11px] text-slate-400">Teaches one subject</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 rounded-[1.25rem] border px-4 py-4 cursor-pointer transition ${role === 'Class teacher' ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="role"
                  value="Class teacher"
                  checked={role === 'Class teacher'}
                  onChange={() => setRole('Class teacher')}
                  className="accent-brand-600"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Class teacher</p>
                  <p className="text-[11px] text-slate-400">Owns the whole class</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Academic year</label>
            <select
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              className={`${inputClass} max-w-[220px]`}
            >
              <option>2026 – 2027</option>
              <option>2025 – 2026</option>
            </select>
            <p className={hintClass}>Optional field for record keeping.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
