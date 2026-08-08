import { clearStoredAuth, getStoredRefreshToken, getStoredToken, setStoredRefreshToken, setStoredToken, setStoredUser } from './auth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type ApiResponse<T> = T;

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ams-token');
}
export function logout(redirect = true) {
  if (typeof window === 'undefined') return;
  try {
    clearStoredAuth();
  } catch {
    /* ignore */
  }
  if (redirect) {
    window.location.href = '/login';
  }
}

export async function request<T>(path: string, init?: RequestInit, retry = false): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {})
      },
      ...init
    });
  } catch (networkErr) {
    // Network/CORS/dev-server errors should bubble up so callers can decide what to do.
    throw networkErr instanceof Error ? networkErr : new Error('Network request failed');
  }

  if (!response.ok) {
    if (response.status === 401) {
      const refreshToken = getStoredRefreshToken();
      if (refreshToken && !retry) {
        try {
          const refreshed = await refreshSession();
          if (refreshed) {
            return request<T>(path, init, true);
          }
        } catch {
          // ignore and fall through to logout
        }
      }
      logout(true);
      throw new UnauthorizedError();
    }

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
  classCourseName: string;
  classCourseSection: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName?: string;
  deadline: string;
  maxMarks: number;
  status: string;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  createdAt: string;
  submittedCount?: number;
  totalStudents?: number;
};

export type SubmissionDto = {
  id: string;
  assignmentId: string;
  studentId: string;
  contentText: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: string;
  isLate: boolean;
  status: string;
  marks?: number;
  feedback?: string;
  gradedByTeacherId?: string;
  gradedAt?: string;
  studentName: string;
  studentInitials: string;
  assignmentTitle: string;
  classCourseName: string;
  classCourseSection: string;
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
  fileName?: string;
};

export type UpdateSubmissionDto = {
  contentText?: string;
  fileUrl?: string;
  fileName?: string;
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
  classDefinitionId?: string | null;
  groupId?: string | null;
};

export type CreateClassCourseDto = {
  classDefinitionId?: string;
  groupId?: string | null;
  name: string;
  section: string;
  academicYear: string;
};

export type UpdateClassCourseDto = {
  classDefinitionId?: string;
  groupId?: string | null;
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
  const response = await request<any>(`/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  const normalizedResponse = {
    token: response.token ?? response.Token,
    refreshToken: response.refreshToken ?? response.RefreshToken,
    user: response.user ?? response.User
  };

  if (!normalizedResponse.token || !normalizedResponse.user) {
    throw new Error('Invalid login response');
  }

  if (normalizedResponse.refreshToken) {
    setStoredRefreshToken(normalizedResponse.refreshToken);
  }

  return normalizedResponse as { token: string; refreshToken: string; user: UserDto };
}

async function refreshSession() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) return false;

  const data = await response.json();
  const token = data.token ?? data.Token;
  if (!token) return false;

  setStoredToken(token);

  const refreshedRefreshToken = data.refreshToken ?? data.RefreshToken;
  if (refreshedRefreshToken) {
    setStoredRefreshToken(refreshedRefreshToken);
  }

  const refreshedUser = data.user ?? data.User;
  if (refreshedUser) {
    setStoredUser(refreshedUser as UserDto);
  }

  return true;
}

export async function getCurrentUser() {
  return request<UserDto>(`/api/auth/me`);
}

export async function getUserById(id: string) {
  return request<UserDto>(`/api/users/${id}`);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return request<void>(`/api/auth/change-password`, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function getAssignments() {
  return request<AssignmentDto[]>(`/api/assignments`);
}

export async function getAssignment(id: string) {
  return request<AssignmentDto>(`/api/assignments/${id}`);
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

export async function getAcademicYears() {
  return request<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }[]>(`/api/academic-years`);
}

export async function getActiveAcademicYear() {
  return request<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }>(`/api/academic-years/active`);
}

export async function activateAcademicYear(yearId: string) {
  return request<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }>(`/api/academic-years/${yearId}/activate`, {
    method: 'POST'
  });
}

export async function createAcademicYear(input: { name: string; startDate: string; endDate: string; isActive: boolean }) {
  return request<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }>(`/api/academic-years`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function getClassDefinitions() {
  return request<{ id: string; name: string }[]>(`/api/class-definitions`);
}

export async function getGroupsForClass(classDefinitionId: string) {
  return request<{ id: string; name: string }[]>(`/api/class-definitions/${classDefinitionId}/groups`);
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

export async function unpublishAssignment(id: string) {
  return request<AssignmentDto>(`/api/assignments/${id}/unpublish`, {
    method: 'PATCH'
  });
}

export async function createSubmission(input: CreateSubmissionDto) {
  return request<SubmissionDto>(`/api/submissions`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function uploadAttachment(ownerType: string, ownerId: string, file: File) {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('ams-token') : null;

  const formData = new FormData();
  formData.append('ownerType', ownerType);
  formData.append('ownerId', ownerId);
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/attachments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err || 'Failed to upload attachment');
  }

  return response.json();
}

export async function listAttachments(ownerType: string, ownerId: string) {
  return request<{
    id: string;
    ownerType: string;
    ownerId: string;
    originalFileName: string;
    storedFileName: string;
    contentType: string;
    sizeBytes: number;
    uploadedByUserId: string;
    uploadedAt: string;
    downloadUrl: string;
  }[]>(`/api/attachments?ownerType=${encodeURIComponent(ownerType)}&ownerId=${encodeURIComponent(ownerId)}`);
}

export async function deleteAttachment(id: string) {
  return request<void>(`/api/attachments/${id}`, { method: 'DELETE' });
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
