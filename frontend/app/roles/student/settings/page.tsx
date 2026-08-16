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

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

export default function Page() {
  const notificationItems = getNotificationDefinitionsForRole('Student')

  const infoSections: InfoSection[] = [
    {
      title: 'ACCOUNT INFORMATION',
      fields: [
        { key: 'studentId', label: 'Student ID', getValue: (user: UserDto | null) => user?.studentId || '—' },
        { key: 'gender', label: 'Gender', getValue: (user: UserDto | null) => user?.gender || '—' },
        { key: 'dateOfBirth', label: 'Date of birth', getValue: (user: UserDto | null) => formatDate(user?.dateOfBirth) },
        { key: 'admissionDate', label: 'Admission date', getValue: (user: UserDto | null) => formatDate(user?.admissionDate) },
        { key: 'status', label: 'Status', getValue: (user: UserDto | null) => user ? `${user.isActive ? 'Active' : 'Inactive'}` : '—' },
      ],
    },
    {
      title: 'GUARDIAN ON FILE',
      fields: [
        { key: 'guardianName', label: 'Name', getValue: (user: UserDto | null) => user?.guardianName || '—' },
        { key: 'guardianEmail', label: 'Email', getValue: (user: UserDto | null) => user?.guardianEmail || '—' },
        { key: 'parentMobile', label: 'Mobile No', getValue: (user: UserDto | null) => user?.parentMobile || '—' },
      ],
    },
  ]

  return (
    <AccountSettingsPage
      role="Student"
      breadcrumb="Student / Account"
      portalLabel="STUDENT PORTAL"
      headerTitle="My Account"
      headerDescription="Manage your profile, notifications, and password settings."
      infoSections={infoSections}
      notificationItems={notificationItems}
    />
  )
}
