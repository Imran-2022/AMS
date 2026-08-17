"use client";

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/layout';
import { Modal } from '../../ui';
import { 
  getAcademicYears, 
  activateAcademicYear, 
  createAcademicYear, 
  notifyAcademicYearChanged,
  setSelectedAcademicYearId,
  promoteStudent,
  bulkPromoteStudents,
  getClassCourses,
  getSubjects,
  getEnrollments,
  type ClassCourseDto,
  type SubjectDto,
  type StudentEnrollmentDto
} from '@/lib/api';

type SettingsTab = 'academic' | 'promote-students' | 'danger';

function getNextAcademicYearDefaults(years: { name: string; startDate: string; endDate: string }[]) {
  const currentYear = new Date().getFullYear();
  const sortedYears = [...years].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const lastYear = sortedYears[0];

  if (!lastYear) {
    return {
      name: `${currentYear}-${currentYear + 1}`,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear + 1}-01-01`,
    };
  }

  const parsedName = lastYear.name.match(/(\d{4})\s*-\s*(\d{4})/);
  const yearBasis = parsedName ? Number(parsedName[2]) : new Date(lastYear.endDate).getFullYear();
  const nextStartYear = yearBasis;
  const nextEndYear = yearBasis + 1;

  return {
    name: `${nextStartYear}-${nextEndYear}`,
    startDate: `${nextStartYear}-01-01`,
    endDate: `${nextEndYear}-01-01`,
  };
}

export function AdminAmsSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('academic');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const defaultAcademicYearDefaults = getNextAcademicYearDefaults(academicYears);
  const [newYearName, setNewYearName] = useState(defaultAcademicYearDefaults.name);
  const [newYearStart, setNewYearStart] = useState(defaultAcademicYearDefaults.startDate);
  const [newYearEnd, setNewYearEnd] = useState(defaultAcademicYearDefaults.endDate);
  const [newYearIsActive, setNewYearIsActive] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Promotion state
  const [promoteFromAcademicYearId, setPromoteFromAcademicYearId] = useState('');
  const [promoteToAcademicYearId, setPromoteToAcademicYearId] = useState('');
  const [promoteFromClassId, setPromoteFromClassId] = useState('');
  const [promoteToClassId, setPromoteToClassId] = useState('');
  const [promoteFromGroupId, setPromoteFromGroupId] = useState('');
  const [promoteToGroupId, setPromoteToGroupId] = useState('');
  const [promoteStudentIds, setPromoteStudentIds] = useState<string[]>([]);
  const [promoteStudentRollNumbers, setPromoteStudentRollNumbers] = useState<Record<string, string>>({});
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);
  
  // Data loading state
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<StudentEnrollmentDto[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    void loadAcademicYears();
    void loadData();
  }, []);

  async function loadData() {
    try {
      setDataLoading(true);
      const [classesData, subjectsData, enrollmentsData] = await Promise.all([
        getClassCourses(true),
        getSubjects(),
        getEnrollments(true)
      ]);
      setClasses(classesData);
      setSubjects(subjectsData);
      setAllEnrollments(enrollmentsData);

      if (classesData.length > 0) {
        const orderedClasses = [...classesData].sort((a, b) => {
          const aLevel = extractClassLevel(a.name) ?? 0;
          const bLevel = extractClassLevel(b.name) ?? 0;
          return aLevel - bLevel;
        });

        const sourceClass = orderedClasses[0];
        const targetClassId = getNextClassForPromotion(sourceClass.id, classesData) || sourceClass.id;
        setPromoteFromClassId(sourceClass.id);
        setPromoteToClassId(targetClassId);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setDataLoading(false);
    }
  }

  async function loadAcademicYears() {
    try {
      setLoading(true);
      setError(null);
      const years = await getAcademicYears();
      setAcademicYears(years);

      const activeYearId = years.find(year => year.isActive)?.id ?? '';
      const previousYearId = [...years]
        .filter(year => !year.isActive)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]?.id ?? activeYearId;

      if (!promoteFromAcademicYearId && previousYearId) setPromoteFromAcademicYearId(previousYearId);
      if (!promoteToAcademicYearId && activeYearId) setPromoteToAcademicYearId(activeYearId);

      const nextDefaults = getNextAcademicYearDefaults(years);
      setNewYearName(nextDefaults.name);
      setNewYearStart(nextDefaults.startDate);
      setNewYearEnd(nextDefaults.endDate);
    } catch (err) {
      console.error('Failed to load academic years', err);
      setError('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivateYear(yearId: string) {
    try {
      setError(null);
      await activateAcademicYear(yearId);
      setSelectedAcademicYearId(yearId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ams-active-academic-year', yearId);
      }
      await loadAcademicYears();
      notifyAcademicYearChanged();
    } catch (err) {
      console.error('Failed to activate academic year', err);
      setError('Failed to activate academic year');
    }
  }

  async function handleCreateYear() {
    if (!newYearName.trim()) {
      setCreateError('Academic year name is required.');
      return;
    }
    if (!newYearStart || !newYearEnd) {
      setCreateError('Start and end dates are required.');
      return;
    }
    if (new Date(newYearStart) >= new Date(newYearEnd)) {
      setCreateError('Start date must be before end date.');
      return;
    }

    try {
      setCreateError(null);
      setCreateLoading(true);
      const createdYear = await createAcademicYear({
        name: newYearName,
        startDate: `${newYearStart}T00:00:00Z`,
        endDate: `${newYearEnd}T00:00:00Z`,
        isActive: newYearIsActive
      });

      if (newYearIsActive && createdYear?.id) {
        setSelectedAcademicYearId(createdYear.id);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('ams-active-academic-year', createdYear.id);
        }
      }

      const nextDefaults = getNextAcademicYearDefaults(academicYears);
      setNewYearName(nextDefaults.name);
      setNewYearStart(nextDefaults.startDate);
      setNewYearEnd(nextDefaults.endDate);
      setNewYearIsActive(false);
      setShowCreateModal(false);
      await loadAcademicYears();
      notifyAcademicYearChanged();
    } catch (err) {
      console.error('Failed to create academic year', err);
      setCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleBulkPromoteStudents() {
    if (!promoteFromClassId.trim()) {
      setPromoteError('Please select a source class');
      return;
    }
    if (!promoteToClassId.trim()) {
      setPromoteError('Please select a target class');
      return;
    }
    if (promoteStudentIds.length === 0) {
      setPromoteError('Please select at least one student');
      return;
    }

    try {
      setPromoteError(null);
      setPromoteSuccess(null);
      setPromoteLoading(true);
      
      // Prepare students with roll numbers
      const studentsWithRolls = promoteStudentIds.map(studentId => ({
        studentId,
        newRollNumber: promoteStudentRollNumbers[studentId] || undefined
      }));
      
      await bulkPromoteStudents({
        fromClassCourseId: promoteFromClassId,
        toClassCourseId: promoteToClassId,
        students: studentsWithRolls
      });
      setPromoteSuccess(`${promoteStudentIds.length} student(s) promoted successfully`);
      notifyAcademicYearChanged();
      await loadData();
      setPromoteFromClassId('');
      setPromoteToClassId('');
      setPromoteFromGroupId('');
      setPromoteToGroupId('');
      setPromoteStudentIds([]);
      setPromoteStudentRollNumbers({});
    } catch (err) {
      console.error('Failed to promote students', err);
      setPromoteError(err instanceof Error ? err.message : String(err));
    } finally {
      setPromoteLoading(false);
    }
  }

  // Helper functions
  const getStudentsForClass = (classId: string): StudentEnrollmentDto[] => {
    if (!classId) return [];

    const targetYearId = promoteToClassId ? classes.find(course => course.id === promoteToClassId)?.academicYearId : undefined;
    const studentIdsAlreadyInTargetYear = new Set(
      targetYearId
        ? allEnrollments
            .filter(enrollment => {
              const enrollmentClass = classes.find(course => course.id === enrollment.classCourseId);
              return !!enrollmentClass && enrollmentClass.academicYearId === targetYearId;
            })
            .map(enrollment => enrollment.studentId)
        : []
    );

    return allEnrollments.filter(enrollment => {
      const matchesClass = enrollment.classCourseId === classId;
      const isAlreadyPromotedToTargetYear = studentIdsAlreadyInTargetYear.has(enrollment.studentId);
      return matchesClass && !isAlreadyPromotedToTargetYear;
    });
  };

  const getClassNameById = (id: string): string => {
    return classes.find(c => c.id === id)?.name || id;
  };

  const toggleStudentSelection = (studentId: string) => {
    setPromoteStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const formatClassCourseLabel = (classCourse?: Pick<ClassCourseDto, 'name' | 'section' | 'groupName'> | null) => {
    if (!classCourse) return 'Unknown class';
    return [classCourse.name, classCourse.section, classCourse.groupName].filter(Boolean).join(' - ');
  };

  const isHigherSecondaryClassName = (className?: string) => {
    if (!className) return false;
    const normalized = className.trim().toLowerCase();
    const numericValue = Number.parseInt(normalized.replace(/[^0-9]/g, ''), 10);
    return (numericValue >= 9 && numericValue <= 12) || ['nine', 'ten', 'eleven', 'twelve', 'class 9', 'class 10', 'class 11', 'class 12'].includes(normalized);
  };

  // Extract class level from class name (supports "Class 6", "Six", "Grade 7", etc.)
  const extractClassLevel = (className: string): number | null => {
    if (!className) return null;

    const numericMatch = className.match(/\d+/);
    if (numericMatch) {
      return parseInt(numericMatch[0], 10);
    }

    const normalized = className
      .trim()
      .toLowerCase()
      .replace(/^class\s+/, '')
      .replace(/^grade\s+/, '')
      .trim();

    const wordLevels: Record<string, number> = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      eleven: 11,
      twelve: 12,
    };

    return wordLevels[normalized] ?? null;
  };

  // Get the next sequential class for a given source class
  const getNextClassForPromotion = (sourceClassId: string, classList: ClassCourseDto[] = classes): string => {
    const sourceClass = classList.find(c => c.id === sourceClassId);
    if (!sourceClass) return '';

    const sourceLevel = extractClassLevel(sourceClass.name);
    if (sourceLevel === null) return '';

    const nextClass = classList.find(c => {
      const level = extractClassLevel(c.name);
      return level === sourceLevel + 1;
    });

    return nextClass?.id || '';
  };

  const activeAcademicYearId = academicYears.find(year => year.isActive)?.id ?? '';

  const mostRecentArchivedYear = academicYears
    .filter(year => !year.isActive)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

  const sourceAcademicYearId = promoteFromAcademicYearId || mostRecentArchivedYear?.id || '';
  const targetAcademicYearId = promoteToAcademicYearId || activeAcademicYearId;

  const sourceClassOptions = classes.filter(classCourse => classCourse.academicYearId === sourceAcademicYearId);
  const targetClassOptions = classes.filter(classCourse => classCourse.academicYearId === targetAcademicYearId);

  const getNextClassForSelectedSource = (sourceClassId: string): string => {
    const sourceClass = classes.find(p => p.id === sourceClassId);
    if (!sourceClass) return '';

    const sourceLevel = extractClassLevel(sourceClass.name);
    if (sourceLevel === null) return '';

    const nextCandidates = classes.filter(candidate => {
      if (candidate.academicYearId !== targetAcademicYearId) return false;
      const candidateLevel = extractClassLevel(candidate.name);
      if (candidateLevel !== sourceLevel + 1) return false;
      if (!sourceClass.section || !candidate.section) return true;
      return candidate.section === sourceClass.section;
    });

    return nextCandidates[0]?.id ?? (getNextClassForPromotion(sourceClassId, classes.filter(c => c.academicYearId === targetAcademicYearId)) || '');
  };

  const getPromotionTargetOptions = (sourceClassId: string) => {
    if (!sourceClassId) return [] as { id: string; label: string }[];

    const targetClassId = getNextClassForSelectedSource(sourceClassId);
    if (!targetClassId) return [] as { id: string; label: string }[];

    return [{ id: targetClassId, label: 'Next class' }];
  };

  const tabButton = (label: string, value: SettingsTab) => (
    <button
      type="button" onClick={() => setActiveTab(value)}
      className={`flex w-full items-center justify-start rounded px-3 py-2.5 text-left text-sm font-semibold transition-all cursor-pointer ${
        activeTab === value
          ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100'
          : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <AppShell role="Admin" breadcrumb="Admin / Settings">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Settings</h1>
        </div>

        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
          <aside className="h-fit bg-white rounded-2xl border border-slate-200 p-2.5 shadow-sm">
            <div className="space-y-1.5">
              {tabButton('Academic', 'academic')}
              {tabButton('Promote Students', 'promote-students')}
              {tabButton('Danger zone', 'danger')}
            </div>
          </aside>

          <div className="space-y-5">
            <div
              className={`${
                activeTab === 'academic' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-6`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Academic years</p>
                  <p className="text-xs text-slate-400 mt-0.5">Manage active academic years. Only one year can be active at a time.</p>
                </div>
                <button
                  type="button" onClick={() => {
                    setCreateError(null);
                    setShowCreateModal(true);
                  }}
                  className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 cursor-pointer shrink-0"
                >
                  Create academic year
                </button>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <Modal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create academic year"
                description="Add a new academic session and optionally set it active."
                footer={
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
                    <button
                      type="button" onClick={() => setShowCreateModal(false)}
                      className="rounded border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateYear}
                      disabled={createLoading}
                      className="rounded bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {createLoading ? 'Creating…' : 'Create academic year'}
                    </button>
                  </div>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">Year name</label>
                    <input
                      type="text"
                      value={newYearName}
                      onChange={(event) => setNewYearName(event.target.value)}
                      placeholder="2027-2028"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">Start date</label>
                    <input
                      type="date"
                      value={newYearStart}
                      onChange={(event) => setNewYearStart(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">End date</label>
                    <input
                      type="date"
                      value={newYearEnd}
                      onChange={(event) => setNewYearEnd(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newYearIsActive}
                        onChange={() => setNewYearIsActive((value) => !value)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Set active
                    </label>
                  </div>
                </div>
                {createError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 mt-4">
                    {createError}
                  </div>
                )}
              </Modal>

              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading academic years...</div>
              ) : academicYears.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No academic years found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">YEAR</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">START DATE</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">END DATE</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">STATUS</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {academicYears.map((year) => (
                        <tr key={year.id}>
                          <td className="px-4 py-3 font-semibold text-slate-700">{year.name}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(year.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(year.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {year.isActive ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11.5px] font-bold text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!year.isActive && (
                              <button
                                onClick={() => handleActivateYear(year.id)}
                                className="px-3 py-1.5 rounded bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 cursor-pointer"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div
              className={`${
                activeTab === 'promote-students' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-6`}
            >
              <div>
                <p className="text-sm font-bold text-slate-700">Promote students to the next class</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  A newly activated academic year starts empty until students are promoted from the previous class.
                  Select the current class and the next class to create the new-year enrollment record without losing the old-year history.
                </p>
              </div>

              {promoteError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {promoteError}
                </div>
              ) : promoteSuccess ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  ✓ {promoteSuccess}
                </div>
              ) : null}

              {!academicYears.length ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  ℹ️ No academic years available. Create and complete an academic year first before promoting students.
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Academic year before promotion</label>
                  <select
                    value={sourceAcademicYearId}
                    onChange={(event) => {
                      const yearId = event.target.value;
                      setPromoteFromAcademicYearId(yearId);
                      setPromoteFromClassId('');
                      setPromoteToClassId('');
                      setPromoteStudentIds([]);
                      setPromoteStudentRollNumbers({});
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    {academicYears
                      .filter(year => !year.isActive)
                      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                      .map(year => (
                        <option key={year.id} value={year.id}>{year.name}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Academic year after promotion</label>
                  <select
                    value={targetAcademicYearId}
                    onChange={(event) => {
                      const yearId = event.target.value;
                      setPromoteToAcademicYearId(yearId);
                      setPromoteToClassId('');
                      setPromoteStudentIds([]);
                      setPromoteStudentRollNumbers({});
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    {academicYears
                      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                      .map(year => (
                        <option key={year.id} value={year.id}>{year.name}{year.isActive ? ' (Active)' : ''}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Class before promotion</label>
                  <select
                    disabled={!sourceAcademicYearId || sourceClassOptions.length === 0}
                    value={promoteFromClassId}
                    onChange={(event) => {
                      const classId = event.target.value;
                      setPromoteFromClassId(classId);
                      setPromoteFromGroupId('');

                      const nextClassId = classId ? getNextClassForSelectedSource(classId) : '';
                      setPromoteToClassId(nextClassId);
                      setPromoteToGroupId('');
                      setPromoteStudentIds([]);
                      setPromoteStudentRollNumbers({});
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select the class students are leaving...</option>
                    {sourceClassOptions.map(c => (
                      <option key={c.id} value={c.id}>{formatClassCourseLabel(c)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Class after promotion</label>
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none">
                    {promoteToClassId && classes.find(c => c.id === promoteToClassId)
                      ? `Next class - ${formatClassCourseLabel(classes.find(c => c.id === promoteToClassId)!)}`
                      : 'Select the class before promotion'}
                  </div>
                  {!promoteFromClassId && (
                    <p className="text-[11px] text-slate-400 mt-1">Choose the source year and class to set the target class</p>
                  )}
                  {promoteFromClassId && !promoteToClassId && (
                    <p className="text-[11px] text-rose-500 mt-1">No valid target class available for the selected year/level</p>
                  )}
                </div>
              </div>

              {promoteFromClassId && promoteToClassId && (
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-3">Select Students & Enter New Roll Numbers</label>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 w-10">
                              <input
                                type="checkbox"
                                checked={promoteStudentIds.length > 0 && promoteStudentIds.length === getStudentsForClass(promoteFromClassId).length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allStudents = getStudentsForClass(promoteFromClassId);
                                    setPromoteStudentIds(allStudents.map(s => s.studentId));
                                  } else {
                                    setPromoteStudentIds([]);
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">STUDENT NAME</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">CURRENT ROLL</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">CURRENT CLASS</th>
                            <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">NEW ROLL NUMBER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {getStudentsForClass(promoteFromClassId).length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                                No students in this class for the selected source year. Students must have an enrollment record in this class before they can be promoted.
                              </td>
                            </tr>
                          ) : (
                            getStudentsForClass(promoteFromClassId).map(student => {
                              const currentCourse = classes.find(c => c.id === student.classCourseId);
                              const currentRoll = allEnrollments.find(
                                enrollment => enrollment.studentId === student.studentId && enrollment.classCourseId === promoteFromClassId
                              )?.rollNumber ?? student.rollNumber ?? '—';
                              return (
                                <tr key={student.studentId} className={promoteStudentIds.includes(student.studentId) ? 'bg-brand-50' : ''}>
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={promoteStudentIds.includes(student.studentId)}
                                      onChange={() => toggleStudentSelection(student.studentId)}
                                      className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                    />
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-700">{student.studentName}</td>
                                  <td className="px-4 py-3 text-slate-600">{currentRoll || '—'}</td>
                                  <td className="px-4 py-3 text-slate-600">{currentCourse ? formatClassCourseLabel(currentCourse) : '—'}</td>
                                  <td className="px-4 py-3">
                                    {promoteStudentIds.includes(student.studentId) ? (
                                      <input
                                        type="text"
                                        placeholder="Enter new roll number"
                                        value={promoteStudentRollNumbers[student.studentId] || ''}
                                        onChange={(e) => {
                                          setPromoteStudentRollNumbers(prev => ({
                                            ...prev,
                                            [student.studentId]: e.target.value
                                          }));
                                        }}
                                        className="w-full max-w-xs rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                      />
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPromoteFromClassId('');
                    setPromoteToClassId('');
                    setPromoteStudentIds([]);
                    setPromoteStudentRollNumbers({});
                    setPromoteError(null);
                    setPromoteSuccess(null);
                  }}
                  className="px-5 py-2.5 rounded border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleBulkPromoteStudents}
                  disabled={promoteLoading || promoteStudentIds.length === 0 || !promoteToClassId}
                  className="px-5 py-2.5 rounded bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {promoteLoading ? 'Promoting…' : 'Promote Students'}
                </button>
              </div>
            </div>

            <div
              className={`${
                activeTab === 'danger' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-6`}
            >
              <div>
                <p className="text-sm font-bold text-slate-700">Danger zone</p>
                <p className="text-xs text-slate-400 mt-0.5">These actions are irreversible. Proceed with care.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Deactivate school account</p>
                    <p className="text-xs text-slate-400 mt-0.5">All users lose access immediately. Data is retained for 30 days.</p>
                  </div>
                  <button className="px-5 py-2 rounded bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-100 shrink-0">
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
