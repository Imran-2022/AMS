"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/submissions')
      .then((res) => res.json())
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <main style={{ padding: 24 }}>
        <h1>Student Submissions</h1>
        <ul>
          {submissions.map((submission) => (
            <li key={submission.id}>{submission.id}</li>
          ))}
        </ul>
      </main>
    </ProtectedRoute>
  );
}
