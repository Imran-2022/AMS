import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import Link from 'next/link';

export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <RoleDashboardShell title="Student Dashboard" role="Student">
        <section className="card-grid grid-2" style={{ marginTop: 24 }}>
          <Link href="/roles/student/assignments" className="link-card">
            <h3>My assignments</h3>
            <p>See available assignments, deadlines, and assignment details.</p>
          </Link>
          <Link href="/roles/student/submissions" className="link-card">
            <h3>My submissions</h3>
            <p>Submit work, edit drafts, and review grades from teachers.</p>
          </Link>
        </section>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
