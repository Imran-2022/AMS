"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import { getAssignments, AssignmentDto } from '@/lib/api';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getAssignments()
      .then((data) => setAssignments(data))
      .catch((err) => setError(err.message || 'Unable to load assignments.'));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <RoleDashboardShell title="Student Assignments" role="Student">
        {error ? <div className="alert-error">{error}</div> : null}

        <section className="card">
          <div className="section-row">
            <div>
              <h2>Assignments</h2>
              <p style={{ color: 'var(--muted)' }}>
                Browse assignments assigned to your enrolled classes.
              </p>
            </div>
          </div>
          <ul className="card-list">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="card" style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 10px' }}>{assignment.title}</h3>
                <p style={{ margin: '0 0 10px', color: 'var(--muted)' }}>{assignment.description}</p>
                <p style={{ margin: 0 }}>
                  <span className="badge">{assignment.status}</span>
                  <span style={{ marginLeft: 12 }}>Deadline: {new Date(assignment.deadline).toLocaleString()}</span>
                </p>
                <p style={{ margin: '10px 0 0' }}>Max marks: {assignment.maxMarks}</p>
              </li>
            ))}
          </ul>
        </section>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
