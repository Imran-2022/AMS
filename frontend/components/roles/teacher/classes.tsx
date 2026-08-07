"use client";

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { getAssignments, getClassCourses, getSubjects } from '@/lib/api';
import type { AssignmentDto, ClassCourseDto, SubjectDto } from '@/lib/api';

type ClassDetailState = {
  id: string;
  name: string;
  section: string;
  academicYear: string;
  subjects: string[];
  assignmentCount: number;
};

export function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassCourseDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setError(null);
      setLoading(true);
      try {
        const [apiClasses, apiSubjects, apiAssignments] = await Promise.all([
          getClassCourses(),
          getSubjects(),
          getAssignments()
        ]);
        setClasses(apiClasses);
        setSubjects(apiSubjects);
        setAssignments(apiAssignments);
      } catch (err) {
        console.error(err);
        setError('Unable to load classes. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const classSubjectsMap = useMemo(() => {
    return subjects.reduce<Record<string, string[]>>((acc, subject) => {
      const currentSubjects = acc[subject.classCourseId] ?? [];
      acc[subject.classCourseId] = Array.from(new Set([...currentSubjects, subject.name]));
      return acc;
    }, {});
  }, [subjects]);

  const classAssignmentCountMap = useMemo(() => {
    return assignments.reduce<Record<string, number>>((acc, assignment) => {
      acc[assignment.classCourseId] = (acc[assignment.classCourseId] ?? 0) + 1;
      return acc;
    }, {});
  }, [assignments]);

  const selectedClass = useMemo(() => {
    if (!selectedClassId) return null;
    const cls = classes.find((item) => item.id === selectedClassId);
    if (!cls) return null;

    return {
      id: cls.id,
      name: cls.name,
      section: cls.section,
      academicYear: cls.academicYear,
      subjects: classSubjectsMap[cls.id] ?? [],
      assignmentCount: classAssignmentCountMap[cls.id] ?? 0
    } as ClassDetailState;
  }, [classes, classSubjectsMap, classAssignmentCountMap, selectedClassId]);

  const cards = useMemo(() => {
    const activeAssignments = assignments.filter((assignment) => assignment.status === 'Published').length;
    const draftAssignments = assignments.filter((assignment) => assignment.status === 'Draft').length;

    return {
      classCount: classes.length,
      subjectCount: subjects.length,
      activeAssignmentCount: activeAssignments,
      draftAssignmentCount: draftAssignments
    };
  }, [assignments, classes.length, subjects.length]);

  if (loading) {
    return (
      <AppShell role="Teacher" breadcrumb="Teacher / My Classes">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold tracking-[0.24em] text-brand-600">TEACHER PORTAL</p>
            <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">My Classes</h1>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading your classes…</div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell role="Teacher" breadcrumb="Teacher / My Classes">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold tracking-[0.24em] text-brand-600">TEACHER PORTAL</p>
            <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">My Classes</h1>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / My Classes">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold tracking-[0.24em] text-brand-600">TEACHER PORTAL</p>
          <h1 className="mt-0.5 text-3xl font-extrabold text-slate-800">My Classes</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">CLASSES</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.classCount}</p>
            <p className="mt-1 text-xs text-slate-400">Your assigned classes</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">SUBJECTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.subjectCount}</p>
            <p className="mt-1 text-xs text-slate-400">Unique subjects assigned</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">ACTIVE ASSIGNMENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.activeAssignmentCount}</p>
            <p className="mt-1 text-xs text-slate-400">Published assignments</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">DRAFT ASSIGNMENTS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{cards.draftAssignmentCount}</p>
            <p className="mt-1 text-xs text-slate-400">Draft assignments waiting to publish</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {classes.map((classCourse) => {
            const subjectsForClass = classSubjectsMap[classCourse.id] ?? [];
            const assignmentCount = classAssignmentCountMap[classCourse.id] ?? 0;

            return (
              <div key={classCourse.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-extrabold text-slate-800">{classCourse.name} — {classCourse.section}</p>
                    <p className="mt-2 text-sm text-slate-500">{classCourse.academicYear}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {subjectsForClass.map((subject) => (
                        <span key={subject} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{subject}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-slate-800">{assignmentCount}</p>
                    <p className="text-xs text-slate-400">assignments</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-500">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Class</p>
                    <p className="mt-1 text-slate-700">{classCourse.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Section</p>
                    <p className="mt-1 text-slate-700">{classCourse.section}</p>
                  </div>
                </div>

                <button type="button" onClick={() => setSelectedClassId(classCourse.id)} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  View class details
                </button>
              </div>
            );
          })}
        </div>

        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => setSelectedClassId(null)}>
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">{selectedClass.name} — {selectedClass.section}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedClass.academicYear}</p>
                </div>
                <button type="button" onClick={() => setSelectedClassId(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="space-y-5 p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Subjects</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedClass.subjects.length ? selectedClass.subjects.map((subject) => (
                        <span key={subject} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">{subject}</span>
                      )) : <p className="text-sm text-slate-500">No subjects assigned yet.</p>}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Assignments</p>
                    <p className="mt-3 text-2xl font-extrabold text-slate-800">{selectedClass.assignmentCount}</p>
                    <p className="text-sm text-slate-500 mt-1">Total assignments for this class</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-7 py-4">
                <button type="button" onClick={() => setSelectedClassId(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
