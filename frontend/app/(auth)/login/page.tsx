'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { login } from '@/lib/api';
import { setStoredToken, setStoredUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await login(email, password);
      setStoredToken(result.token);
      setStoredUser(result.user);
      setMessage(`Logged in as ${result.user.fullName} (${result.user.role})`);

      const dashboardPath = result.user.role === 'Admin' ? '/roles/admin/dashboard' : result.user.role === 'Teacher' ? '/roles/teacher/dashboard' : '/roles/student/dashboard';
      router.push(dashboardPath);
    } catch {
      setMessage('Login failed.');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }} />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Login</button>
      </form>
      {message ? <p>{message}</p> : null}
    </main>
  );
}
