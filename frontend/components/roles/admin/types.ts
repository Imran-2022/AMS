export type StudentUserRecord = {
  id: string;
  fullName: string;
  email: string;
  status: 'Active' | 'Inactive';
  parentMobile: string;
  classCourseId?: string;
  classCourseName?: string;
  section?: string;
  studentId?: string;
};

export type ClassCourseRecord = {
  id: string;
  name: string;
  section: string;
  academicYear: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
  status: 'Active' | 'Inactive';
  className?: string;
  section?: string;
};

export type ClassRecord = {
  id: number;
  name: string;
  section: string;
  year: string;
  subjects: number;
  students: number;
};

export type SubjectRecord = {
  id: number;
  name: string;
  code: string;
  cls: string;
  teacher: string;
};

export type StudentFormData = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
  parentMobile: string;
  className: string;
  section: string;
};

export type UserFormValues = {
  fullName: string;
  email: string;
  password: string;
  status: 'Active' | 'Inactive';
  parentMobile?: string;
  className?: string;
  section?: string;
};
