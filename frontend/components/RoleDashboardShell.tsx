"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearStoredAuth, getStoredUser } from '@/lib/auth';

export default function RoleDashboardShell({ title, children, role }: { title: string; children: React.ReactNode; role: string }) {
  const user = getStoredUser();
  const router = useRouter();

  const navItems = [
    { href: `/roles/${role.toLowerCase()}/dashboard`, label: 'Dashboard' }
  ];

  if (role === 'Admin') {
    navItems.push(
      { href: '/roles/admin/users', label: 'Users' },
      { href: '/roles/admin/assignments', label: 'Assignments' },
      { href: '/roles/admin/submissions', label: 'Submissions' }
    );
  }

  if (role === 'Teacher') {
    navItems.push(
      { href: '/roles/teacher/assignments', label: 'Assignments' },
      { href: '/roles/teacher/submissions', label: 'Submissions' }
    );
  }

  if (role === 'Student') {
    navItems.push(
      { href: '/roles/student/assignments', label: 'Assignments' },
      { href: '/roles/student/submissions', label: 'Submissions' }
    );
  }

  function handleLogout() {
    clearStoredAuth();
    router.push('/login');
  }

  return (
    <main>
      <section className="card">
        <div className="section-row">
          <div>
            <h1 className="section-title">{title}</h1>
            <p>
              Signed in as <strong>{user?.fullName || 'Unknown'}</strong> ({user?.role || role})
            </p>
          </div>
          <button className="button secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="navbar-links" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {children}
    </main>
  );
}
