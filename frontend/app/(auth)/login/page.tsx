'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { getStoredUser, setStoredToken, setStoredUser } from '@/lib/auth';

const roleDashboardMap: Record<string, string> = {
  Admin: '/roles/admin/dashboard',
  Teacher: '/roles/teacher/dashboard',
  Student: '/roles/student/dashboard'
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace(roleDashboardMap[user.role] ?? '/');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await login(email, password);
      setStoredToken(result.token);
      setStoredUser(result.user);
      setMessage(`Logged in as ${result.user.fullName} (${result.user.role})`);

      router.push(roleDashboardMap[result.user.role] ?? '/');
    } catch {
      setMessage('Login failed.');
    }
  }

  return (
    <main>
      <section className="card" style={{ maxWidth: 460, margin: '48px auto' }}>
        <h1 className="section-title">Sign in to AMS</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Enter your account credentials to access the admin, teacher, or student workspace.
        </p>
        <form onSubmit={handleSubmit} className="form-row">
          <label className="field-label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="button">
              Login
            </button>
          </div>
        </form>
        {message ? <p style={{ color: 'var(--muted)', marginTop: 16 }}>{message}</p> : null}
      </section>
    </main>
  );
}
