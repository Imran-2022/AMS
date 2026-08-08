"use client"

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

export default function Page() {
  const notificationItems: NotificationItem[] = [
    { title: 'New submission received', description: 'Email me when a student submits work for one of my assignments.', checked: true },
    { title: 'My assignment deadline reminders', description: 'Remind me the day before one of my assignments is due.', checked: true },
    { title: 'Weekly grading summary', description: 'A Monday-morning summary of what still needs grading.', checked: true },
    { title: 'School-wide announcements', description: 'Notices sent by administrators to all staff.', checked: false },
  ]

  const infoSections: InfoSection[] = [
    {
      title: 'ACCOUNT INFORMATION',
      fields: [
        { key: 'studentId', label: 'Student ID', getValue: (user: UserDto | null) => user?.studentId || '—' },
        { key: 'gender', label: 'Gender', getValue: (user: UserDto | null) => user?.gender || '—' },
        { key: 'dateOfBirth', label: 'Date of birth', getValue: (user: UserDto | null) => user?.dateOfBirth || '—' },
        { key: 'admissionDate', label: 'Admission date', getValue: (user: UserDto | null) => user?.admissionDate || '—' },
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
