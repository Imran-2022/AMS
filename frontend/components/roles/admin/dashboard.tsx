"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../layout/AppShell';
import { Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td, AddStudentModal, AddTeacherModal, TeacherAssignmentModal } from '../../ui';
import { ASSIGNMENTS, USERS as INITIAL_USERS, CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS, SUBMISSIONS } from '../../data';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getSubmissions, getUsers as apiGetUsers, getSubjects } from '@/lib/api';
import { MoreVertical, UserPlus, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';
import { createTeacherAssignment } from '@/lib/api/teacherAssignments';

import type { ClassCourseRecord} from './types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getAdminDashboardStats>> | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);
  const [studentModalSubmitting, setStudentModalSubmitting] = useState(false);
  const [teacherModalSubmitting, setTeacherModalSubmitting] = useState(false);
  const [assignTeacherSubmitting, setAssignTeacherSubmitting] = useState(false);
  const [dashboardClassCourses, setDashboardClassCourses] = useState<ClassCourseRecord[]>([]);
  const [dashboardTeachers, setDashboardTeachers] = useState<{ id: string; fullName: string }[]>([]);
  const [dashboardSubjects, setDashboardSubjects] = useState<{ id: string; name: string; classCourseId: string }[]>([]);

  const router = useRouter();
  const totalAdmins = INITIAL_USERS.filter((user) => user.role === 'Admin').length;
  const totalTeachers = INITIAL_USERS.filter((user) => user.role === 'Teacher').length;
  const totalStudents = INITIAL_USERS.filter((user) => user.role === 'Student').length;

  useEffect(() => {
    void loadDashboard();
  }, []);

  const goToAssignments = () => router.push('/roles/admin/assignments');
  const goToSubmissions = () => router.push('/roles/admin/submissions');
  const goToAssignmentDetail = (assignmentId: string) => router.push(`/roles/admin/assignments/${assignmentId}`);
  const goToSubmissionDetail = (submissionId: string) => router.push(`/roles/admin/submissions/${submissionId}`);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const [s, assignments, submissions, classes, users, subjects] = await Promise.all([
        getAdminDashboardStats(),
        getAssignments(),
        getSubmissions(),
        getClassCourses(),
        apiGetUsers(),
        getSubjects(),
      ]);
      setStats(s);
      setRecentAssignments(assignments.slice(0, 8));
      setRecentSubmissions(submissions.slice(0, 8));
      setDashboardClassCourses(classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        section: cls.section,
        academicYear: cls.academicYear,
      })));
      setDashboardTeachers(users.filter((user: any) => user.role === 'Teacher').map((teacher: any) => ({
        id: teacher.id,
        fullName: teacher.fullName,
        subjectSpecialization: teacher.subjectSpecialization ?? '',
      })));
      setDashboardSubjects(subjects.map((subject: any) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        classCourseId: subject.classCourseId,
      })));
    } catch (err) {
      console.error(err);
      setLoadError('Unable to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Dashboard">
      <div className="grid gap-6">
        <section className="rounded-2xl border border-[#ECECEF] bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase text-[#7C3AED] mb-1">GOOD {new Date().getHours() < 12 ? 'MORNING' : new Date().getHours() < 18 ? 'AFTERNOON' : 'EVENING'}, SYSTEM ADMIN</p>
              <h2 className="text-2xl font-bold mb-1">Stay on top of teaching and student work.</h2>
              <p className="text-[13px] text-[#8A8F98]">A cleaner, responsive dashboard for student, teacher, and assignment operations.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => setStudentModalOpen(true)}>Add Student</Button>
              <Button type="button" variant="secondary" onClick={() => setTeacherModalOpen(true)}>Add Teacher</Button>
              <Button type="button" variant="secondary" onClick={() => setAssignTeacherOpen(true)}>Assign Teacher</Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#8A8F98] font-semibold uppercase tracking-wide">STUDENTS</p>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3EEFF] text-[#7C3AED]">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{isLoading ? '—' : `${stats?.totalStudents ?? 0}`}</p>
            <p className="text-[12px] text-[#8A8F98] mt-1">Active learners</p>
          </div>
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#8A8F98] font-semibold uppercase tracking-wide">TEACHERS</p>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3EEFF] text-[#7C3AED]">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{isLoading ? '—' : `${stats?.totalTeachers ?? 0}`}</p>
            <p className="text-[12px] text-[#8A8F98] mt-1">Active instructors</p>
          </div>
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#8A8F98] font-semibold uppercase tracking-wide">CLASSES</p>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3EEFF] text-[#7C3AED]">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{isLoading ? '—' : `${stats?.totalClasses ?? 0}`}</p>
            <p className="text-[12px] text-[#8A8F98] mt-1">Active courses</p>
          </div>
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-[#8A8F98] font-semibold uppercase tracking-wide">PUBLISHED ASSIGNMENTS</p>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3EEFF] text-[#7C3AED]">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold">{isLoading ? '—' : `${stats?.totalAssignments ?? 0}`}</p>
            <p className="text-[12px] text-[#8A8F98] mt-1">Live classroom work</p>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#1F2430]">Recent assignments</p>
                <p className="text-sm text-[#8A8F98]">Latest published work from teachers.</p>
              </div>
              <span className="cursor-pointer text-xs font-bold text-brand-700 transition-colors hover:text-brand-900" onClick={goToAssignments}>View assignments →</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A8F98] border-t border-[#ECECEF] pt-3 pb-3">
              <span>Title</span>
              <span>Class</span>
              <span>Teacher</span>
              <span>Deadline</span>
            </div>
            <div className="space-y-3">
              {recentAssignments.length > 0 ? (
                recentAssignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    onClick={() => goToAssignmentDetail(assignment.id)}
                    className="w-full grid items-center grid-cols-4 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left text-sm text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <span className="min-w-0 truncate">{assignment.title ?? '—'}</span>
                    <span className="min-w-0 truncate">{assignment.classCourseName ?? assignment.classCourseId ?? '—'}</span>
                    <span className="min-w-0 truncate">{assignment.teacherName ?? '—'}</span>
                    <span className="min-w-0 truncate">{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : '—'}</span>
                  </button>
                ))
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M8 7h8M8 11h5M8 15l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-slate-700">You’re all caught up</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-400">There are no recent assignments available right now.</p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-[#1F2430]">Recent submissions</p>
                <p className="text-sm text-[#8A8F98]">Review the latest student work.</p>
              </div>
              <span className="cursor-pointer text-xs font-bold text-brand-700 transition-colors hover:text-brand-900" onClick={goToSubmissions}>View submissions →</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A8F98] border-t border-[#ECECEF] pt-3 pb-3">
              <span>Student</span>
              <span>Assignment</span>
              <span>Submitted</span>
              <span>Status</span>
            </div>
            <div className="space-y-3">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    type="button"
                    onClick={() => goToSubmissionDetail(submission.id)}
                    className="w-full grid items-center grid-cols-4 gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left text-sm text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    <span className="min-w-0 truncate">{submission.studentName ?? '—'}</span>
                    <span className="min-w-0 truncate">{submission.assignmentTitle ?? '—'}</span>
                    <span className="min-w-0 truncate">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '—'}</span>
                    <span className="min-w-0 truncate">{submission.status ?? '—'}</span>
                  </button>
                ))
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="4" y="3" width="16" height="18" rx="2" />
                      <path d="M8 7h8M8 11h5M8 15l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-base font-bold text-slate-700">You’re all caught up</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-400">There are no submissions waiting for your review.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <AddStudentModal
          open={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          title="Add student"
          submitLabel="Create student"
          classCourses={dashboardClassCourses}
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            status: 'Active',
            studentId: '',
            className: dashboardClassCourses[0]?.name ?? '',
            section: dashboardClassCourses[0]?.section ?? '',
            guardianName: '',
            parentMobile: '',
            guardianEmail: '',
          }}
          isSubmitting={studentModalSubmitting}
          requirePassword
          onSubmit={async (values) => {
            try {
              setStudentModalSubmitting(true);
              const created = await createUser({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: 'Student',
                isActive: values.status === 'Active',
                parentMobile: values.parentMobile ?? '',
              });
              const selectedClass = dashboardClassCourses.find((cls) => cls.name === values.className && cls.section === values.section);
              if (selectedClass) {
                await createEnrollment({ studentId: created.id, classCourseId: selectedClass.id });
              }
              setStudentModalOpen(false);
              await loadDashboard();
            } catch (err) {
              console.error(err);
              alert(err instanceof Error ? err.message : 'Unable to create student. Please check the data and try again.');
            } finally {
              setStudentModalSubmitting(false);
            }
          }}
        />
        <AddTeacherModal
          open={teacherModalOpen}
          onClose={() => setTeacherModalOpen(false)}
          title="Add teacher"
          submitLabel="Create teacher"
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            status: 'Active',
            phone: '',
            gender: '',
            qualification: '',
            joiningDate: '',
            subjectSpecializations: [],
          }}
          isSubmitting={teacherModalSubmitting}
          requirePassword
          onSubmit={async (values) => {
            try {
              setTeacherModalSubmitting(true);
              await createUser({
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                role: 'Teacher',
                isActive: values.status === 'Active',
                phoneNumber: values.phone ?? '',
                gender: values.gender ?? '',
                qualification: values.qualification ?? '',
                joiningDate: values.joiningDate ?? '',
                subjectSpecialization: (values.subjectSpecializations ?? []).join(', '),
              });
              setTeacherModalOpen(false);
              await loadDashboard();
            } catch (err) {
              console.error(err);
              alert('Unable to create teacher. Please check the data and try again.');
            } finally {
              setTeacherModalSubmitting(false);
            }
          }}
        />
        <TeacherAssignmentModal
          open={assignTeacherOpen}
          onClose={() => setAssignTeacherOpen(false)}
          title="Assign teacher"
          submitLabel="Assign teacher"
          teachers={dashboardTeachers}
          classCourses={dashboardClassCourses}
          subjects={dashboardSubjects}
          assignments={[]}
          isSubmitting={assignTeacherSubmitting}
          onSubmit={async (values) => {
            try {
              setAssignTeacherSubmitting(true);
              await createTeacherAssignment(values);
              setAssignTeacherOpen(false);
              await loadDashboard();
            } catch (err) {
              console.error(err);
              alert('Unable to assign teacher. Please try again.');
            } finally {
              setAssignTeacherSubmitting(false);
            }
          }}
        />
      </div>
    </AppShell>
  );
}
