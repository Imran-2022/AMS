import { request } from '@/lib/api';

export type StudentEnrollmentDto = {
  studentId: string;
  studentName: string;
  classCourseId: string;
  classCourseName: string;
  parentMobile: string;
  phoneNumber: string;
  avatarUrl: string;
  isActive: boolean;
};

export type CreateStudentEnrollmentDto = {
  studentId: string;
  classCourseId: string;
};

export async function getEnrollments(includeAllYears = false) {
  const params = includeAllYears ? '?includeAllYears=true' : '';
  return request<StudentEnrollmentDto[]>(`/api/enrollments${params}`);
}

export async function createEnrollment(input: CreateStudentEnrollmentDto) {
  return request<StudentEnrollmentDto>(`/api/enrollments`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function deleteEnrollment(studentId: string, classCourseId: string) {
  return request<void>(`/api/enrollments?studentId=${studentId}&classCourseId=${classCourseId}`, {
    method: 'DELETE'
  });
}
