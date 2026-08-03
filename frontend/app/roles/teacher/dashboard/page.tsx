import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <RoleDashboardShell title="Teacher Dashboard" role="Teacher">
        <p>Teacher assignment tools will be added here.</p>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
