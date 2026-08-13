"use client"

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { AppShell } from '@/shared/layout'
import { API_BASE_URL, changePassword, getCurrentUser, updateUser, type UserDto } from '@/lib/api'
import { getNotificationPreferences, updateNotificationPreference } from '@/lib/api/notifications'
import { uploadFile } from '@/lib/api/files'
import { setStoredUser } from '@/lib/auth'
import { emitToast } from '@/components/ui'
import { getNotificationDefinitionsForRole } from '@/shared/constants/notifications'

type AccountTab = 'security' | 'notifications'

type NotificationItem = {
  type: string
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

interface AccountSettingsPageProps {
  role: 'Admin' | 'Teacher' | 'Student'
  breadcrumb: string
  portalLabel: string
  headerTitle: string
  headerDescription: string
  infoSections: InfoSection[]
  notificationItems?: NotificationItem[]
}

const accountTabs = [
  { key: 'security' as const, label: 'Change password' },
  { key: 'notifications' as const, label: 'Notifications' },
]

const defaultNotificationItems: NotificationItem[] = getNotificationDefinitionsForRole('Student')

export function AccountSettingsPage({
  role,
  breadcrumb,
  portalLabel,
  headerTitle,
  headerDescription,
  infoSections,
  notificationItems = defaultNotificationItems,
}: AccountSettingsPageProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>('security')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [user, setUser] = useState<UserDto | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [uploading, setUploading] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    notificationItems.reduce(
      (acc, item) => ({ ...acc, [item.type]: item.checked }),
      {} as Record<string, boolean>
    )
  )

  async function loadUser() {
    try {
      const current = await getCurrentUser()
      setUser(current)
      const avatar = current.avatarUrl
        ? current.avatarUrl.startsWith('http')
          ? current.avatarUrl
          : `${API_BASE_URL}${current.avatarUrl}`
        : null
      setProfileImage(avatar)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadNotificationPreferences() {
    try {
      const preferences = await getNotificationPreferences()
      const nextState = notificationItems.reduce((acc, item) => {
        const found = preferences.find((pref) => pref.type === item.type)
        acc[item.type] = found ? found.isEnabled : item.checked
        return acc
      }, {} as Record<string, boolean>)
      setToggles(nextState)
    } catch (error) {
      console.error('Failed to load notification preferences', error)
    }
  }

  useEffect(() => {
    void loadUser()
  }, [])

  useEffect(() => {
    if (activeTab === 'notifications') {
      void loadNotificationPreferences()
    }
  }, [activeTab])

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setUploading(true)
      const uploadResult = await uploadFile(file)
      const updated = await updateUser(user.id, { avatarUrl: uploadResult.fileUrl })
      setUser(updated)
      
      // Increment cache version for this update
      const currentVersion = parseInt(typeof window !== 'undefined' ? window.localStorage.getItem('ams-avatar-cache-v') || '0' : '0', 10)
      const newVersion = currentVersion + 1
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('ams-avatar-cache-v', String(newVersion))
      }
      
      const baseUrl = updated.avatarUrl
        ? updated.avatarUrl.startsWith('http')
          ? updated.avatarUrl
          : `${API_BASE_URL}${updated.avatarUrl}`
        : null
      
      if (baseUrl) {
        // Add cache-busting with version and timestamp
        const avatarUrl = `${baseUrl}?v=${newVersion}`
        
        // Set the image directly without preloading (simpler and more reliable)
        setProfileImage(avatarUrl)
        
        // Update stored user
        setStoredUser({
          id: updated.id,
          email: updated.email,
          role: updated.role,
          fullName: updated.fullName,
          isActive: updated.isActive,
          avatarUrl: updated.avatarUrl,
        })
        
        emitToast('Profile photo updated', 'success')
        
        // Dispatch event to update sidebar with the same URL and version
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ams-user-changed', {
            detail: { avatarCacheBuster: newVersion }
          }))
        }
      } else {
        emitToast('Profile photo updated', 'success')
      }
    } catch (uploadError: any) {
      console.error(uploadError)
      emitToast(uploadError?.message || 'Failed to upload profile photo.', 'error')
    } finally {
      setUploading(false)
      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleSavePassword() {
    if (!user) return
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    try {
      setSavingPassword(true)
      setError(null)
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      emitToast('Password updated successfully.', 'success')
    } catch (err: any) {
      setError(err?.message || 'Password update failed.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <AppShell role={role} breadcrumb={breadcrumb}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-brand-600">{portalLabel}</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">{headerTitle}</h1>
          <p className="text-sm text-slate-500">{headerDescription}</p>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          <aside className="w-full xl:w-72 bg-white rounded-2xl border border-slate-200 p-6 shrink-0 space-y-3">
            <div className="avatar-wrap">
              {profileImage ? (
                <img src={profileImage} alt="Profile photo" className="base object-cover" />
              ) : (
                <div className="base">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="overlay">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>CHANGE PHOTO</span>
              </div>
              <label htmlFor="profile-upload" className={`absolute inset-0 cursor-pointer ${uploading ? 'pointer-events-none' : ''}`} />
              <input ref={fileInputRef} id="profile-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40 text-white text-sm font-semibold">Uploading…</div>
              ) : null}
            </div>
            <p className="avatar-help text-center">PNG or JPG, square, up to 2MB</p>

            <div className="text-center">
              <p className="text-base font-bold text-slate-800">{user?.fullName ?? `${role} Name`}</p>
              <span className="chip bg-brand-50 text-brand-700 mt-1.5 inline-flex">{user?.role ?? role}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 text-left space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="font-bold text-slate-700">{user?.email ?? 'loading...'}</span>
              </div>
            </div>

            {infoSections.map((section) => (
              <div key={section.title} className="pt-2 border-t border-slate-100 text-left">
                <p className="text-[10.5px] font-bold mb-1">{section.title}</p>
                {section.fields.map((field) => {
                  const value = field.getValue(user)
                  const isStatus = field.key === 'status'
                  return (
                    <div key={field.key} className="info-row">
                      <span className="k">{field.label}</span>
                      <span className={isStatus ? 'v inline-flex items-center gap-1.5' : 'v'}>
                        {isStatus && value !== '—' ? (
                          <span className={`w-1.5 h-1.5 rounded-full ${value === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        ) : null}
                        {value}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </aside>

          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5">
              <div>
                <p className="text-sm font-bold text-slate-700">Account settings</p>
                <p className="text-xs text-slate-400 mt-0.5">Choose your notification and security preferences.</p>
              </div>
              <div className="bg-slate-100 rounded-full p-1 inline-flex gap-1 shrink-0">
                {accountTabs.map((tab) => {
                  const active = activeTab === tab.key
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`acc-tab ${active ? 'active' : ''}`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6">
              <div className={`${activeTab === 'notifications' ? 'block' : 'hidden'} space-y-4`}>
                {notificationItems.map((item, index) => (
                  <div key={item.type} className={`flex flex-col gap-4 py-4 ${index > 0 ? 'border-t border-slate-100' : ''} sm:flex-row sm:items-center sm:justify-between`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(toggles[item.type])}
                        onChange={async () => {
                          const nextValue = !Boolean(toggles[item.type])
                          setToggles((prev) => ({ ...prev, [item.type]: nextValue }))
                          try {
                            await updateNotificationPreference(item.type, nextValue)
                          } catch (error: any) {
                            setToggles((prev) => ({ ...prev, [item.type]: !nextValue }))
                            emitToast(error?.message || 'Unable to update notification preference.', 'error')
                          }
                        }}
                      />
                      <span className="track" />
                    </label>
                  </div>
                ))}
              </div>

              <div className={`${activeTab === 'security' ? 'block' : 'hidden'} space-y-2`}>
                <div>
                  <label className="field-label">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="••••••••"
                    className="field-input max-w-sm"
                  />
                </div>
                <div>
                  <label className="field-label">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="field-input max-w-sm"
                  />
                </div>
                <div>
                  <label className="field-label">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter new password"
                    className="field-input max-w-sm"
                  />
                </div>

                {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                <div className="pt-5 flex">
                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={savingPassword}
                    className="rounded bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {savingPassword ? (
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    ) : null}
                    Update password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
