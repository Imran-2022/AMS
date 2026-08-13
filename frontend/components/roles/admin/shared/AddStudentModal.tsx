'use client';

import { useEffect, useMemo, useState } from 'react';
import { getNextStudentId } from '@/lib/api';
import { Button, Modal } from '@/shared/ui';

type ClassCourseOption = {
  id: string;
  name: string;
  section: string;
  groupId?: string;
  groupName?: string;
};

export type AddStudentFormData = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
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
  group?: string;
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

const CLASSES_WITH_GROUPS = ['Nine', 'Ten', 'Eleven', 'Twelve'];
const CLASS_NAME_ORDER = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

function sortClassName(a: string, b: string) {
  const aIndex = CLASS_NAME_ORDER.indexOf(a);
  const bIndex = CLASS_NAME_ORDER.indexOf(b);

  const normalizedA = aIndex >= 0 ? aIndex : Number.MAX_SAFE_INTEGER;
  const normalizedB = bIndex >= 0 ? bIndex : Number.MAX_SAFE_INTEGER;
  return normalizedA - normalizedB;
}

function sortSectionValue(section: string) {
  const raw = (section ?? '').trim();
  if (!raw) return Number.MAX_SAFE_INTEGER;

  const alpha = raw.match(/[A-Za-z]+/)?.[0] ?? '';
  const numeric = Number.parseInt(raw.match(/\d+/)?.[0] ?? '0', 10);
  const alphaScore = alpha ? alpha.toUpperCase().charCodeAt(0) - 64 : 0;
  return alphaScore * 100 + numeric;
}

function normalizeDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function classHasGroups(className?: string): boolean {
  return className ? CLASSES_WITH_GROUPS.includes(className) : false;
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

function generateStudentId(className?: string, group?: string, existingCount: number = 0): string {
  if (!className) return '';
  
  // Extract class number from name (e.g., "Nine" -> 9, "Twelve" -> 12)
  const classMap: Record<string, string> = {
    'Nine': '9',
    'Ten': '10',
    'Eleven': '11',
    'Twelve': '12',
  };
  
  const classNum = classMap[className];
  
  if (classNum && group) {
    // For classes 9-12 with groups: Format 9-S-001 (class-group-serial)
    const groupAbbr = group.charAt(0).toUpperCase();
    const serial = String(existingCount + 1).padStart(3, '0');
    return `${classNum}-${groupAbbr}-${serial}`;
  }
  
  // Default: return empty (will be set by parent component)
  return '';
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
  const getInitialFormValues = (source?: AddStudentFormData): AddStudentFormData => {
    const defaultClass = source?.className ?? '';
    const defaultSection = source?.section ?? '';

    return {
      fullName: source?.fullName ?? '',
      email: source?.email ?? '',
      password: '',
      status: source?.status ?? 'Active',
      dateOfBirth: normalizeDate(source?.dateOfBirth),
      gender: source?.gender ?? '',
      studentId: source?.studentId ?? '',
      className: defaultClass,
      section: defaultSection,
      admissionDate: normalizeDate(source?.admissionDate),
      guardianName: source?.guardianName ?? '',
      parentMobile: source?.parentMobile ?? '',
      guardianEmail: source?.guardianEmail ?? '',
      avatarUrl: source?.avatarUrl ?? '',
      group: source?.group ?? '',
    };
  };

  const [values, setValues] = useState<AddStudentFormData>(() => getInitialFormValues(initialValues));
  const [isGeneratingId, setIsGeneratingId] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(getInitialFormValues(initialValues));
  }, [open, initialValues, classCourses]);

  const classNames = useMemo(
    () => Array.from(new Set(classCourses.map((cls) => cls.name))).sort(sortClassName),
    [classCourses]
  );

  const needsGroup = classHasGroups(values.className);

  const sectionOptions = useMemo(
    () => {
      const entries = classCourses
        .filter((cls) => cls.name === values.className)
        .map((cls) => ({
          value: needsGroup ? `${cls.section}::${cls.groupName ?? ''}` : cls.section,
          label: needsGroup ? `${cls.section}${cls.groupName ? ` (${cls.groupName})` : ''}` : cls.section,
          section: cls.section,
          group: cls.groupName ?? '',
        }));

      return Array.from(new Map(entries.map((entry) => [entry.value, entry])).values())
        .sort((a, b) => sortSectionValue(a.section) - sortSectionValue(b.section));
    },
    [classCourses, values.className, needsGroup]
  );

  const availableGroups = useMemo(
    () => Array.from(new Set(
      classCourses
        .filter((cls) => cls.name === values.className && cls.groupName)
        .map((cls) => cls.groupName!)
    )),
    [classCourses, values.className]
  );

  useEffect(() => {
    if (!values.className) return;

    const validSectionOption = sectionOptions.find((option) => option.section === values.section && (!needsGroup || option.group === values.group));
    if (!validSectionOption && sectionOptions.length) {
      const first = sectionOptions[0];
      setValues((current) => ({
        ...current,
        section: first.section,
        group: first.group,
      }));
    }
  }, [sectionOptions, values.className, values.section, values.group, needsGroup]);

  // Clear group when switching to a class that doesn't need groups
  useEffect(() => {
    if (!needsGroup) {
      setValues((current) => ({ ...current, group: '' }));
    }
  }, [needsGroup]);

  // Auto-generate student ID from backend based on class and group
  useEffect(() => {
    async function generateId() {
      // Find the class course ID for the selected class/section
      const selectedCourse = classCourses.find(
        (cls) => cls.name === values.className && cls.section === values.section
      );

      if (!selectedCourse) {
        setValues((current) => ({ ...current, studentId: '' }));
        return;
      }

      // For grouped classes, we need to select a course with matching group
      let courseToUse = selectedCourse;
      if (needsGroup && values.group) {
        const groupedCourse = classCourses.find(
          (cls) => cls.name === values.className && cls.section === values.section && cls.groupName === values.group
        );
        if (groupedCourse) courseToUse = groupedCourse;
      }

      try {
        setIsGeneratingId(true);
        const response = await getNextStudentId(
          courseToUse.id,
          courseToUse.groupId
        );
        setValues((current) => ({ ...current, studentId: response.studentId }));
      } catch (err) {
        console.error('Failed to generate student ID:', err);
        setValues((current) => ({ ...current, studentId: '' }));
      } finally {
        setIsGeneratingId(false);
      }
    }

    if (open && values.className && values.section) {
      void generateId();
    }
  }, [open, values.className, values.section, values.group, classCourses, needsGroup]);

  function handleChange<Key extends keyof AddStudentFormData>(field: Key, value: AddStudentFormData[Key]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    if (!values.fullName.trim()) {
      alert('Full name is required.');
      return;
    }

    if (!values.email.trim()) {
      alert('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(values.email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!values.gender) {
      alert('Gender is required.');
      return;
    }

    if (!values.dateOfBirth) {
      alert('Date of birth is required.');
      return;
    }

    if (!values.admissionDate) {
      alert('Admission date is required.');
      return;
    }

    if (!values.guardianName) {
      alert('Guardian name is required.');
      return;
    }

    if (!values.parentMobile) {
      alert('Guardian mobile is required.');
      return;
    }

    if (!isValidMobileNumber(values.parentMobile)) {
      alert('Guardian mobile must be valid Bangladesh format:\n- Domestic: 11 digits starting with 01 (e.g., 01712345678)\n- International: +88 prefix (e.g., +8801712345678)');
      return;
    }

    if (!values.className) {
      alert('Class is required.');
      return;
    }

    if (!values.section) {
      alert('Section is required.');
      return;
    }

    if (!values.studentId) {
      alert('Student ID is required.');
      return;
    }

    void onSubmit(values);
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
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        {/* ## Add student modal - Image upload (optional) - commented out for now
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
              <label className={labelClass}>
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={values.gender}
                onChange={(event) => handleChange('gender', event.target.value)}
                className={`${inputClass} text-slate-700`}
                required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Date of birth <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.dateOfBirth}
                onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                className={`${inputClass} text-slate-500`}
                type="date"
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                Password{requirePassword ? '' : ' (optional)'}{requirePassword ? <span className="text-rose-500">*</span> : null}
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
                onChange={(event) => handleChange('status', event.target.value as AddStudentFormData['status'])}
                className={`${inputClass} text-slate-700`}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <p className={sectionTitleClass}>ACADEMIC DETAILS</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div>
              <label className={labelClass}>
                Class <span className="text-rose-500">*</span>
              </label>
              <select
                value={values.className}
                onChange={(event) => handleChange('className', event.target.value)}
                className={`${inputClass} text-slate-700`}>
                <option value="">{classCourses.length ? 'Select class' : 'No classes loaded'}</option>
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
                value={values.section && (needsGroup ? `${values.section}::${values.group ?? ''}` : values.section)}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  if (needsGroup) {
                    const [section, group = ''] = rawValue.split('::');
                    handleChange('section', section);
                    handleChange('group', group);
                    return;
                  }

                  handleChange('section', rawValue);
                  handleChange('group', '');
                }}
                className={`${inputClass} ${!values.className ? 'text-slate-400' : 'text-slate-700'}`}>
                <option value="">{values.className ? 'Select section' : 'Select class first'}</option>
                {sectionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div>
              <label className={labelClass}>Roll no. / Student ID</label>
              <input
                value={values.studentId}
                onChange={(event) => handleChange('studentId', event.target.value)}
                placeholder="e.g. STU-0142"
                className={`${inputClass} bg-slate-100 text-slate-500`}
                readOnly
              />
              {needsGroup && <p className={hintClass}>Auto-generated based on class and group</p>}
            </div>
            <div>
              <label className={labelClass}>
                Admission date <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.admissionDate}
                onChange={(event) => handleChange('admissionDate', event.target.value)}
                className={`${inputClass} text-slate-500`}
                type="date"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className={sectionTitleClass}>GUARDIAN / PARENT INFORMATION</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                Guardian name <span className="text-rose-500">*</span>
              </label>
              <input
                value={values.guardianName}
                onChange={(event) => handleChange('guardianName', event.target.value)}
                placeholder="Parent or guardian's name"
                className={inputClass}
                required
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
