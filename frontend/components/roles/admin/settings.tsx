"use client";

import { AccountSettingsPage } from '@/components/account/AccountSettingsPage'
import type { UserDto } from '@/lib/api'
import { getNotificationDefinitionsForRole } from '@/shared/constants/notifications'

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
  const notificationItems = getNotificationDefinitionsForRole('Admin')

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
    <>
      <AccountSettingsPage
        role="Admin"
        breadcrumb="Admin / Account"
        portalLabel="ADMIN PORTAL"
        headerTitle="My Account"
        headerDescription="Manage your profile, notifications, and password settings."
        infoSections={infoSections}
        notificationItems={notificationItems}
      />
    </>
  )
}
