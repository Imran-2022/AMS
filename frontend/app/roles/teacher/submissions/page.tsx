"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import {
  gradeSubmission,
  getSubmissions,
  SubmissionDto,
  updateSubmissionStatus
} from '@/lib/api';

export default function TeacherSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [error, setError] = useState<string>('');
  const [gradeInputs, setGradeInputs] = useState<Record<string, { marks: string; feedback: string }>>({});
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});

  const loadSubmissions = async () => {
    try {
      const data = await getSubmissions();
      setSubmissions(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load submissions.');
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const handleGrade = async (submissionId: string) => {
    const grade = gradeInputs[submissionId];
    if (!grade) return;

    try {
      await gradeSubmission(submissionId, {
        marks: Number(grade.marks),
        feedback: grade.feedback
      });
      await loadSubmissions();
      setGradeInputs((current) => ({ ...current, [submissionId]: { marks: '', feedback: '' } }));
    } catch (err: any) {
      setError(err.message || 'Unable to grade submission.');
    }
  };

  const handleStatusUpdate = async (submissionId: string) => {
    const status = statusInputs[submissionId];
    if (!status) return;

    try {
      await updateSubmissionStatus(submissionId, { status });
      await loadSubmissions();
      setStatusInputs((current) => ({ ...current, [submissionId]: '' }));
    } catch (err: any) {
      setError(err.message || 'Unable to update submission status.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Teacher']}>
      <RoleDashboardShell title="Teacher Submissions" role="Teacher">
        {error ? <div className="alert-error">{error}</div> : null}

        <section className="card">
          <div className="section-row">
            <div>
              <h2>Submissions</h2>
              <p style={{ color: 'var(--muted)' }}>
                Review and grade student assignment submissions from your classes.
              </p>
            </div>
          </div>
          <ul className="card-list">
            {submissions.map((submission) => (
              <li key={submission.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <p style={{ margin: 0 }}>
                      <strong>ID:</strong> {submission.id}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Assignment:</strong> {submission.assignmentId}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Student:</strong> {submission.studentId}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Status:</strong> <span className="badge">{submission.status}</span>
                      {' | '}<strong>Late:</strong> {submission.isLate ? 'Yes' : 'No'}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Marks:</strong> {submission.marks ?? 'N/A'}
                    </p>
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)' }}>
                      <strong>Feedback:</strong> {submission.feedback || 'None'}
                    </p>
                  </div>

                  <div className="grid-2" style={{ gap: 18 }}>
                    <section className="card" style={{ padding: 18 }}>
                      <h4 style={{ margin: '0 0 10px' }}>Grade submission</h4>
                      <label className="field-label">
                        Marks
                        <input
                          className="input"
                          type="number"
                          value={gradeInputs[submission.id]?.marks ?? ''}
                          onChange={(e) =>
                            setGradeInputs((current) => ({
                              ...current,
                              [submission.id]: {
                                marks: e.target.value,
                                feedback: current[submission.id]?.feedback ?? ''
                              }
                            }))
                          }
                        />
                      </label>
                      <label className="field-label">
                        Feedback
                        <textarea
                          className="input"
                          rows={3}
                          value={gradeInputs[submission.id]?.feedback ?? ''}
                          onChange={(e) =>
                            setGradeInputs((current) => ({
                              ...current,
                              [submission.id]: {
                                marks: current[submission.id]?.marks ?? '',
                                feedback: e.target.value
                              }
                            }))
                          }
                        />
                      </label>
                      <button type="button" className="button small-button" onClick={() => handleGrade(submission.id)}>
                        Grade submission
                      </button>
                    </section>

                    <section className="card" style={{ padding: 18 }}>
                      <h4 style={{ margin: '0 0 10px' }}>Change status</h4>
                      <label className="field-label">
                        Status
                        <select
                          className="input"
                          value={statusInputs[submission.id] ?? ''}
                          onChange={(e) =>
                            setStatusInputs((current) => ({ ...current, [submission.id]: e.target.value }))
                          }
                        >
                          <option value="">Select status</option>
                          <option value="UnderReview">UnderReview</option>
                          <option value="Graded">Graded</option>
                          <option value="ResubmissionRequested">ResubmissionRequested</option>
                        </select>
                      </label>
                      <button type="button" className="button small-button" onClick={() => handleStatusUpdate(submission.id)}>
                        Update status
                      </button>
                    </section>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
