const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type ApiResponse<T> = T;

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ams-token');
}

export async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {})
    },
    ...init
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as ApiResponse<T>) : (undefined as unknown as ApiResponse<T>);
}

export type AssignmentDto = {
  id: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  classCourseId: string;
  subjectId: string;
  teacherId: string;
  deadline: string;
  maxMarks: number;
  status: string;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  createdAt: string;
};

export type SubmissionDto = {
  id: string;
  assignmentId: string;
  studentId: string;
  contentText: string;
  fileUrl?: string;
  submittedAt: string;
  isLate: boolean;
  status: string;
  marks?: number;
  feedback?: string;
  gradedByTeacherId?: string;
  gradedAt?: string;
};

export type UserDto = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatarUrl: string;
  phoneNumber: string;
  employeeId: string;
  subjectSpecialization: string;
  qualification: string;
  guardianName: string;
  guardianEmail: string;
  address: string;
  studentId: string;
  gender: string;
  dateOfBirth?: string;
  admissionDate?: string;
  joiningDate?: string;
  parentMobile: string;
};

export type CreateUserDto = {
  fullName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  employeeId?: string;
  subjectSpecialization?: string;
  qualification?: string;
  guardianName?: string;
  guardianEmail?: string;
  address?: string;
  studentId?: string;
  gender?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  joiningDate?: string;
  parentMobile?: string;
};

export type UpdateUserDto = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
  avatarUrl?: string;
  phoneNumber?: string;
  employeeId?: string;
  subjectSpecialization?: string;
  qualification?: string;
  guardianName?: string;
  guardianEmail?: string;
  address?: string;
  studentId?: string;
  gender?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  joiningDate?: string;
  parentMobile?: string;
};

export type CreateAssignmentDto = {
  title: string;
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  classCourseId: string;
  subjectId: string;
  teacherId?: string;
  deadline: string;
  maxMarks: number;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
};

export type UpdateAssignmentDto = {
  title?: string;
  description?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  classCourseId?: string;
  subjectId?: string;
  deadline?: string;
  maxMarks?: number;
  allowLateSubmission?: boolean;
  allowResubmission?: boolean;
};

export type CreateSubmissionDto = {
  assignmentId: string;
  contentText: string;
  fileUrl?: string;
};

export type UpdateSubmissionDto = {
  contentText?: string;
  fileUrl?: string;
};

export type GradeSubmissionDto = {
  marks: number;
  feedback?: string;
};

export type UpdateSubmissionStatusDto = {
  status: string;
};

export type ClassCourseDto = {
  id: string;
  name: string;
  section: string;
  academicYear: string;
};

export type CreateClassCourseDto = {
  name: string;
  section: string;
  academicYear: string;
};

export type UpdateClassCourseDto = {
  name?: string;
  section?: string;
  academicYear?: string;
};

export type SubjectDto = {
  id: string;
  name: string;
  code: string;
  classCourseId: string;
};

export type CreateSubjectDto = {
  name: string;
  code: string;
  classCourseId: string;
};

export type UpdateSubjectDto = {
  name?: string;
  code?: string;
  classCourseId?: string;
};

export async function login(email: string, password: string) {
  return request<{ token: string; user: UserDto }>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function getAssignments() {
  return request<AssignmentDto[]>(`/api/assignments`);
}

export async function getSubmissions() {
  return request<SubmissionDto[]>(`/api/submissions`);
}

export async function getMySubmissions() {
  return request<SubmissionDto[]>(`/api/submissions/mine`);
}

export async function getUsers() {
  return request<UserDto[]>(`/api/users`);
}

export async function createUser(input: CreateUserDto) {
  return request<UserDto>(`/api/users`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateUser(id: string, input: UpdateUserDto) {
  return request<UserDto>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteUser(id: string) {
  return request<void>(`/api/users/${id}`, {
    method: 'DELETE'
  });
}

export async function toggleUserStatus(id: string) {
  return request<UserDto>(`/api/users/${id}/toggle-status`, {
    method: 'PATCH'
  });
}

export async function getClassCourses() {
  return request<ClassCourseDto[]>(`/api/classes`);
}

export async function getSubjects() {
  return request<SubjectDto[]>(`/api/subjects`);
}

export async function createClassCourse(input: CreateClassCourseDto) {
  return request<ClassCourseDto>(`/api/classes`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateClassCourse(id: string, input: UpdateClassCourseDto) {
  return request<ClassCourseDto>(`/api/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteClassCourse(id: string) {
  return request<void>(`/api/classes/${id}`, {
    method: 'DELETE'
  });
}

export async function createSubject(input: CreateSubjectDto) {
  return request<SubjectDto>(`/api/subjects`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateSubject(id: string, input: UpdateSubjectDto) {
  return request<SubjectDto>(`/api/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteSubject(id: string) {
  return request<void>(`/api/subjects/${id}`, {
    method: 'DELETE'
  });
}

export async function createAssignment(input: CreateAssignmentDto) {
  return request<AssignmentDto>(`/api/assignments`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateAssignment(id: string, input: UpdateAssignmentDto) {
  return request<AssignmentDto>(`/api/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteAssignment(id: string) {
  return request<void>(`/api/assignments/${id}`, {
    method: 'DELETE'
  });
}

export async function publishAssignment(id: string) {
  return request<AssignmentDto>(`/api/assignments/${id}/publish`, {
    method: 'PATCH'
  });
}

export async function createSubmission(input: CreateSubmissionDto) {
  return request<SubmissionDto>(`/api/submissions`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateSubmission(id: string, input: UpdateSubmissionDto) {
  return request<SubmissionDto>(`/api/submissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteSubmission(id: string) {
  return request<void>(`/api/submissions/${id}`, {
    method: 'DELETE'
  });
}

export async function gradeSubmission(id: string, input: GradeSubmissionDto) {
  return request<SubmissionDto>(`/api/submissions/${id}/grade`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

export async function updateSubmissionStatus(id: string, input: UpdateSubmissionStatusDto) {
  return request<SubmissionDto>(`/api/submissions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}
