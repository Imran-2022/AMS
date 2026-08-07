"use client";

import { useEffect, useState } from 'react';
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

  const totalAdmins = INITIAL_USERS.filter((user) => user.role === 'Admin').length;
  const totalTeachers = INITIAL_USERS.filter((user) => user.role === 'Teacher').length;
  const totalStudents = INITIAL_USERS.filter((user) => user.role === 'Student').length;

  useEffect(() => {
    void loadDashboard();
  }, []);

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
      })));
      setDashboardSubjects(subjects.map((subject: any) => ({
        id: subject.id,
        name: subject.name,
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
              <h2 className="text-2xl font-bold mb-1">Here's today's school overview.</h2>
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
              <button type="button" className="text-sm font-semibold text-[#7C3AED] hover:text-[#5B21B6]">View all</button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A8F98] border-t border-[#ECECEF] pt-3">
              <span>Title</span>
              <span>Class</span>
              <span>Teacher</span>
              <span>Deadline</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#ECECEF] bg-white p-5">
            <p className="text-sm font-semibold text-[#1F2430]">Recent submissions</p>
            <p className="text-sm text-[#8A8F98] mb-3">Review the latest student work.</p>
            <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#8A8F98] border-t border-[#ECECEF] pt-3">
              <span>Student</span>
              <span>Assignment</span>
              <span>Submitted</span>
              <span>Status</span>
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
              alert('Unable to create student. Please check the data and try again.');
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
            subjectSpecialization: '',
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
                subjectSpecialization: values.subjectSpecialization ?? '',
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
