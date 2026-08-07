"use client"

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'

const settingsTabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Password & security' },
] as const

const notificationItems = [
  { title: 'New submission received', description: 'Email me when a student submits work for one of my assignments.', checked: true },
  { title: 'Deadline reminders', description: 'Remind me the day before an assignment is due.', checked: true },
  { title: 'Weekly progress summary', description: 'A Monday summary of my progress and grades.', checked: true },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile')
  const [toggles, setToggles] = useState(() => notificationItems.reduce((acc, item) => ({ ...acc, [item.title]: item.checked }), {} as Record<string, boolean>))

  return (
    <AppShell role="Student" breadcrumb="Student / Settings">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-600">STUDENT PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Settings</h1>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full lg:w-56 bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
            {settingsTabs.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? 'bg-[#F5F3FF] text-[#6D28D9]' : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </aside>

          <section className="flex-1 space-y-6">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-slate-700">Profile</p>
                  <p className="text-xs text-slate-400 mt-1">This information is visible to your teachers and administrators.</p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl">AR</div>
                  <div>
                    <button type="button" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Upload photo</button>
                    <p className="text-xs text-slate-400 mt-2">PNG or JPG, square, up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                    <input type="text" defaultValue="Ayesha Rahman" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                    <input type="tel" defaultValue="+880 1711-223344" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                    <input type="email" defaultValue="ayesha.r@ams.edu" disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none" />
                    <p className="text-xs text-slate-400 mt-2">Your sign-in email is managed by your school administrator.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Class assignments</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">Class 9-A · Mathematics</span>
                    <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#0C4A6E]">Class 9-A · Physics</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Your class assignments are controlled by administrators.</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="button" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Save changes</button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-700">Notifications</p>
                  <p className="text-xs text-slate-400 mt-1">Choose which alerts you want to receive.</p>
                </div>
                <div className="space-y-4">
                  {notificationItems.map((item) => (
                    <div key={item.title} className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.description}</p>
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
                  <p className="text-xs text-slate-400 mt-1">Keep your account secure.</p>
                </div>

                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Current password</label>
                    <input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
                    <input type="password" placeholder="At least 8 characters" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label>
                    <input type="password" placeholder="Re-enter new password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div className="pt-1">
                    <button type="button" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Update password</button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Sign out of all other devices</p>
                    <p className="text-xs text-slate-400 mt-1">Ends every active session except this one.</p>
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
