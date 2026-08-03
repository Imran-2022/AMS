import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AMS',
  description: 'Assignment and Submission Management System'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav style={{ display: 'flex', gap: 12, padding: 16, borderBottom: '1px solid #ddd' }}>
          <Link href="/">Home</Link>
          <Link href="/login">Login</Link>
          <Link href="/roles/admin/dashboard">Admin</Link>
          <Link href="/roles/teacher/dashboard">Teacher</Link>
          <Link href="/roles/student/dashboard">Student</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
