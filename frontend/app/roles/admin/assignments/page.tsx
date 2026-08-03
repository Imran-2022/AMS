"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import {
  AssignmentDto,
  createAssignment,
  deleteAssignment,
  getAssignments,
  publishAssignment,
  updateAssignment
} from '@/lib/api';

const emptyForm = {
  title: '',
  description: '',
  classCourseId: '',
  subjectId: '',
  deadline: '',
  maxMarks: '100',
  allowLateSubmission: true,
  allowResubmission: false
};

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[]>([]);
  const [error, setError] = useState<string>('');
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadAssignments = async () => {
    try {
      const data = await getAssignments();
      setAssignments(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load assignments.');
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const parseDeadline = (value: string) => (value ? new Date(value).toISOString() : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        classCourseId: form.classCourseId,
        subjectId: form.subjectId,
        deadline: parseDeadline(form.deadline),
        maxMarks: Number(form.maxMarks),
        allowLateSubmission: form.allowLateSubmission,
        allowResubmission: form.allowResubmission
      };

      if (editingId) {
        await updateAssignment(editingId, payload);
      } else {
        await createAssignment(payload);
      }

      await loadAssignments();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Unable to save assignment.');
    }
  };

  const handleEdit = (assignment: AssignmentDto) => {
    setForm({
      title: assignment.title,
      description: assignment.description,
      classCourseId: assignment.classCourseId,
      subjectId: assignment.subjectId,
      deadline: assignment.deadline.slice(0, 16),
      maxMarks: String(assignment.maxMarks),
      allowLateSubmission: assignment.allowLateSubmission,
      allowResubmission: assignment.allowResubmission
    });
    setEditingId(assignment.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || 'Unable to delete assignment.');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishAssignment(id);
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || 'Unable to publish assignment.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <RoleDashboardShell title="Admin Assignments" role="Admin">
        {error ? <div className="alert-error">{error}</div> : null}

        <section className="card" style={{ marginBottom: 24 }}>
          <div className="section-row">
            <div>
              <h2>{editingId ? 'Edit Assignment' : 'Create Assignment'}</h2>
              <p style={{ color: 'var(--muted)' }}>
                Build or update assignments for your courses with deadlines and grading rules.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="form-row">
            <label className="field-label">
              Title
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Description
              <textarea
                className="input"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Class/course ID
              <input
                className="input"
                value={form.classCourseId}
                onChange={(e) => setForm({ ...form, classCourseId: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Subject ID
              <input
                className="input"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Deadline
              <input
                className="input"
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Max marks
              <input
                className="input"
                type="number"
                value={form.maxMarks}
                min={1}
                onChange={(e) => setForm({ ...form, maxMarks: e.target.value })}
                required
              />
            </label>
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                checked={form.allowLateSubmission}
                onChange={(e) => setForm({ ...form, allowLateSubmission: e.target.checked })}
              />
              Allow late submission
            </label>
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                checked={form.allowResubmission}
                onChange={(e) => setForm({ ...form, allowResubmission: e.target.checked })}
              />
              Allow resubmission
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                {editingId ? 'Update assignment' : 'Create assignment'}
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
              <h2>Assignments</h2>
              <p style={{ color: 'var(--muted)' }}>All assignments in the system, with quick actions.</p>
            </div>
          </div>
          <ul className="card-list">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="card" style={{ padding: 20 }}>
                <div className="section-row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3>{assignment.title}</h3>
                    <p style={{ color: 'var(--muted)', margin: '10px 0' }}>{assignment.description}</p>
                    <p style={{ margin: 0 }}>
                      <span className="badge">{assignment.status}</span>{' '}
                      <span style={{ marginLeft: 10 }}>Deadline: {new Date(assignment.deadline).toLocaleString()}</span>
                    </p>
                    <p style={{ margin: '10px 0 0' }}>Max marks: {assignment.maxMarks}</p>
                  </div>
                  <div className="action-row" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="button secondary small-button" onClick={() => handleEdit(assignment)}>
                      Edit
                    </button>
                    <button type="button" className="button danger small-button" onClick={() => handleDelete(assignment.id)}>
                      Delete
                    </button>
                    <button type="button" className="button small-button" onClick={() => handlePublish(assignment.id)}>
                      Publish
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
