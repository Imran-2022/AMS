"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { clearStoredAuth, getStoredUser } from '@/lib/auth';
import { ROLE, RoleType } from '../data';

const NAV = {
  Admin: [
    { href: '/roles/admin/dashboard', label: 'Dashboard' },
    { href: '/roles/admin/users', label: 'Users' },
    { href: '/roles/admin/classes', label: 'Classes & subjects' },
    { href: '/roles/admin/assignments', label: 'Assignments' },
    { href: '/roles/admin/teacher-assignments', label: 'Teacher assignments' },
    { href: '/roles/admin/enrollments', label: 'Enrollments' },
    { href: '/roles/admin/submissions', label: 'Submissions' },
  ],
  Teacher: [
    { href: '/roles/teacher/dashboard', label: 'Dashboard' },
    { href: '/roles/teacher/assignments', label: 'Assignments' },
    { href: '/roles/teacher/submissions', label: 'Submissions' },
  ],
  Student: [
    { href: '/roles/student/dashboard', label: 'Dashboard' },
    { href: '/roles/student/assignments', label: 'Assignments' },
    { href: '/roles/student/submissions', label: 'Submissions' },
  ],
} as const;

function Sidebar({ role, collapsed, onToggle, onLogout, userName }: { role: RoleType; collapsed: boolean; onToggle: () => void; onLogout: () => void; userName?: string }) {
  const pathname = usePathname();

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className={`px-4 py-4 border-l-4 ${role === 'Admin' ? 'border-violet-500' : role === 'Teacher' ? 'border-teal-500' : 'border-sky-500'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <span className={`text-white font-serif ${collapsed ? 'text-2xl' : 'text-lg'}`}>AMS</span>
            {!collapsed && <span className="text-xs text-slate-500">Assignment & submission</span>}
          </div>
          <button type="button" onClick={onToggle} className="h-9 w-9 rounded-lg bg-slate-800/70 text-slate-300 hover:bg-slate-700">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        {!collapsed && userName && (
          <div className="mt-4 rounded-2xl bg-slate-800 p-3 text-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
            <p className="mt-2 text-sm font-semibold">{userName}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV[role].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 min-h-[44px] rounded-xl px-3 text-sm font-medium transition ${active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}>
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 ${active ? 'bg-indigo-500/20 text-white' : 'text-slate-300'}`}>
                {item.label.charAt(0)}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${collapsed ? 'justify-center' : 'justify-start'} text-slate-300 bg-slate-800/50 hover:bg-slate-700`}>
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function Topbar({ breadcrumb }: { breadcrumb: string }) {
  return (
    <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <p className="text-sm text-slate-500">{breadcrumb}</p>
      <button className="text-slate-500 hover:text-slate-700">
        <Bell size={20} />
      </button>
    </div>
  );
}

export function AppShell({ role, breadcrumb, children }: { role: RoleType; breadcrumb: string; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.fullName ?? user?.email ?? undefined);
  }, []);

  function handleLogout() {
    clearStoredAuth();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar role={role} collapsed={isCollapsed} onToggle={() => setIsCollapsed((value) => !value)} onLogout={handleLogout} userName={userName} />
      <div className="flex-1 min-w-0">
        <Topbar breadcrumb={breadcrumb} />
        <main className="p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
