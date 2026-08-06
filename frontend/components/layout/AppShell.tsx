"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ClipboardList,
  BookOpen,
  Inbox,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
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

function Sidebar({ role, collapsed, mobileOpen, onToggle, onNavigate, onLogout, userName }: { role: RoleType; collapsed: boolean; mobileOpen: boolean; onToggle: () => void; onNavigate: () => void; onLogout: () => void; userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const profileItems = [
    { label: 'My Profile', key: 'profile' },
    { label: 'Account Settings', key: 'settings' },
  ];
  const [profileHover, setProfileHover] = useState(false);
  const isProfileOpen = profileHover;

  const widthClass = mobileOpen ? 'w-64' : collapsed ? 'w-[76px]' : 'w-64';
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-[#ECECEF] bg-white text-[#1F2430] transition-all duration-300 ease-in-out ${widthClass} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="border-[#ECECEF]">
        <div className={`flex items-center gap-3 px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
          <button
            type="button"
            onClick={onToggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#1F2430] hover:bg-[#F5F5F7] shrink-0"
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
        <div className="nav-item relative flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F5F5F7] cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-[#1F2430] text-white flex items-center justify-center shrink-0">
            <User className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="profile-text label min-w-0 transition-all duration-200 opacity-100">
              <p className="text-[13px] font-semibold leading-tight truncate">{userName ?? 'System Admin'}</p>
              <p className="text-[11px] text-[#8A8F98] leading-tight truncate">Admin Account</p>
            </div>
          ) : null}
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
      />
      <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'lg:ml-[76px]' : 'lg:ml-64'}`}>
        <Topbar breadcrumb={breadcrumb} />
        <main className="layout-main flex-1 min-h-0 w-full overflow-y-auto">
          <div className="px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
