'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Button, Modal } from '@/shared/ui';
import { getSubjects, type SubjectDto } from '@/lib/api';

export type AddTeacherFormData = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive' | 'On leave';
  phone?: string;
  gender?: string;
  qualification?: string;
  joiningDate?: string;
  subjectSpecializations?: string[];
  avatarUrl?: string;
};

type AddTeacherModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  initialValues?: AddTeacherFormData;
  isSubmitting?: boolean;
  requirePassword?: boolean;
  onSubmit: (values: AddTeacherFormData) => Promise<void>;
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

/**
 * Validates Bangladesh mobile number format
 * Accepts:
 * - Domestic: 11 digits starting with 01 (e.g., 01712345678)
 * - International: 14 digits with +88 prefix (e.g., +8801712345678)
 */
function isValidMobileNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Remove spaces and hyphens
  const cleaned = phone.replace(/[\s\-]/g, '');
  
  // Domestic format: exactly 11 digits, starts with 01
  const domesticPattern = /^01\d{9}$/;
  if (domesticPattern.test(cleaned)) {
    return true;
  }
  
  // International format: +88 followed by 11 digits (01X XXXXXXXX)
  const internationalPattern = /^\+8801\d{9}$/;
  if (internationalPattern.test(cleaned)) {
    return true;
  }
  
  return false;
}

export function AddTeacherModal({
  open,
  onClose,
  title,
  submitLabel,
  initialValues,
  isSubmitting = false,
  requirePassword = false,
  onSubmit,
}: AddTeacherModalProps) {
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const uniqueSubjects = useMemo(() => {
    const seen = new Set<string>();
    return subjects.filter((subject) => {
      if (!subject.name) return false;
      if (seen.has(subject.name)) return false;
      seen.add(subject.name);
      return true;
    });
  }, [subjects]);

  const [values, setValues] = useState<AddTeacherFormData>({
    fullName: '',
    email: '',
    password: '',
    status: 'Active',
    phone: '',
    gender: '',
    qualification: '',
    joiningDate: '',
    subjectSpecializations: [],
    avatarUrl: '',
  });

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        const apiSubjects = await getSubjects();
        setSubjects(apiSubjects);
      } catch (err) {
        console.error('Failed to load subjects for teacher specialization', err);
      }
    })();

    setValues({
      fullName: initialValues?.fullName ?? '',
      email: initialValues?.email ?? '',
      password: initialValues?.password ?? '',
      status: initialValues?.status ?? 'Active',
      phone: initialValues?.phone ?? '',
      gender: initialValues?.gender ?? '',
      qualification: initialValues?.qualification ?? '',
      joiningDate: normalizeDate(initialValues?.joiningDate),
      subjectSpecializations: Array.isArray(initialValues?.subjectSpecializations)
        ? [...initialValues.subjectSpecializations]
        : [],
      avatarUrl: initialValues?.avatarUrl ?? '',
    });
  }, [open]);

  function handleChange<Key extends keyof AddTeacherFormData>(field: Key, value: AddTeacherFormData[Key]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSpecializationChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
    setValues((current) => ({ ...current, subjectSpecializations: selected }));
  }

  function toggleSubjectSelection(subjectName: string) {
    setValues((current) => {
      const selected = current.subjectSpecializations ?? [];
      const next = selected.includes(subjectName)
        ? selected.filter((name) => name !== subjectName)
        : [...selected, subjectName];
      return { ...current, subjectSpecializations: next };
    });
  }

  async function handleSubmit() {
    if (!values.gender) {
      alert('Gender is required.');
      return;
    }

    if (!values.phone) {
      alert('Phone number is required.');
      return;
    }

    if (!isValidMobileNumber(values.phone)) {
      alert('Phone number must be valid Bangladesh format:\n- Domestic: 11 digits starting with 01 (e.g., 01712345678)\n- International: +88 prefix (e.g., +8801712345678)');
      return;
    }

    if (!values.qualification?.trim()) {
      alert('Qualification is required.');
      return;
    }

    if (!values.subjectSpecializations || values.subjectSpecializations.length === 0) {
      alert('Please select at least one subject specialization.');
      return;
    }

    try {
      await onSubmit(values);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Fill in the teacher details to continue."
      className="max-w-2xl h-[min(90vh,calc(100vh-2rem))]"
      footer={
        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        {/* ## Add teacher modal - Image upload (optional) - commented out for now
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-dashed border-amber-200 flex items-center justify-center text-amber-400 shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        */}

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
                placeholder="Teacher name"
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
              <label className={labelClass}>
                Phone number <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className={inputClass}
                type="tel"
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={values.gender}
                onChange={(event) => handleChange('gender', event.target.value)}
                className={`${inputClass} text-slate-700`}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Password{requirePassword ? ' ' : ' (optional)'}{requirePassword ? <span className="text-rose-500">*</span> : null}
              </label>
              <input
                value={values.password}
                onChange={(event) => handleChange('password', event.target.value)}
                placeholder={requirePassword ? 'Create a password' : 'Leave blank to keep current password'}
                className={inputClass}
                type="password"
                required={requirePassword}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={values.status}
                onChange={(event) => handleChange('status', event.target.value as AddTeacherFormData['status'])}
                className={`${inputClass} text-slate-700`}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>On leave</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className={sectionTitleClass}>PROFESSIONAL DETAILS</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Qualification <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.qualification}
                onChange={(event) => handleChange('qualification', event.target.value)}
                placeholder="e.g. M.Sc in Mathematics"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                Joining date <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.joiningDate}
                onChange={(event) => handleChange('joiningDate', event.target.value)}
                className={`${inputClass} text-slate-500`}
                type="date"
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>
              Subject specialization <span className="text-rose-500">*</span>
            </label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap gap-2">
                {uniqueSubjects.map((subject) => {
                  const checked = (values.subjectSpecializations ?? []).includes(subject.name);
                  return (
                    <label
                      key={subject.name}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        checked
                          ? 'border-brand-500 bg-brand-100 text-brand-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSubjectSelection(subject.name)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="select-none">{subject.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <p className={hintClass}>Select all subjects that apply.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
