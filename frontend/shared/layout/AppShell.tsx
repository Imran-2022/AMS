"use client";

import { useContext, useEffect, useRef, useState, createContext } from 'react';
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
import { clearStoredAuth, getStoredAvatarUrl, getStoredUser, withAvatarCacheBust } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/api';
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead } from '@/lib/api/notifications';
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
      'teacher-assignments': 'Teacher Allocation',
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
    { href: '/roles/admin/teacher-assignments', label: 'Teacher Allocation', Icon: Users },
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
          <button type="button" className="w-full nav-item relative flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#F5F5F7] text-left cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0 overflow-hidden">
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

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

function formatRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function Topbar({ breadcrumb, role, onMobileMenuToggle }: { breadcrumb: string; role: RoleType; onMobileMenuToggle: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await getNotifications(1, 10);
        setNotifications((data ?? []) as NotificationRow[]);
      } catch {
        setNotifications([]);
      }
    };

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(Number(count ?? 0));
      } catch {
        setUnreadCount(0);
      }
    };

    void loadNotifications();
    void loadUnreadCount();

    const interval = window.setInterval(() => {
      void loadUnreadCount();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, []);

  async function handleNotificationClick(notification: NotificationRow) {
    if (!notification.isRead) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // ignore and still navigate
      }
    }

    setDropdownOpen(false);

    const entityType = notification.relatedEntityType;
    const entityId = notification.relatedEntityId;
    const targetRole = role.toLowerCase();

    if (entityType === 'Assignment' && entityId) {
      router.push(`/roles/${targetRole}/assignments/${entityId}`);
      return;
    }

    if (entityType === 'Submission' && entityId) {
      router.push(`/roles/${targetRole}/submissions/${entityId}`);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore to keep UI resilient
    }
  }

  return (
    <header className="sticky top-0 z-10 border-[#ECECEF] bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Mobile hamburger menu button */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#F5F5F7] cursor-pointer"
          aria-label="Toggle navigation menu">
          <Menu className="h-5 w-5 text-[#1F2430]" />
        </button>

        <div className="flex-1 lg:flex-none">
          <p className="text-sm font-semibold leading-tight">{breadcrumb}</p>
          <p className="text-[12px] text-[#8A8F98] leading-tight">Manage assignments, users and classes.</p>
        </div>
        <div ref={rootRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#F5F5F7] cursor-pointer"
            aria-label="Notifications"
            aria-expanded={dropdownOpen}>
            <Bell className="h-5 w-5 text-[#1F2430]" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#7C3AED] px-1.5 text-[9px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </button>

          {dropdownOpen ? (
            <div className="absolute right-0 top-12 w-[360px] overflow-hidden rounded-xl border border-[#ECECEF] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-[#ECECEF] px-4 py-3">
                <p className="text-sm font-semibold text-[#1F2430]">Notifications</p>
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="cursor-pointer text-[11px] font-medium text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[#8A8F98]">No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={`flex w-full cursor-pointer items-start gap-3 border-b border-[#F3F4F6] px-4 py-3 text-left transition-colors hover:bg-[#F7F7F9] ${notification.isRead ? 'bg-white' : 'bg-[#F5F3FF]'}`}>
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.isRead ? 'bg-transparent' : 'bg-[#7C3AED]'}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${notification.isRead ? 'text-[#1F2430]' : 'text-[#1F2430]'}`}>
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs text-[#8A8F98]">{notification.message}</p>
                        <p className="mt-2 text-[11px] text-[#8A8F98]">{formatRelativeTime(notification.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
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
    setUserName(user?.fullName ?? user?.email ?? undefined);
    
    // Use avatar from user object, not separate localStorage key
    if (user?.avatarUrl) {
      const base = API_BASE_URL;
      const avatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : `${base}${user.avatarUrl}`;
      setAvatarUrl(withAvatarCacheBust(avatar));
    }

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
    const handleAvatarUpdate = () => {
      // Reload user data to get the updated avatar
      const user = getStoredUser();
      if (user?.avatarUrl) {
        const base = API_BASE_URL;
        const avatar = user.avatarUrl.startsWith('http') ? user.avatarUrl : `${base}${user.avatarUrl}`;
        setAvatarUrl(withAvatarCacheBust(avatar));
      }
    };

    window.addEventListener('ams-avatar-updated', handleAvatarUpdate);

    return () => {
      window.removeEventListener('ams-avatar-updated', handleAvatarUpdate);
    };
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
          <Topbar 
            breadcrumb={computedBreadcrumb} 
            role={role}
            onMobileMenuToggle={() => {
              if (isMobile) {
                setMobileOpen((value) => !value);
              }
            }}
          />
          <main className="layout-main flex-1 min-h-0 w-full overflow-y-auto">
            <div className="px-6 py-6">{children}</div>
          </main>
          <ToastContainer />
        </div>
      </div>
    </AppShellProvider>
  );
}
