"use client";

import { useContext, useEffect, useState, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ClipboardList,
  BookOpen,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  GraduationCap,
  Files,
  Users,
} from 'lucide-react';
import { clearStoredAuth, getStoredUser } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { ToastContainer } from '../ui';
import { ROLE } from '@/shared/constants/roles';
import type { RoleType } from '@/shared/constants/roles';

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const AppShellContext = createContext(false);
const AppShellProvider = AppShellContext.Provider;

function getBreadcrumb(pathname: string, role: RoleType | undefined) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'roles' || !segments[1]) {
    return 'Dashboard';
  }

  const currentRole = segments[1];
  const page = segments[2] ?? 'dashboard';
  const roleTitle = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  const roleMap: Record<string, Record<string, string>> = {
    admin: {
      dashboard: 'Dashboard',
      students: 'Students',
      teachers: 'Teachers',
      administrators: 'Administrators',
      classes: 'Classes & subjects',
      assignments: 'Assignments',
      submissions: 'Submissions',
      settings: 'Settings',
      'ams-settings': 'AMS Settings',
      enrollments: 'Enrollments',
      'teacher-assignments': 'Teacher assignments',
      users: 'Users',
    },
    teacher: {
      dashboard: 'Dashboard',
      classes: 'My Classes',
      assignments: 'My Assignments',
      submissions: 'Submissions',
      settings: 'Account',
    },
    student: {
      dashboard: 'Dashboard',
      assignments: 'Assignments',
      submissions: 'Submissions',
      settings: 'Account',
    },
  };

  let label = roleMap[currentRole]?.[page] ?? page.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
  if (currentRole === 'teacher' && page === 'assignments' && segments[3]) {
    label = 'Assignment';
  }

  return `${roleTitle} / ${label}`;
}

const NAV: Record<RoleType, NavItem[]> = {
  Admin: [
    { href: '/roles/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/roles/admin/students', label: 'Students', Icon: UserPlus },
    { href: '/roles/admin/teachers', label: 'Teachers', Icon: UserCheck },
    // { href: '/roles/admin/administrators', label: 'Administrators', Icon: ShieldCheck },
    { href: '/roles/admin/classes', label: 'Classes & Subjects', Icon: BookOpen },
    { href: '/roles/admin/teacher-assignments', label: 'Teacher assignments', Icon: Users },
    { href: '/roles/admin/assignments', label: 'Assignments', Icon: ClipboardList },
    { href: '/roles/admin/submissions', label: 'Submissions', Icon: Inbox },
    // { href: '/roles/admin/ams-settings', label: 'AMS Settings', Icon: Settings },
  ],
  Teacher: [
    { href: '/roles/teacher/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/roles/teacher/classes', label: 'My Classes', Icon: GraduationCap },
    { href: '/roles/teacher/assignments', label: 'Assignments', Icon: ClipboardList },
    { href: '/roles/teacher/submissions', label: 'Submissions', Icon: Inbox },
    { href: '/roles/teacher/students', label: 'Students', Icon: Users },
  ],
  Student: [
    { href: '/roles/student/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/roles/student/assignments', label: 'Assignments', Icon: ClipboardList },
    { href: '/roles/student/submissions', label: 'Submissions', Icon: Inbox },
  ],
};

function Sidebar({ role, collapsed, mobileOpen, onToggle, onNavigate, onLogout, userName, avatarUrl }: { role: RoleType; collapsed: boolean; mobileOpen: boolean; onToggle: () => void; onNavigate: () => void; onLogout: () => void; userName?: string; avatarUrl?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const settingsHref = role === 'Admin' ? '/roles/admin/settings' : role === 'Teacher' ? '/roles/teacher/settings' : '/roles/student/settings';
  const settingsLabel = 'Account Settings';

  const widthClass = mobileOpen ? 'w-64' : collapsed ? 'w-[76px]' : 'w-64';
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-[#ECECEF] bg-white text-[#1F2430] transition-all duration-300 ease-in-out ${widthClass} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="border-[#ECECEF]">
        <div className={`flex items-center gap-3 px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
          <button
            type="button"
            onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#1F2430] hover:bg-[#F5F5F7] shrink-0 cursor-pointer"
            aria-label="Toggle sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <div className={`label min-w-0 transition-all duration-200 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-full'}`}>
            <p className="font-semibold text-sm leading-tight truncate">AMS School</p>
            <p className="text-[11px] text-[#8A8F98] leading-tight truncate">Education management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-hidden py-4 px-3 space-y-1">
        {NAV[role].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
              className={`group nav-item relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-[14px] transition-colors ${collapsed ? 'justify-center' : ''} ${active ? 'bg-[#F3EEFF] text-[#7C3AED]' : 'text-[#1F2430]/80 hover:bg-[#F5F5F7]'}`}>
              <item.Icon className="shrink-0 h-5 w-5" />
              {!collapsed ? (
                <span className="whitespace-nowrap transition-all duration-200 opacity-100">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#ECECEF] p-3">
          <div className="relative group">
          <button type="button" onClick={() => router.push(settingsHref)} className="w-full nav-item relative flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#F5F5F7] text-left cursor-pointer">
            <div className={`w-9 h-9 rounded-full ${role === 'Teacher' || role === 'Student' ? 'bg-brand-600' : 'bg-[#1F2430]'} text-white flex items-center justify-center shrink-0 overflow-hidden`}> 
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
            </div>
            {!collapsed ? (
              <div className="profile-text label min-w-0 transition-all duration-200 opacity-100">
                <p className="text-[13px] font-semibold leading-tight truncate">{userName ?? `${role} User`}</p>
                <p className="text-[11px] text-[#8A8F98] leading-tight truncate">
                  {role === 'Teacher' ? 'Teacher Account' : role === 'Student' ? 'Student Account' : 'Admin Account'}
                </p>
              </div>
            ) : null}
          </button>

          <div className="absolute left-0 bottom-full hidden min-w-full pb-2 group-hover:block">
            <div className="rounded-xl border border-[#ECECEF] bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={() => router.push(settingsHref)}
                className="group nav-item relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-[14px] text-[#1F2430]/80 transition-colors hover:bg-[#F5F5F7] cursor-pointer">
                <Settings className="shrink-0 h-5 w-5" />
                {!collapsed ? <span>{settingsLabel}</span> : null}
              </button>

              <button
                type="button"
                onClick={() => onLogout()}
                className="group nav-item relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-[14px] text-[#1F2430]/80 transition-colors hover:bg-[#F5F5F7] cursor-pointer">
                <LogOut className="shrink-0 h-5 w-5" />
                {!collapsed ? <span>Sign out</span> : null}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ breadcrumb }: { breadcrumb: string }) {
  return (
    <header className="sticky top-0 z-10 border-[#ECECEF] bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <p className="text-sm font-semibold leading-tight">{breadcrumb}</p>
          <p className="text-[12px] text-[#8A8F98] leading-tight">Manage assignments, users and classes.</p>
        </div>
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F5F7]" aria-label="Notifications">
          <Bell className="h-5 w-5 text-[#1F2430]" />
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#7C3AED] px-1.5 text-[9px] font-semibold text-white">3</span>
        </button>
      </div>
    </header>
  );
}

export function AppShell({ role, breadcrumb, children }: { role: RoleType; breadcrumb?: string; children: React.ReactNode }) {
  const isNested = useContext(AppShellContext);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const router = useRouter();

  if (isNested) {
    return <>{children}</>;
  }

  useEffect(() => {
    const stored = window.localStorage.getItem('ams-sidebar-collapsed');
    const isSmall = window.innerWidth < 1024;
    setIsMobile(isSmall);
    setIsCollapsed(stored === 'true' || (!stored && isSmall));
    const user = getStoredUser();
    const base = API_BASE_URL;
    const avatar = user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${base}${user.avatarUrl}`) : undefined;
    setUserName(user?.fullName ?? user?.email ?? undefined);
    setAvatarUrl(avatar);

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
    const handleUserChanged = () => {
      const user = getStoredUser();
      const base = API_BASE_URL;
      const avatar = user?.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${base}${user.avatarUrl}`) : undefined;
      setUserName(user?.fullName ?? user?.email ?? undefined);
      setAvatarUrl(avatar);
    };

    window.addEventListener('ams-user-changed', handleUserChanged);
    return () => window.removeEventListener('ams-user-changed', handleUserChanged);
  }, []);

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

  const computedBreadcrumb = breadcrumb ?? getBreadcrumb(usePathname(), role);

  return (
    <AppShellProvider value={true}>
      <div className="flex h-screen overflow-hidden bg-[#F7F7F9] text-[#1F2430]">
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
        )}
        <Sidebar
          role={role}
          collapsed={isCollapsed}
          mobileOpen={mobileOpen}
          onToggle={() => {
            if (isMobile) {
              setMobileOpen((value) => !value);
            } else {
              setIsCollapsed((value) => !value);
            }
          }}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
          userName={userName}
          avatarUrl={avatarUrl}
        />
        <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'lg:ml-[76px]' : 'lg:ml-64'}`}>
          <Topbar breadcrumb={computedBreadcrumb} />
          <main className="layout-main flex-1 min-h-0 w-full overflow-y-auto">
            <div className="px-6 py-6">{children}</div>
          </main>
          <ToastContainer />
        </div>
      </div>
    </AppShellProvider>
  );
}
