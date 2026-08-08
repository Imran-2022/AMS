"use client"

import { useEffect, useState, type ChangeEvent } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { changePassword, getCurrentUser, getUserById, updateUser, type UserDto } from '@/lib/api'
import { uploadFile } from '@/lib/api/files'
import { setStoredUser } from '@/lib/auth'
import { emitToast } from '@/components/ui'

const accountTabs = [
  { key: 'security', label: 'Change password' },
  { key: 'notifications', label: 'Notifications' },
] as const

const notificationItems = [
  { title: 'Grade posted', description: 'Notify me as soon as a teacher grades my work.', checked: true },
  { title: 'Assignment due soon', description: 'Remind me the day before an assignment is due.', checked: true },
  { title: 'Teacher feedback added', description: 'Notify me when a teacher adds written feedback to my work.', checked: true },
  { title: 'New assignment published', description: 'Let me know as soon as a new assignment is posted.', checked: false },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'security'>('security')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [user, setUser] = useState<UserDto | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toggles, setToggles] = useState(() => notificationItems.reduce((acc, item) => ({ ...acc, [item.title]: item.checked }), {} as Record<string, boolean>))

  async function loadUser() {
    try {
      const current = await getCurrentUser()
      setUser(current)
      const base = process.env.NEXT_PUBLIC_API_URL ?? ''
      const avatar = current.avatarUrl ? (current.avatarUrl.startsWith('http') ? current.avatarUrl : `${base}${current.avatarUrl}`) : null
      setProfileImage(avatar)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !user) return

    try {
      setLoading(true)
      const uploadResult = await uploadFile(file)
      const updated = await updateUser(user.id, { avatarUrl: uploadResult.fileUrl })
        setUser(updated)
        const base = process.env.NEXT_PUBLIC_API_URL ?? ''
        const avatar = updated.avatarUrl ? (updated.avatarUrl.startsWith('http') ? updated.avatarUrl : `${base}${updated.avatarUrl}`) : null
        setProfileImage(avatar)
      setStoredUser(updated)
        emitToast('Profile photo updated', 'success')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('ams-user-changed'))
      }
    } catch (uploadError) {
      console.error(uploadError)
    } finally {
      setLoading(false)
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
      setLoading(true)
      setError(null)
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      emitToast('Password updated successfully.', 'success')
    } catch (err: any) {
      setError(err?.message || 'Password update failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell role="Student" breadcrumb="Student / Account">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">My Account</h1>
          <p className="text-sm text-slate-500">Manage your profile, notifications, and password settings.</p>
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
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" /><circle cx="12" cy="13" r="4" /></svg>
                <span>CHANGE PHOTO</span>
              </div>
              <label htmlFor="profile-upload" className="absolute inset-0 cursor-pointer" />
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <p className="avatar-help text-center">PNG or JPG, square, up to 2MB</p>

            <div className="text-center">
              <p className="text-base font-bold text-slate-800">{user?.fullName ?? 'Student Name'}</p>
              <span className="chip bg-brand-50 text-brand-700 mt-1.5 inline-flex">{user?.role ?? 'Student'}</span>
            </div>

            <div className="pt-4 border-t border-slate-100 text-left space-y-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <span className="font-bold text-slate-700">{user?.email ?? 'loading...'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-left">
              <p className="text-[10.5px] font-bold mb-1">ACCOUNT INFORMATION</p>
              <div className="info-row"><span className="k">Student ID</span><span className="v">{user?.studentId || '—'}</span></div>
              <div className="info-row"><span className="k">Gender</span><span className="v">{user?.gender || '—'}</span></div>
              <div className="info-row"><span className="k">Date of birth</span><span className="v">{user?.dateOfBirth || '—'}</span></div>
              <div className="info-row"><span className="k">Admission date</span><span className="v">{user?.admissionDate || '—'}</span></div>
              <div className="info-row"><span className="k">Status</span><span className="v inline-flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${user?.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />{user?.isActive ? 'Active' : 'Inactive'}</span></div>
            </div>
            <div className="pt-4 border-t border-slate-100 text-left">
              <p className="text-[10.5px] font-bold mb-1 uppercase">Guardian on file</p>
              <div className="info-row"><span className="k">Name</span><span className="v">{user?.guardianName || '—'}</span></div>
              <div className="info-row"><span className="k">Email</span><span className="v">{user?.guardianEmail || '—'}</span></div>
              <div className="info-row"><span className="k">Mobile No</span><span className="v">{user?.parentMobile || '—'}</span></div>
            </div>
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
                      className={`acc-tab ${active ? 'active' : ''}`}>
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6">
              <div className={`${activeTab === 'notifications' ? 'block' : 'hidden'} space-y-4`}>
                {notificationItems.map((item, index) => (
                  <div key={item.title} className={`flex flex-col gap-4 py-4 ${index > 0 ? 'border-t border-slate-100' : ''} sm:flex-row sm:items-center sm:justify-between`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={toggles[item.title]}
                        onChange={() => setToggles((prev) => ({ ...prev, [item.title]: !prev[item.title] }))}
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
                    disabled={loading}
                    className="rounded bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {loading ? (
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                    ) : null}
                    <span>{loading ? 'Saving…' : 'Save changes'}</span>
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
