"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/assignments')
      .then((res) => res.json())
      .then((data) => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => setAssignments([]));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <main style={{ padding: 24 }}>
        <h1>Teacher Assignments</h1>
        <ul>
          {assignments.map((assignment) => (
            <li key={assignment.id}>{assignment.title}</li>
          ))}
        </ul>
      </main>
    </ProtectedRoute>
  );
}
