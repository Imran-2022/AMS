"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { TEACHER_ROLES } from '@/lib/roles';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={TEACHER_ROLES}>{children}</ProtectedRoute>;
}
