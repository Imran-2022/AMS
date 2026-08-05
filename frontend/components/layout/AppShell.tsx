"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  BookOpen,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sun,
  User,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { clearStoredAuth, getStoredUser } from '@/lib/auth';
import { ROLE, RoleType } from '../data';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV: Record<RoleType, NavItem[]> = {
  Admin: [
    { href: '/roles/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/roles/admin/students', label: 'Students', Icon: UserPlus },
    { href: '/roles/admin/teachers', label: 'Teachers', Icon: UserCheck },
    { href: '/roles/admin/administrators', label: 'Administrators', Icon: ShieldCheck },
    { href: '/roles/admin/classes', label: 'Classes & Subjects', Icon: BookOpen },
    { href: '/roles/admin/assignments', label: 'Assignments', Icon: ClipboardList },
    { href: '/roles/admin/submissions', label: 'Submissions', Icon: Inbox },
    { href: '/roles/admin/settings', label: 'Settings', Icon: Settings },
  ],
  Teacher: [
    { href: '/roles/teacher/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/roles/teacher/assignments', label: 'Assignments', Icon: ClipboardList },
    { href: '/roles/teacher/submissions', label: 'Submissions', Icon: Inbox },
  ],
  Student: [
    { href: '/roles/student/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/roles/student/assignments', label: 'Assignments', Icon: ClipboardList },
    { href: '/roles/student/submissions', label: 'Submissions', Icon: Inbox },
  ],
};

function Sidebar({ role, collapsed, mobileOpen, onNavigate, onLogout, userName }: { role: RoleType; collapsed: boolean; mobileOpen: boolean; onNavigate: () => void; onLogout: () => void; userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileItems = [
    { label: 'My Profile', key: 'profile' },
    { label: 'Account Settings', key: 'settings' },
  ];
  const [profileHover, setProfileHover] = useState(false);
  const isProfileOpen = profileHover;

  const widthClass = mobileOpen ? 'w-[258px]' : collapsed ? 'w-[88px]' : 'w-[258px]';
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-slate-900/90 bg-slate-950 text-slate-100 shadow-2xl transition-all duration-300 ease-in-out ${widthClass} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}>
      <div className={`border-l-4 ${role === 'Admin' ? 'border-violet-500' : role === 'Teacher' ? 'border-teal-500' : 'border-sky-500'}`}>
        <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-800 text-white shadow-lg ring-1 ring-slate-700">
            <Menu className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-white">AMS School</p>
              <p className="text-xs text-slate-400">Education management</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {NAV[role].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-medium transition duration-200 ${collapsed ? 'justify-center px-2' : ''} ${active ? 'bg-violet-500/15 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-900/70 hover:text-white'}`}>
              <item.Icon className={`h-5 w-5 ${active ? 'text-violet-300' : 'text-slate-400'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 px-4 py-4">
        <div
          className={`flex items-center gap-3 rounded-3xl border border-slate-800/80 bg-slate-900/90 p-3 transition ${collapsed ? 'justify-center' : 'justify-between'}`}
          onMouseEnter={() => setProfileHover(true)}
          onMouseLeave={() => setProfileHover(false)}>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-3xl bg-slate-800 text-slate-200">
            <User className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-white">{userName ?? 'System Admin'}</p>
              <p className="truncate text-xs text-slate-500">Admin Account</p>
            </div>
          )}
        </div>

        {isProfileOpen && !collapsed && (
          <div className="mt-3 rounded-3xl border border-slate-800/80 bg-slate-950 p-3 shadow-2xl">
            {profileItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  if (item.key === 'settings') {
                    router.push('/roles/admin/settings');
                  }
                }}>
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            ))}
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full rounded-2xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar({ breadcrumb, collapsed, onToggle }: { breadcrumb: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/95 text-slate-100 shadow-none">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>

          <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-900/80 px-3 py-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-700 text-white">
              <ChevronLeft className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">{breadcrumb}</p>
              <p className="text-xs text-slate-500">Manage assignments, users and classes.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-slate-300 shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">3</span>
          </button>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-3.5 text-sm font-medium text-slate-100 shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
            aria-label="User profile">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-white">SA</div>
            <span className="hidden sm:inline">System Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ role, breadcrumb, children }: { role: RoleType; breadcrumb: string; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const stored = window.localStorage.getItem('ams-sidebar-collapsed');
    const isSmall = window.innerWidth < 1024;
    setIsMobile(isSmall);
    setIsCollapsed(stored === 'true' || (!stored && isSmall));
    const user = getStoredUser();
    setUserName(user?.fullName ?? user?.email ?? undefined);

    const handleResize = () => {
      const small = window.innerWidth < 1024;
      setIsMobile(small);
      if (!stored) {
        setIsCollapsed(small);
      }
      if (!small) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('ams-sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    // Mirror legacy layout CSS which relies on `body.sidebar-collapsed`
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }

    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed]);

  function handleLogout() {
    clearStoredAuth();
    router.push('/login');
  }

  return (
    <div className="relative flex min-h-screen bg-slate-50 text-slate-900">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <Sidebar
        role={role}
        collapsed={isCollapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onLogout={handleLogout}
        userName={userName}
      />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-[88px]' : 'lg:ml-[258px]'}`}>
        <Topbar
          breadcrumb={breadcrumb}
          collapsed={isCollapsed}
          onToggle={() => {
            if (isMobile) {
              setMobileOpen((value) => !value);
            } else {
              setIsCollapsed((value) => !value);
            }
          }}
        />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
