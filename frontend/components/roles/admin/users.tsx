"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppShell } from '../../layout/AppShell';
import { AmsDeleteComfiramtionModal, Button, Card, Metric, PageHeader, Pill, RoleBadge, Th, Td, UserFormModal } from '../../ui';
import { ASSIGNMENTS, USERS as INITIAL_USERS, CLASSES as INITIAL_CLASSES, SUBJECTS as INITIAL_SUBJECTS, SUBMISSIONS } from '../../data';
import { getAdminDashboardStats } from '@/lib/api/dashboard';
import { getAssignments, getSubmissions, getUsers as apiGetUsers, getClassCourses as apiGetClassCourses } from '@/lib/api';
import { MoreVertical, UserPlus, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { createUser, deleteUser, getClassCourses, getUsers, updateUser } from '@/lib/api';
import { createEnrollment, deleteEnrollment, getEnrollments } from '@/lib/api/enrollments';

import type { UserRecord} from './types';

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filter, setFilter] = useState<'All' | 'Admin' | 'Teacher' | 'Student'>('All');
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<UserRecord>({ id: Date.now().toString(), name: '', email: '', role: 'Student', status: 'Active' });

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const apiUsers = await getUsers();
      const mapped = apiUsers.map((u: any) => ({ id: String(u.id), name: u.fullName, email: u.email, role: u.role as UserRecord['role'], status: u.isActive ? 'Active' : 'Inactive' as UserRecord['status'] }));
      setUsers(mapped as UserRecord[]);
    } catch (err) {
      console.error(err);
      setUsers(INITIAL_USERS.map((user) => ({ ...user, id: String(user.id) })) as UserRecord[]);
    }
  }

  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = filter === 'All' || user.role === filter;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
        return matchesRole && matchesSearch;
      }),
    [users, filter, search]
  );

  function openNewUser() {
    setEditingUser(null);
    setFormData({ id: Date.now().toString(), name: '', email: '', role: 'Student', status: 'Active' });
    setIsFormOpen(true);
  }

  function openEditUser(user: UserRecord) {
    setEditingUser(user);
    setFormData(user);
    setIsFormOpen(true);
  }

  async function handleSaveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          fullName: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.status === 'Active'
        });
        await loadUsers();
      } else {
        const created = await createUser({
          fullName: formData.name,
          email: formData.email,
          password: 'ChangeMe123!',
          role: formData.role,
          isActive: formData.status === 'Active',
          parentMobile: ''
        });
        await loadUsers();
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('Unable to save user.');
    }
  }

  async function handleDeleteUser(id: string) {
    try {
      await deleteUser(id);
      await loadUsers();
      if (editingUser?.id === id) {
        setIsFormOpen(false);
        setEditingUser(null);
      }
    } catch (err) {
      console.error(err);
      alert('Unable to delete user.');
    }
  }

  function confirmDeleteUser(user: UserRecord) {
    setPendingDeleteUser(user);
  }

  return (
    <AppShell role="Admin" breadcrumb="Admin / Users">
      <PageHeader eyebrow="Administration" title="Users" action={<Button onClick={openNewUser}>Add user</Button>} />

      <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 bg-slate-100 rounded-full p-1">
            {['All', 'Admin', 'Teacher', 'Student'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option as typeof filter)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === option ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                {option}
              </button>
            ))}
          </div>
          <div className="grow max-w-md">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <Card className="mb-6">
          <form onSubmit={handleSaveUser} className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Full name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                placeholder="email@example.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
              <select
                value={formData.role}
                onChange={(event) => setFormData({ ...formData, role: event.target.value as UserRecord['role'] })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Admin</option>
                <option>Teacher</option>
                <option>Student</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value as UserRecord['status'] })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingUser ? 'Save changes' : 'Create user'}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <Td className="font-medium text-slate-900">{user.name}</Td>
                  <Td className="font-mono text-slate-500">{user.email}</Td>
                  <Td><RoleBadge role={user.role as any} /></Td>
                  <Td>
                    <Pill className={user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                      {user.status}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditUser(user)}
                        className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 transition hover:border-indigo-300 hover:text-slate-900">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteUser(user)}
                        className="rounded-full border border-rose-200 bg-white px-3 py-1 text-sm text-rose-600 transition hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AmsDeleteComfiramtionModal
        open={Boolean(pendingDeleteUser)}
        onClose={() => setPendingDeleteUser(null)}
        title="Delete user?"
        description={pendingDeleteUser ? `${pendingDeleteUser.name} will be removed. This action cannot be undone.` : undefined}
        onConfirm={() => pendingDeleteUser && void handleDeleteUser(pendingDeleteUser.id)}
        confirmVariant="danger"
      >
      </AmsDeleteComfiramtionModal>
    </AppShell>
  );
}
