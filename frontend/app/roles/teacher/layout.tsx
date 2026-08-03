"use client";

import ProtectedRoute from '@/components/ProtectedRoute';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={['Teacher', 'Admin']}>{children}</ProtectedRoute>;
}
