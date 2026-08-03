import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <RoleDashboardShell title="Student Dashboard" role="Student">
        <p>Student assignment views will be added here.</p>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
