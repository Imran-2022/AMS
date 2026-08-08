"use client";

import { AccountSettingsPage } from '@/components/account/AccountSettingsPage'
import type { UserDto } from '@/lib/api'

type NotificationItem = {
  title: string
  description: string
  checked: boolean
}

type InfoField = {
  key: string
  label: string
  getValue: (user: UserDto | null) => string
}

type InfoSection = {
  title: string
  fields: InfoField[]
}

export function AdminSettingsPage() {
  const notificationItems: NotificationItem[] = [
    {
      title: 'New user registrations',
      description: 'Notify me when a new teacher, student, or admin account is created.',
      checked: true,
    },
    {
      title: 'System alerts',
      description: 'Receive alerts for system maintenance and authentication issues.',
      checked: true,
    },
    {
      title: 'Security updates',
      description: 'Be notified about critical security changes and policy updates.',
      checked: false,
    },
    {
      title: 'Platform announcements',
      description: 'Get announcements about new features and platform improvements.',
      checked: false,
    },
  ]

  const infoSections: InfoSection[] = [
    {
      title: 'ACCOUNT INFORMATION',
      fields: [
        { key: 'employeeId', label: 'Employee ID', getValue: (user: UserDto | null) => user?.employeeId || '—' },
        { key: 'role', label: 'Role', getValue: (user: UserDto | null) => user?.role || '—' },
        { key: 'qualification', label: 'Position', getValue: (user: UserDto | null) => user?.qualification || '—' },
        { key: 'joiningDate', label: 'Joining date', getValue: (user: UserDto | null) => user?.joiningDate || '—' },
        { key: 'status', label: 'Status', getValue: (user: UserDto | null) => (user ? `${user.isActive ? 'Active' : 'Inactive'}` : '—') },
      ],
    },
    {
      title: 'CONTACT DETAILS',
      fields: [
        { key: 'phone', label: 'Phone', getValue: (user: UserDto | null) => user?.phoneNumber || '—' },
        { key: 'email', label: 'Email', getValue: (user: UserDto | null) => user?.email || '—' },
        { key: 'address', label: 'Address', getValue: (user: UserDto | null) => user?.address || '—' },
      ],
    },
  ]

  return (
    <AccountSettingsPage
      role="Admin"
      breadcrumb="Admin / Account"
      portalLabel="ADMIN PORTAL"
      headerTitle="My Account"
      headerDescription="Manage your profile, notifications, and password settings."
      infoSections={infoSections}
      notificationItems={notificationItems}
    />
  )
}
