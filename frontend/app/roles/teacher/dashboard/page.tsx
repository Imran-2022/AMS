import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import Link from 'next/link';

export default function TeacherDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <RoleDashboardShell title="Teacher Dashboard" role="Teacher">
        <section className="card-grid grid-2" style={{ marginTop: 24 }}>
          <Link href="/roles/teacher/assignments" className="link-card">
            <h3>My assignments</h3>
            <p>Create and manage assignments for your classes.</p>
          </Link>
          <Link href="/roles/teacher/submissions" className="link-card">
            <h3>Submissions</h3>
            <p>Evaluate student submissions and update grades or status.</p>
          </Link>
        </section>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
