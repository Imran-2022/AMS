import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <RoleDashboardShell title="Admin Dashboard" role="Admin">
        <p>Administrative views will be added here.</p>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
