import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <RoleDashboardShell title="Admin Dashboard" role="Admin">
        <section className="card-grid grid-3" style={{ marginTop: 24 }}>
          <Link href="/roles/admin/users" className="link-card">
            <h3>Manage users</h3>
            <p>Create, edit, and delete admin, teacher, and student accounts.</p>
          </Link>
          <Link href="/roles/admin/assignments" className="link-card">
            <h3>View assignments</h3>
            <p>See all assignments and publish or update them directly.</p>
          </Link>
          <Link href="/roles/admin/submissions" className="link-card">
            <h3>View submissions</h3>
            <p>Review student work and manage grading status in one place.</p>
          </Link>
        </section>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
