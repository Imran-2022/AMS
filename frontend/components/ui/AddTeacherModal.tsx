'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

type AddTeacherFormData = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive' | 'On leave';
  phone?: string;
  employeeId?: string;
  qualification?: string;
  joiningDate?: string;
  subjectSpecialization?: string;
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
  const [values, setValues] = useState<AddTeacherFormData>({
    fullName: '',
    email: '',
    password: '',
    status: 'Active',
    phone: '',
    employeeId: '',
    qualification: '',
    joiningDate: '',
    subjectSpecialization: '',
    avatarUrl: '',
  });

  useEffect(() => {
    setValues({
      fullName: initialValues?.fullName ?? '',
      email: initialValues?.email ?? '',
      password: initialValues?.password ?? '',
      status: initialValues?.status ?? 'Active',
      phone: initialValues?.phone ?? '',
      employeeId: initialValues?.employeeId ?? '',
      qualification: initialValues?.qualification ?? '',
      joiningDate: initialValues?.joiningDate ?? '',
      subjectSpecialization: initialValues?.subjectSpecialization ?? '',
      avatarUrl: initialValues?.avatarUrl ?? '',
    });
  }, [initialValues, open]);

  function handleChange<Key extends keyof AddTeacherFormData>(field: Key, value: AddTeacherFormData[Key]) {
    setValues((current) => ({ ...current, [field]: value }));
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
          <Button type="button" disabled={isSubmitting} onClick={() => onSubmit(values)}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
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
              <label className={labelClass}>Employee ID</label>
              <input
                value={values.employeeId}
                onChange={(event) => handleChange('employeeId', event.target.value)}
                placeholder="e.g. EMP-0032"
                className={inputClass}
              />
            </div>
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
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={values.status}
                onChange={(event) => handleChange('status', event.target.value as AddTeacherFormData['status'])}
                className={`${inputClass} text-slate-700`}>
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
              <label className={labelClass}>Qualification <span className="text-slate-400 font-normal">(optional)</span></label>
              <input
                value={values.qualification}
                onChange={(event) => handleChange('qualification', event.target.value)}
                placeholder="e.g. M.Sc in Mathematics"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Joining date</label>
              <input
                value={values.joiningDate}
                onChange={(event) => handleChange('joiningDate', event.target.value)}
                className={`${inputClass} text-slate-500`}
                type="date"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Subject specialization</label>
            <input
              value={values.subjectSpecialization}
              onChange={(event) => handleChange('subjectSpecialization', event.target.value)}
              placeholder="Subject specialization"
              className={inputClass}
            />
            <p className={hintClass}>Used to suggest this teacher when assigning subjects to a class.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
