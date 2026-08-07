"use client";

import { useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { USERS as INITIAL_USERS } from '../../data';

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending';
  statusTone: 'emerald' | 'amber';
  lastActive: string;
  isCurrent?: boolean;
  isPending?: boolean;
};

const adminRows: AdminRow[] = [
  {
    id: 'me',
    name: 'Nusrat Jahan',
    email: 'admin@ams.edu',
    role: 'Super Admin',
    status: 'Active',
    statusTone: 'emerald',
    lastActive: 'Just now',
    isCurrent: true,
  },
  {
    id: 'rakib',
    name: 'Rakib Hossain',
    email: 'rakib.h@ams.edu',
    role: 'Admin',
    status: 'Active',
    statusTone: 'emerald',
    lastActive: '2 days ago',
  },
  {
    id: 'pending',
    name: 'Invitation pending',
    email: 'tania.k@ams.edu',
    role: 'Moderator',
    status: 'Pending',
    statusTone: 'amber',
    lastActive: 'Invited 3 days ago',
    isPending: true,
  },
];

export function AdminAdministratorsPage() {
  const [selectedTab, setSelectedTab] = useState<'All' | 'Active' | 'Pending'>('All');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');

  const activeCount = adminRows.filter((row) => row.status === 'Active').length;
  const pendingCount = adminRows.filter((row) => row.status === 'Pending').length;
  const totalCount = adminRows.length;

  function openDelete(name: string) {
    setDeleteTarget(name);
    setDeleteOpen(true);
  }

  const filteredRows = adminRows.filter((row) => {
    if (selectedTab === 'Active' && row.status !== 'Active') return false;
    if (selectedTab === 'Pending' && row.status !== 'Pending') return false;
    if (roleFilter !== 'All roles' && row.role !== roleFilter) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query);
  });

  return (
    <AppShell role="Admin" breadcrumb="Admin / Administrators">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Administrators</h1>
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Invite admin
          </button>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-3.5 flex items-center gap-3">
          <svg className="h-5 w-5 text-brand-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
          <p className="text-xs text-brand-700">
            Administrator accounts have full system access. New admins are added by <span className="font-semibold">email invite</span> — they set their own password when they accept.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">ADMIN USERS</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{totalCount}</p>
            <p className="text-xs text-slate-400 mt-1">Total accounts with access</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">ACTIVE</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{activeCount}</p>
            <p className="text-xs text-slate-400 mt-1">Signed in within 30 days</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">PENDING INVITES</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">Awaiting acceptance</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['All', 'Active', 'Pending'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${selectedTab === tab ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {tab} <span className="opacity-70 font-normal">{tab === 'All' ? totalCount : tab === 'Active' ? activeCount : pendingCount}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600"
            >
              <option>All roles</option>
              <option>Super Admin</option>
              <option>Admin</option>
              <option>Moderator</option>
            </select>
            <div className="relative max-w-xs">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search administrators…"
                className="w-56 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-500"
              />
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">NAME</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">EMAIL</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">ROLE</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">LAST ACTIVE</th>
                <th className="w-40 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${row.isPending ? 'bg-slate-100 text-slate-400' : row.id === 'me' ? 'bg-brand-600 text-white' : 'bg-sky-100 text-sky-700'} text-xs font-bold shrink-0`}>
                        {row.isPending ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                          </svg>
                        ) : (
                          row.name
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-700">{row.name}</span>
                          {row.isCurrent ? (
                            <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">YOU</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-slate-500">{row.email}</td>
                  <td className="px-2 py-3.5">
                    <span className="inline-flex items-center gap-2 rounded-[8px] bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {row.role}
                    </span>
                  </td>
                  <td className="px-2 py-3.5">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${row.statusTone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${row.statusTone === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-2 py-3.5 text-slate-500">{row.lastActive}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">Edit</button>
                      {row.isCurrent ? (
                        <button disabled title="You can't remove your own access" className="px-3 py-1.5 rounded-lg border border-slate-100 text-slate-300 text-xs font-semibold cursor-not-allowed">Delete</button>
                      ) : row.isPending ? (
                        <>
                          <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">Resend</button>
                          <button onClick={() => openDelete(row.email)} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">Revoke</button>
                        </>
                      ) : (
                        <button onClick={() => openDelete(row.name)} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold text-slate-400 mb-3">ROLE PERMISSIONS</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <span className="inline-flex items-center rounded-[8px] bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">Super Admin</span>
              <p className="text-xs text-slate-500">Full access, including managing other admins and billing.</p>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex items-center rounded-[8px] bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Admin</span>
              <p className="text-xs text-slate-500">Manages students, teachers, and classes. Can't manage admins.</p>
            </div>
            <div className="flex gap-3">
              <span className="inline-flex items-center rounded-[8px] bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Moderator</span>
              <p className="text-xs text-slate-500">Read-only access plus assignment and submission review.</p>
            </div>
          </div>
        </div>

        {inviteOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-100 px-7 pt-6 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">Invite administrator</h2>
                  <p className="text-sm text-slate-400 mt-1">They'll get an email to accept and set their own password.</p>
                </div>
                <button type="button" onClick={() => setInviteOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-5 px-7 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full name <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="Administrator name" className="w-full rounded-[12px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email <span className="text-rose-500">*</span></label>
                  <input type="email" placeholder="email@example.com" className="w-full rounded-[12px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Role <span className="text-rose-500">*</span></label>
                  <select className="w-full rounded-[12px] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
                    <option>Admin — manage students, teachers & classes</option>
                    <option>Super Admin — full system access</option>
                    <option>Moderator — read-only + review submissions</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 rounded-b-[28px] border-t border-slate-100 bg-slate-50/60 px-7 py-5">
                <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="button" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Send invite</button>
              </div>
            </div>
          </div>
        ) : null}

        {deleteOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-7 text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">Remove admin access?</h3>
              <p className="mt-1.5 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{deleteTarget}</span> will immediately lose access to the admin dashboard. This can't be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setDeleteOpen(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={() => setDeleteOpen(false)} className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Remove access</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
