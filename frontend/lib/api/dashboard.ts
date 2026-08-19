import { request } from '../api';

export interface AdminDashboardStats {
  academicYear: string;
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalAssignments: number;
  totalSubmissions: number;
}

export interface TeacherDashboardStats {
  academicYear: string;
  activeAssignmentsCount: number;
  draftAssignmentsCount: number;
  pendingGradingSubmissionsCount: number;
  totalGradedSubmissionsCount: number;
  assignedSubjectsCount: number;
}

export interface StudentDashboardStats {
  studentName: string;
  studentId: string;
  role: string;
  className: string;
  classSection: string;
  groupName?: string;
  academicYear: string;
  enrolledClassesCount: number;
  activeAssignmentsCount: number;
  submittedCount: number;
  gradedCount: number;
  upcomingDeadlinesCount: number;
}

export async function getAdminDashboardStats(academicYearId?: string): Promise<AdminDashboardStats> {
  const params = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : '';
  return request<AdminDashboardStats>(`/api/dashboard/admin${params}`);
}

export async function getTeacherDashboardStats(): Promise<TeacherDashboardStats> {
  return request<TeacherDashboardStats>('/api/dashboard/teacher');
}

export async function getStudentDashboardStats(): Promise<StudentDashboardStats> {
  return request<StudentDashboardStats>('/api/dashboard/student');
}
