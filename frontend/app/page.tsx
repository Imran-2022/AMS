import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>AMS Frontend</h1>
      <p>Choose a role to continue.</p>
      <ul>
        <li><Link href="/roles/admin/dashboard">Admin</Link></li>
        <li><Link href="/roles/teacher/dashboard">Teacher</Link></li>
        <li><Link href="/roles/student/dashboard">Student</Link></li>
      </ul>
    </main>
  );
}
