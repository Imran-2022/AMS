"use client"

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

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function Page() {
  const notificationItems = getNotificationDefinitionsForRole('Teacher')

  const infoSections: InfoSection[] = [
    {
      title: 'ACCOUNT INFORMATION',
      fields: [
        { key: 'phone', label: 'Phone', getValue: (user: UserDto | null) => user?.phoneNumber || '—' },
        { key: 'subject', label: 'Subject', getValue: (user: UserDto | null) => user?.subjectSpecialization || '—' },
        { key: 'qualification', label: 'Qualification', getValue: (user: UserDto | null) => user?.qualification || '—' },
        { key: 'joiningDate', label: 'Joining date', getValue: (user: UserDto | null) => formatDate(user?.joiningDate) },
        { key: 'status', label: 'Status', getValue: (user: UserDto | null) => (user ? `${user.isActive ? 'Active' : 'Inactive'}` : '—') },
      ],
    },
  ]

  return (
    <AccountSettingsPage
      role="Teacher"
      breadcrumb="Teacher / Account"
      portalLabel="TEACHER PORTAL"
      headerTitle="My Account"
      headerDescription="Manage your profile, notifications, and password settings."
      infoSections={infoSections}
      notificationItems={notificationItems}
    />
  )
}
