"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleDashboardShell from '@/components/RoleDashboardShell';
import { createUser, deleteUser, getUsers, updateUser, UserDto } from '@/lib/api';

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'Student',
  isActive: true
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [error, setError] = useState<string>('');
  const [form, setForm] = useState({ ...emptyForm });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load users.');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingUserId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await updateUser(editingUserId, {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          ...(form.password ? { password: form.password } : {})
        });
      } else {
        await createUser({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
          isActive: form.isActive
        });
      }

      await loadUsers();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Unable to save user.');
    }
  };

  const handleEdit = (user: UserDto) => {
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setEditingUserId(user.id);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteUser(userId);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Unable to delete user.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Admin']}>
      <RoleDashboardShell title="Admin Users" role="Admin">
        {error ? <div className="alert-error">{error}</div> : null}

        <section className="card" style={{ marginBottom: 24, maxWidth: 780 }}>
          <div className="section-row">
            <div>
              <h2>{editingUserId ? 'Edit User' : 'Add User'}</h2>
              <p style={{ color: 'var(--muted)' }}>
                Create or update user accounts for the system.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="form-row">
            <label className="field-label">
              Full name
              <input
                className="input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Email
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Password{editingUserId ? ' (leave blank to keep)' : ''}
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingUserId}
              />
            </label>
            <label className="field-label">
              Role
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Student">Student</option>
              </select>
            </label>
            <label className="field-label" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                {editingUserId ? 'Update User' : 'Create User'}
              </button>
              {editingUserId ? (
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
              <h2>Users</h2>
              <p style={{ color: 'var(--muted)' }}>Review existing accounts and take action.</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.isActive ? 'Yes' : 'No'}</td>
                    <td className="action-row">
                      <button type="button" className="button secondary small-button" onClick={() => handleEdit(user)}>
                        Edit
                      </button>
                      <button type="button" className="button danger small-button" onClick={() => handleDelete(user.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </RoleDashboardShell>
    </ProtectedRoute>
  );
}
