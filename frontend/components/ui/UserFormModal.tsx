'use client';

import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

type ClassCourseOption = {
  id: string;
  name: string;
  section: string;
};

type UserFormValues = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
  avatarUrl?: string;
  phoneNumber?: string;
  gender?: string;
  address?: string;
  studentId?: string;
  subjectSpecialization?: string;
  qualification?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  joiningDate?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianAddress?: string;
  parentMobile?: string;
  className?: string;
  section?: string;
};

type UserFormModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  submitLabel: string;
  role: 'Student' | 'Teacher';
  initialValues?: UserFormValues;
  classCourses?: ClassCourseOption[];
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSubmitting?: boolean;
  requirePassword?: boolean;
};

export function UserFormModal({
  open,
  onClose,
  title,
  submitLabel,
  role,
  initialValues,
  classCourses = [],
  onSubmit,
  isSubmitting = false,
  requirePassword = true,
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(
    initialValues ?? {
      fullName: '',
      email: '',
      password: '',
      status: 'Active',
      avatarUrl: '',
      phoneNumber: '',
      gender: '',
      address: '',
      studentId: '',
      subjectSpecialization: '',
      qualification: '',
      dateOfBirth: '',
      admissionDate: '',
      joiningDate: '',
      guardianName: '',
      guardianEmail: '',
      guardianAddress: '',
      parentMobile: '',
      className: classCourses[0]?.name ?? '',
      section: classCourses[0]?.section ?? '',
    }
  );

  useEffect(() => {
    setValues({
      fullName: initialValues?.fullName ?? '',
      email: initialValues?.email ?? '',
      password: initialValues?.password ?? '',
      status: initialValues?.status ?? 'Active',
      avatarUrl: initialValues?.avatarUrl ?? '',
      phoneNumber: initialValues?.phoneNumber ?? '',
      gender: initialValues?.gender ?? '',
      address: initialValues?.address ?? '',
      studentId: initialValues?.studentId ?? '',
      subjectSpecialization: initialValues?.subjectSpecialization ?? '',
      qualification: initialValues?.qualification ?? '',
      dateOfBirth: initialValues?.dateOfBirth ?? '',
      admissionDate: initialValues?.admissionDate ?? '',
      joiningDate: initialValues?.joiningDate ?? '',
      guardianName: initialValues?.guardianName ?? '',
      guardianEmail: initialValues?.guardianEmail ?? '',
      guardianAddress: initialValues?.guardianAddress ?? '',
      parentMobile: initialValues?.parentMobile ?? '',
      className: initialValues?.className ?? classCourses[0]?.name ?? '',
      section: initialValues?.section ?? classCourses[0]?.section ?? '',
    });
  }, [initialValues, classCourses, open]);

  useEffect(() => {
    if (role === 'Student' && classCourses.length && !values.className) {
      setValues((current) => ({
        ...current,
        className: classCourses[0].name,
        section: classCourses[0].section,
      }));
    }
  }, [classCourses, role, values.className]);

  function handleChange(field: keyof UserFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  const sectionOptions = Array.from(
    new Set(classCourses.filter((cls) => cls.name === values.className).map((cls) => cls.section))
  );

  return (
    <Modal open={open} onClose={onClose} title={title} description={`Fill in the ${role.toLowerCase()} details to continue.`} footer={
      <div className="flex flex-wrap gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={isSubmitting} onClick={() => onSubmit(values)}>
          {submitLabel}
        </Button>
      </div>
    }>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(values);
        }}
        className="grid gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={values.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              placeholder={`${role} name`}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={values.email}
              onChange={(event) => handleChange('email', event.target.value)}
              placeholder="email@example.com"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required
              type="email"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              placeholder={role === 'Student' ? 'Create a password' : 'Create a password'}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              required={requirePassword}
              type="password"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={values.status}
              onChange={(event) => handleChange('status', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Avatar URL</label>
            <input
              value={values.avatarUrl}
              onChange={(event) => handleChange('avatarUrl', event.target.value)}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="url"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input
              value={values.phoneNumber}
              onChange={(event) => handleChange('phoneNumber', event.target.value)}
              placeholder="Phone number"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="tel"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
            <select
              value={values.gender}
              onChange={(event) => handleChange('gender', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        {role === 'Student' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Student ID</label>
              <input
                value={values.studentId}
                onChange={(event) => handleChange('studentId', event.target.value)}
                placeholder="Student ID"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Qualification</label>
              <input
                value={values.qualification}
                onChange={(event) => handleChange('qualification', event.target.value)}
                placeholder="Qualification"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Specialization</label>
              <input
                value={values.subjectSpecialization}
                onChange={(event) => handleChange('subjectSpecialization', event.target.value)}
                placeholder="Subject specialization"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        )}
        

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Date of birth</label>
            <input
              value={values.dateOfBirth}
              onChange={(event) => handleChange('dateOfBirth', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="date"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Admission date</label>
            <input
              value={values.admissionDate}
              onChange={(event) => handleChange('admissionDate', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="date"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Joining date</label>
            <input
              value={values.joiningDate}
              onChange={(event) => handleChange('joiningDate', event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="date"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Guardian name</label>
            <input
              value={values.guardianName}
              onChange={(event) => handleChange('guardianName', event.target.value)}
              placeholder="Guardian name"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Guardian email</label>
            <input
              value={values.guardianEmail}
              onChange={(event) => handleChange('guardianEmail', event.target.value)}
              placeholder="Guardian email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="email"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
          <textarea
            value={values.address}
            onChange={(event) => handleChange('address', event.target.value)}
            placeholder="Address"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            rows={3}
          />
        </div>

        {role === 'Student' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Parent mobile</label>
              <input
                value={values.parentMobile}
                onChange={(event) => handleChange('parentMobile', event.target.value)}
                placeholder="Parent mobile"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                type="tel"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
              <select
                value={values.className}
                onChange={(event) => handleChange('className', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={!classCourses.length}
              >
                <option value="" disabled>
                  {classCourses.length ? 'Select class' : 'No classes loaded'}
                </option>
                {Array.from(new Set(classCourses.map((cls) => cls.name))).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Section</label>
              <select
                value={values.section}
                onChange={(event) => handleChange('section', event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                disabled={!values.className}
              >
                <option value="" disabled>
                  {values.className ? 'Select section' : 'Select class first'}
                </option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
