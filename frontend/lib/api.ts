import { clearStoredAuth, getStoredRefreshToken, getStoredToken, setStoredRefreshToken, setStoredToken, setStoredUser } from './auth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type ApiResponse<T> = T;

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]> = {}, message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Parse API error response and extract user-friendly message
 * Handles both Problem Details format (backend standard) and generic errors
 */
function parseErrorResponse(status: number, text: string): { message: string; errors: Record<string, string[]> } {
  try {
    const json = JSON.parse(text);
    
    // Handle Problem Details (RFC 7807) format
    if (json.detail || json.title) {
      const message = json.detail || json.title || 'An error occurred';
      const errors = json.errors || {};
      return { message, errors };
    }
    
    // Fallback to any error message in the JSON
    if (json.message) {
      return { message: json.message, errors: {} };
    }
    
    // If JSON but no recognized error format
    return { message: 'An error occurred', errors: {} };
  } catch {
    // Not valid JSON - might be HTML error page or plain text
    if (status === 404) {
      return { message: 'Resource not found', errors: {} };
    }
    if (status === 403) {
      return { message: 'You do not have permission to perform this action', errors: {} };
    }
    if (status === 500) {
      return { message: 'Server error. Please try again later', errors: {} };
    }
    // Generic fallback
    return { message: `Request failed with status ${status}`, errors: {} };
  }
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('ams-token');
}

export async function downloadFile(url: string) {
  const token = getAuthToken();
  const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(targetUrl, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.blob();
}

export async function downloadAttachmentToBrowser(url: string, fileName?: string) {
  const blob = await downloadFile(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
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

function normalizeDownloadUrl(url?: string) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/${url}`;
}

function normalizeApiPayload<T>(payload: T): T {
  if (!payload || typeof payload !== 'object') return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeApiPayload(item)) as unknown as T;
  }

  const clone = { ...payload } as any;

  if (typeof clone.downloadUrl === 'string') {
    clone.downloadUrl = normalizeDownloadUrl(clone.downloadUrl);
  }

  if (typeof clone.attachmentUrl === 'string') {
    // legacy field removed from API; keep backward-compatible handling if present
    clone.attachmentUrl = normalizeDownloadUrl(clone.attachmentUrl);
  }

  if (typeof clone.avatarUrl === 'string') {
    clone.avatarUrl = normalizeDownloadUrl(clone.avatarUrl);
  }

  if (Array.isArray(clone.attachments)) {
    clone.attachments = clone.attachments.map((item: unknown) => {
      if (!item || typeof item !== 'object') return item;
      const normalized = { ...(item as any) };
      if (typeof normalized.downloadUrl === 'string') {
        normalized.downloadUrl = normalizeDownloadUrl(normalized.downloadUrl);
      }
      return normalized;
    });
  }

  if (Array.isArray(clone.feedbackAttachments)) {
    clone.feedbackAttachments = clone.feedbackAttachments.map((item: unknown) => {
      if (!item || typeof item !== 'object') return item;
      const normalized = { ...(item as any) };
      if (typeof normalized.downloadUrl === 'string') {
        normalized.downloadUrl = normalizeDownloadUrl(normalized.downloadUrl);
      }
      return normalized;
    });
  }

  return clone;
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

    // Parse error response to extract meaningful message
    const errorText = await response.text();
    const { message, errors } = parseErrorResponse(response.status, errorText);
    
    // If there are field validation errors, throw ValidationError
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors, message);
    }
    
    // Otherwise throw regular error with user-friendly message
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) return undefined as unknown as ApiResponse<T>;

  const parsed = JSON.parse(text) as ApiResponse<T>;
  return normalizeApiPayload(parsed);
}

export type AssignmentDto = {
  id: string;
  title: string;
  description: string;
  classCourseId: string;
  classCourseName: string;
  classCourseSection: string;
  groupName?: string;
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
  updatedAt?: string;
  submittedCount?: number;
  totalStudents?: number;
  attachments?: AttachmentDto[];
};

export type AttachmentDto = {
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
};

export type SubmissionDto = {
  id: string;
  assignmentId: string;
  studentId: string;
  contentText: string;
  submittedAt: string;
  isLate: boolean;
  status: string;
  marks?: number;
  maxMarks?: number;
  feedback?: string;
  gradedByTeacherId?: string;
  gradedAt?: string;
  studentName: string;
  studentInitials: string;
  avatarUrl?: string;
  assignmentTitle: string;
  classCourseName: string;
  classCourseSection: string;
  groupName?: string;
  attachments?: AttachmentDto[];
  feedbackAttachments?: AttachmentDto[];
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
  createdAt?: string;
  updatedAt?: string;
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
};

export type UpdateSubmissionDto = {
  contentText?: string;
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
  academicYear?: string;
  academicYearId?: string;
  academicYearName?: string;
  classDefinitionId?: string | null;
  classDefinitionName?: string;
  groupId?: string | null;
  groupName?: string | null;
};

export type CreateClassCourseDto = {
  classDefinitionId?: string;
  groupId?: string | null;
  name: string;
  section: string;
  academicYearId: string;
};

export type UpdateClassCourseDto = {
  classDefinitionId?: string;
  groupId?: string | null;
  name?: string;
  section?: string;
  academicYearId?: string;
};

export type SubjectDto = {
  id: string;
  name: string;
  code: string;
  classCourseId: string;
};

export type StudentEnrollmentDto = {
  studentId: string;
  studentName: string;
  classCourseId: string;
  classCourseName: string;
  rollNumber?: string | null;
};

export type TeacherSubjectAssignmentDto = {
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classCourseId: string;
  classCourseName: string;
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

export async function getSubmission(id: string) {
  return request<SubmissionDto>(`/api/submissions/${id}`);
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

export async function getNextStudentId(classCourseId: string, groupId?: string) {
  const params = new URLSearchParams({ classCourseId });
  if (groupId) params.append('groupId', groupId);
  return request<{ studentId: string }>(`/api/users/next-student-id?${params}`);
}

export async function getClassCourses(includeAllYears = false) {
  const params = includeAllYears ? '?includeAllYears=true' : '';
  return request<ClassCourseDto[]>(`/api/classes${params}`);
}

export async function getEnrollments(includeAllYears = false) {
  const params = includeAllYears ? '?includeAllYears=true' : '';
  return request<StudentEnrollmentDto[]>(`/api/enrollments${params}`);
}

export async function getAcademicYears() {
  return request<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }[]>(`/api/academic-years`);
}

export async function getActiveAcademicYear() {
  return request<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }>(`/api/academic-years/active`);
}

export function notifyAcademicYearChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ams-academic-year-updated'));
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

export async function duplicateAssignment(id: string) {
  return request<AssignmentDto>(`/api/assignments/${id}/duplicate`, {
    method: 'POST'
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

export async function renameAttachment(id: string, newOriginalFileName: string) {
  return request<AttachmentDto>(`/api/attachments/${id}/rename`, {
    method: 'PATCH',
    body: JSON.stringify({ newOriginalFileName })
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

export async function promoteStudent(input: { studentId: string; fromClassCourseId: string; toClassCourseId: string; newRollNumber?: string }) {
  return request<StudentEnrollmentDto>(`/api/enrollments/promote`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function bulkPromoteStudents(input: { fromClassCourseId: string; toClassCourseId: string; students: Array<{ studentId: string; newRollNumber?: string }> }) {
  return request<StudentEnrollmentDto[]>(`/api/enrollments/bulk-promote`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function reassignTeacher(input: { teacherId: string; fromSubjectId: string; toSubjectId: string }) {
  return request<TeacherSubjectAssignmentDto>(`/api/teacher-assignments/reassign`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function bulkReassignTeachers(input: { fromSubjectId: string; toSubjectId: string; teacherIds: string[] }) {
  return request<TeacherSubjectAssignmentDto[]>(`/api/teacher-assignments/bulk-reassign`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
