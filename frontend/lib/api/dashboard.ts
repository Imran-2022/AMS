import { request } from '../api';

export interface AdminDashboardStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalAssignments: number;
  totalSubmissions: number;
}

export interface TeacherDashboardStats {
  activeAssignmentsCount: number;
  draftAssignmentsCount: number;
  pendingGradingSubmissionsCount: number;
  totalGradedSubmissionsCount: number;
  assignedSubjectsCount: number;
}

export interface StudentDashboardStats {
  enrolledClassesCount: number;
  activeAssignmentsCount: number;
  submittedCount: number;
  gradedCount: number;
  upcomingDeadlinesCount: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return request<AdminDashboardStats>('/api/dashboard/admin');
}

export async function getTeacherDashboardStats(): Promise<TeacherDashboardStats> {
  return request<TeacherDashboardStats>('/api/dashboard/teacher');
}

export async function getStudentDashboardStats(): Promise<StudentDashboardStats> {
  return request<StudentDashboardStats>('/api/dashboard/student');
}
