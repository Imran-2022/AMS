"use client"

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';

const tabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Password & security' },
];

const notificationItems = [
  {
    title: 'New submission received',
    description: 'Email me when a student submits work for one of my assignments.',
    checked: true,
  },
  {
    title: 'My assignment deadline reminders',
    description: 'Remind me the day before one of my assignments is due.',
    checked: true,
  },
  {
    title: 'Weekly grading summary',
    description: 'A Monday-morning summary of what still needs grading.',
    checked: true,
  },
  {
    title: 'School-wide announcements',
    description: 'Notices sent by administrators to all staff.',
    checked: true,
  },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [toggles, setToggles] = useState(() => notificationItems.reduce((acc, item) => ({ ...acc, [item.title]: item.checked }), {} as Record<string, boolean>));

  return (
    <AppShell role="Teacher" breadcrumb="Teacher / Settings">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-brand-600">TEACHER PORTAL</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-1">Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-56 bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? 'bg-[#F5F3FF] text-[#6D28D9]' : 'text-slate-500 hover:bg-slate-50'
                  }`}>
                  {tab.key === 'profile' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ) : tab.key === 'notifications' ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          <section className="flex-1 min-w-0 space-y-6">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <div>
                  <p className="text-sm font-bold text-slate-700">Profile</p>
                  <p className="text-xs text-slate-400 mt-1">This information is visible to students and admins.</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl">RI</div>
                  <div>
                    <button type="button" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Upload photo</button>
                    <p className="text-xs text-slate-400 mt-2">PNG or JPG, square, up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                    <input type="text" defaultValue="Rafiul Islam" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
                    <input type="tel" defaultValue="+880 1712-445566" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                    <input type="email" defaultValue="rafiul.i@ams.edu" disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none" />
                    <p className="text-xs text-slate-400 mt-2">Your sign-in email is managed by your school administrator.</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="mb-3 text-sm font-semibold text-slate-700">Your classes & subjects</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">Class 9-A · Mathematics</span>
                    <span className="rounded-full bg-[#E0F2FE] px-3 py-1 text-xs font-semibold text-[#0C4A6E]">Class 9-A · Physics</span>
                    <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#166534]">Class 10-B · Mathematics</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3">Teaching assignments are set by your admin — contact them to request a change.</p>
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
                  <p className="text-xs text-slate-400 mt-1">Choose what you get emailed about.</p>
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
                          }`} />
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
                    <input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
                    <input type="password" placeholder="At least 8 characters" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label>
                    <input type="password" placeholder="Re-enter new password" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
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
  );
}
