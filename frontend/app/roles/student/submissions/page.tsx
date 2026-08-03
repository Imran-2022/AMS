"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import {
  AssignmentDto,
  createSubmission,
  getAssignments,
  getMySubmissions,
  SubmissionDto,
  updateSubmission
} from '@/lib/api';

const emptyForm = {
  assignmentId: '',
  contentText: '',
  fileUrl: ''
};

export default function StudentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    try {
      const [submissionData, assignmentData] = await Promise.all([getMySubmissions(), getAssignments()]);
      setSubmissions(submissionData);
      setAssignments(assignmentData);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load student data.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSubmission(editingId, {
          contentText: form.contentText,
          fileUrl: form.fileUrl || undefined
        });
      } else {
        await createSubmission({
          assignmentId: form.assignmentId,
          contentText: form.contentText,
          fileUrl: form.fileUrl || undefined
        });
      }
      await loadData();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Unable to save submission.');
    }
  };

  const startEdit = (submission: SubmissionDto) => {
    setForm({
      assignmentId: submission.assignmentId,
      contentText: submission.contentText,
      fileUrl: submission.fileUrl ?? ''
    });
    setEditingId(submission.id);
  };

  return (
    <ProtectedRoute allowedRoles={['Student']}>
      <RoleDashboardShell title="Student Submissions" role="Student">
        {error ? <div className="alert-error">{error}</div> : null}

        <section className="card" style={{ marginBottom: 24 }}>
          <div className="section-row">
            <div>
              <h2>{editingId ? 'Update Submission' : 'New Submission'}</h2>
              <p style={{ color: 'var(--muted)' }}>
                Submit your assignment content and attach a file link if needed.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="form-row">
            <label className="field-label">
              Assignment
              <select
                className="input"
                value={form.assignmentId}
                onChange={(e) => setForm({ ...form, assignmentId: e.target.value })}
                required
                disabled={Boolean(editingId)}
              >
                <option value="">Select assignment</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} ({assignment.status})
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Content
              <textarea
                className="input"
                rows={4}
                value={form.contentText}
                onChange={(e) => setForm({ ...form, contentText: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              File URL
              <input
                className="input"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                {editingId ? 'Update submission' : 'Create submission'}
              </button>
              {editingId ? (
                <button type="button" className="button secondary" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="card">
          <div className="section-row">
            <div>
              <h2>My Submissions</h2>
              <p style={{ color: 'var(--muted)' }}>Track your recent submission history and edit drafts.</p>
            </div>
          </div>
          <ul className="card-list">
            {submissions.map((submission) => (
              <li key={submission.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <p style={{ margin: 0 }}>
                      <strong>ID:</strong> {submission.id}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Assignment:</strong> {submission.assignmentId}
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Status:</strong> <span className="badge">{submission.status}</span>
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Submitted at:</strong> {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)' }}>{submission.contentText}</p>
                  </div>
                  <div className="action-row" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="button secondary small-button" onClick={() => startEdit(submission)}>
                      Edit submission
                    </button>
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
