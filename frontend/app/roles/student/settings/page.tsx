"use client"

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

const settingsTabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Password & security' },
] as const

const notificationItems = [
  { title: 'Grade posted', description: 'Email me as soon as a teacher grades my work.', checked: true },
  { title: 'Assignment due soon', description: 'Remind me the day before an assignment is due.', checked: true },
  { title: 'Teacher feedback added', description: 'Notify me when a teacher adds written feedback to my work.', checked: true },
  { title: 'New assignment published', description: 'Let me know as soon as a new assignment is posted.', checked: false },
  { title: 'School-wide announcements', description: 'Notices sent by administrators to all students.', checked: true },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile')
  const [toggles, setToggles] = useState(() => notificationItems.reduce((acc, item) => ({ ...acc, [item.title]: item.checked }), {} as Record<string, boolean>))

  return (
    <AppShell role="Student" breadcrumb="Student / Settings">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Settings</h1>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row items-start">
          <aside className="w-full lg:w-56 bg-white rounded-2xl border border-slate-200 p-2 space-y-0.5">
            {settingsTabs.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active ? 'bg-[#EEF2FF] text-[#5B21B6]' : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                  {tab.label}
                </button>
              )
            })}
          </aside>

          <section className="flex-1 min-w-0 space-y-6">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-slate-700">Profile</p>
                  <p className="text-xs text-slate-400 mt-0.5">This information is visible to your teachers.</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl">AR</div>
                  <div>
                    <button type="button" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Upload photo</button>
                    <p className="text-xs text-slate-400 mt-2">PNG or JPG, square, up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                    <input type="text" value="Ayesha Rahman" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" disabled />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Roll no. / Student ID</label>
                    <input type="text" value="STU-0142" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" disabled />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                    <input type="email" value="ayesha.r@ams.edu" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none" disabled />
                    <p className="text-xs text-slate-400 mt-2">Your name and sign-in email are managed by your school administrator.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Class & enrollment</label>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#3730A3]">Class 9 - A</span>
                    <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#075985]">Mathematics</span>
                    <span className="rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold text-[#166534]">Physics</span>
                    <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#5B21B6]">Biology</span>
                    <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">English</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">To change your class or subjects, ask your parent/guardian to contact the school office.</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Guardian on file</label>
                  <div className="rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Mrs. Rahman</p>
                      <p className="text-xs text-slate-400 mt-0.5">+880 1711-223344</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">Read-only</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-700">Notifications</p>
                  <p className="text-xs text-slate-400 mt-0.5">Choose what you get emailed about.</p>
                </div>

                <div className="space-y-4">
                  {notificationItems.map((item) => (
                    <div key={item.title} className="flex flex-col gap-4 rounded-2xl border-t border-slate-100 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="pr-6">
                        <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={toggles[item.title]}
                          onChange={() => setToggles((prev) => ({ ...prev, [item.title]: !prev[item.title] }))}
                        />
                        <span className={`block h-6 w-11 rounded-full transition duration-200 ease-in-out ${toggles[item.title] ? 'bg-brand-600' : 'bg-slate-200'}`} />
                        <span
                          className={`pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                            toggles[item.title] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <button type="button" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Save changes</button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-slate-700">Password & security</p>
                  <p className="text-xs text-slate-400 mt-0.5">Keep your account secure.</p>
                </div>

                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Current password</label>
                    <input type="password" placeholder="••••••••" className="field-input max-w-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
                    <input type="password" placeholder="At least 8 characters" className="field-input max-w-sm" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label>
                    <input type="password" placeholder="Re-enter new password" className="field-input max-w-sm" />
                  </div>
                  <div className="pt-1">
                    <button type="button" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Update password</button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Sign out of all other devices</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ends every active session except this one.</p>
                  </div>
                  <button type="button" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Sign out everywhere</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
