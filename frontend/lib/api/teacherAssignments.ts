import { request } from '@/lib/api';

export type TeacherSubjectAssignmentDto = {
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classCourseId: string;
  classCourseName: string;
};

export type CreateTeacherSubjectAssignmentDto = {
  teacherId: string;
  classCourseId: string;
  subjectId: string;
};

export async function getTeacherAssignments(includeAllAcademicYears?: boolean) {
  const params = new URLSearchParams();
  if (includeAllAcademicYears) {
    params.append('includeAllAcademicYears', 'true');
  }
  const query = params.toString();
  return request<TeacherSubjectAssignmentDto[]>(`/api/teacher-assignments${query ? `?${query}` : ''}`);
}

export async function createTeacherAssignment(input: CreateTeacherSubjectAssignmentDto) {
  return request<TeacherSubjectAssignmentDto>(`/api/teacher-assignments`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function deleteTeacherAssignment(teacherId: string, subjectId: string) {
  return request<void>(`/api/teacher-assignments?teacherId=${teacherId}&subjectId=${subjectId}`, {
    method: 'DELETE'
  });
}
