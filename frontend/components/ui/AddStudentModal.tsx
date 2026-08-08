'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

type ClassCourseOption = {
  id: string;
  name: string;
  section: string;
};

export type AddStudentFormData = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive' | 'Pending';
  dateOfBirth?: string;
  gender?: string;
  studentId?: string;
  className?: string;
  section?: string;
  admissionDate?: string;
  guardianName?: string;
  parentMobile?: string;
  guardianEmail?: string;
  avatarUrl?: string;
};

type AddStudentModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  classCourses: ClassCourseOption[];
  initialValues?: AddStudentFormData;
  isSubmitting?: boolean;
  requirePassword?: boolean;
  studentIdReadOnly?: boolean;
  hidePasswordField?: boolean;
  onSubmit: (values: AddStudentFormData) => Promise<void>;
};

const inputClass =
  'w-full rounded-[12px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100';
const labelClass = 'mb-2 block text-[13px] font-semibold text-slate-800';
const hintClass = 'mt-1 text-[11.5px] text-slate-500';
const sectionTitleClass = 'text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-600';

function normalizeDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function AddStudentModal({
  open,
  onClose,
  title,
  submitLabel,
  classCourses,
  initialValues,
  isSubmitting = false,
  requirePassword = false,
  studentIdReadOnly = false,
  hidePasswordField = false,
  onSubmit,
}: AddStudentModalProps) {
  const [values, setValues] = useState<AddStudentFormData>({
    fullName: '',
    email: '',
    password: '',
    status: 'Active',
    dateOfBirth: '',
    gender: '',
    studentId: '',
    className: classCourses[0]?.name ?? '',
    section: classCourses[0]?.section ?? '',
    admissionDate: '',
    guardianName: '',
    parentMobile: '',
    guardianEmail: '',
    avatarUrl: '',
  });

  useEffect(() => {
    if (!open) return;
    setValues({
      fullName: initialValues?.fullName ?? '',
      email: initialValues?.email ?? '',
      password: initialValues?.password ?? '',
      status: initialValues?.status ?? 'Active',
      dateOfBirth: normalizeDate(initialValues?.dateOfBirth),
      gender: initialValues?.gender ?? '',
      studentId: initialValues?.studentId ?? '',
      className: initialValues?.className ?? classCourses[0]?.name ?? '',
      section: initialValues?.section ?? classCourses[0]?.section ?? '',
      admissionDate: normalizeDate(initialValues?.admissionDate),
      guardianName: initialValues?.guardianName ?? '',
      parentMobile: initialValues?.parentMobile ?? '',
      guardianEmail: initialValues?.guardianEmail ?? '',
      avatarUrl: initialValues?.avatarUrl ?? '',
    });
  }, [open, initialValues, classCourses]);

  useEffect(() => {
    if (classCourses.length && !values.className) {
      setValues((current) => ({
        ...current,
        className: classCourses[0].name,
        section: classCourses[0].section,
      }));
    }
  }, [classCourses, values.className]);

  const sectionOptions = useMemo(
    () => Array.from(new Set(classCourses.filter((cls) => cls.name === values.className).map((cls) => cls.section))),
    [classCourses, values.className]
  );

  useEffect(() => {
    if (sectionOptions.length && values.section && !sectionOptions.includes(values.section)) {
      setValues((current) => ({ ...current, section: sectionOptions[0] }));
    }
  }, [sectionOptions, values.section]);

  function handleChange<Key extends keyof AddStudentFormData>(field: Key, value: AddStudentFormData[Key]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Fill in the student details to continue."
      className="max-w-2xl h-[min(90vh,calc(100vh-2rem))]"
      footer={
        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => onSubmit(values)}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center text-indigo-400 shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" transform="rotate(90 12 12)" />
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <div>
            <button type="button" className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Upload photo
            </button>
            <p className={hintClass}>Optional · JPG or PNG, up to 2MB</p>
          </div>
        </div>

        <div>
          <p className={sectionTitleClass}>BASIC INFORMATION</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Full name <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.fullName}
                onChange={(event) => handleChange('fullName', event.target.value)}
                placeholder="Student name"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.email}
                onChange={(event) => handleChange('email', event.target.value)}
                placeholder="email@example.com"
                className={inputClass}
                type="email"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Date of birth</label>
              <input
                value={values.dateOfBirth}
                onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                className={`${inputClass} text-slate-500`}
                type="date"
              />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={values.gender}
                onChange={(event) => handleChange('gender', event.target.value)}
                className={`${inputClass} text-slate-700`}>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            {!hidePasswordField && (
              <div>
                <label className={labelClass}>
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  value={values.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="Create a password"
                  className={inputClass}
                  type="password"
                  required={requirePassword}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={values.status}
                onChange={(event) => handleChange('status', event.target.value as AddStudentFormData['status'])}
                className={`${inputClass} text-slate-700`}>
                <option>Active</option>
                <option>Inactive</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className={sectionTitleClass}>ACADEMIC DETAILS</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Roll no. / Student ID</label>
              <input
                value={values.studentId}
                onChange={(event) => handleChange('studentId', event.target.value)}
                placeholder="e.g. STU-0142"
                className={`${inputClass} ${studentIdReadOnly ? 'bg-slate-100 text-slate-500' : ''}`}
                readOnly={studentIdReadOnly}
              />
            </div>
            <div>
              <label className={labelClass}>
                Class <span className="text-rose-500">*</span>
              </label>
              <select
                value={values.className}
                onChange={(event) => handleChange('className', event.target.value)}
                className={`${inputClass} text-slate-700`}>
                <option value="">No classes loaded</option>
                {classCourses.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Section <span className="text-rose-500">*</span>
              </label>
              <select
                value={values.section}
                onChange={(event) => handleChange('section', event.target.value)}
                className={`${inputClass} ${!values.className ? 'text-slate-400' : 'text-slate-700'}`}>
                <option value="">{values.className ? 'Select section' : 'Select class first'}</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Admission date</label>
            <input
              value={values.admissionDate}
              onChange={(event) => handleChange('admissionDate', event.target.value)}
              className={`${inputClass} max-w-[240px] text-slate-500`}
              type="date"
            />
          </div>
        </div>

        <div>
          <p className={sectionTitleClass}>GUARDIAN / PARENT INFORMATION</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Guardian name</label>
              <input
                value={values.guardianName}
                onChange={(event) => handleChange('guardianName', event.target.value)}
                placeholder="Parent or guardian's name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Guardian mobile <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.parentMobile}
                onChange={(event) => handleChange('parentMobile', event.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className={inputClass}
                type="tel"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Guardian email <span className="text-slate-400 font-normal">(optional — for notifications)</span>
              </label>
              <input
                value={values.guardianEmail}
                onChange={(event) => handleChange('guardianEmail', event.target.value)}
                placeholder="guardian@example.com"
                className={inputClass}
                type="email"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
