"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearStoredAuth, getStoredUser } from '@/lib/auth';

const roleDashboardMap: Record<string, string> = {
  Admin: '/roles/admin/dashboard',
  Teacher: '/roles/teacher/dashboard',
  Student: '/roles/student/dashboard'
};

export default function TopNav() {
  const user = getStoredUser();
  const router = useRouter();

  function handleLogout() {
    clearStoredAuth();
    router.push('/login');
  }

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        AMS
      </Link>
      <div className="navbar-links">
        <Link href="/">Home</Link>
        {user ? (
          <>
            <Link href={roleDashboardMap[user.role] ?? '/'}>Dashboard</Link>
            <button type="button" className="button secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}
