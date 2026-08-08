"use client";

import { useEffect, useState } from 'react';
import { AppShell } from '../../layout/AppShell';
import { Modal } from '../../ui';
import { getAcademicYears, activateAcademicYear, createAcademicYear } from '@/lib/api';

type SettingsTab = 'general' | 'academic' | 'notifications' | 'security' | 'activity' | 'danger';

export function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [schoolName, setSchoolName] = useState('AMS School');
  const [timeZone, setTimeZone] = useState('(GMT+6:00) Dhaka');
  const [contactEmail, setContactEmail] = useState('office@ams.edu');
  const [contactPhone, setContactPhone] = useState('');
  const [domain, setDomain] = useState('ams.edu');
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; startDate: string; endDate: string; isActive: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const defaultAcademicYearStart = `${currentYear}-01-01`;
  const defaultAcademicYearEnd = `${currentYear + 1}-01-01`;
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState(defaultAcademicYearStart);
  const [newYearEnd, setNewYearEnd] = useState(defaultAcademicYearEnd);
  const [newYearIsActive, setNewYearIsActive] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradingEnabled, setGradingEnabled] = useState(true);
  const [termStart, setTermStart] = useState('2026-08-01');
  const [termEnd, setTermEnd] = useState('2027-05-31');
  const [notificationDueReminder, setNotificationDueReminder] = useState(true);
  const [notificationMissingAlerts, setNotificationMissingAlerts] = useState(true);
  const [notificationWeeklyDigest, setNotificationWeeklyDigest] = useState(false);
  const [notificationWelcomeEmails, setNotificationWelcomeEmails] = useState(true);
  const [require2FAAdmins, setRequire2FAAdmins] = useState(true);
  const [autoSignOut, setAutoSignOut] = useState('30 minutes');
  const [passwordLength, setPasswordLength] = useState(8);

  useEffect(() => {
    void loadAcademicYears();
  }, []);

  async function loadAcademicYears() {
    try {
      setLoading(true);
      setError(null);
      const years = await getAcademicYears();
      setAcademicYears(years);
    } catch (err) {
      console.error('Failed to load academic years', err);
      setError('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivateYear(yearId: string) {
    try {
      setError(null);
      await activateAcademicYear(yearId);
      await loadAcademicYears();
    } catch (err) {
      console.error('Failed to activate academic year', err);
      setError('Failed to activate academic year');
    }
  }

  async function handleCreateYear() {
    if (!newYearName.trim()) {
      setCreateError('Academic year name is required.');
      return;
    }
    if (!newYearStart || !newYearEnd) {
      setCreateError('Start and end dates are required.');
      return;
    }
    if (new Date(newYearStart) >= new Date(newYearEnd)) {
      setCreateError('Start date must be before end date.');
      return;
    }

    try {
      setCreateError(null);
      setCreateLoading(true);
      await createAcademicYear({
        name: newYearName,
        startDate: `${newYearStart}T00:00:00Z`,
        endDate: `${newYearEnd}T00:00:00Z`,
        isActive: newYearIsActive
      });
      setNewYearName('');
      setNewYearStart(defaultAcademicYearStart);
      setNewYearEnd(defaultAcademicYearEnd);
      setNewYearIsActive(false);
      setShowCreateModal(false);
      await loadAcademicYears();
    } catch (err) {
      console.error('Failed to create academic year', err);
      setCreateError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreateLoading(false);
    }
  }

  const tabButton = (label: string, value: SettingsTab) => (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
        activeTab === value
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  const toggleButton = (enabled: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-10 w-16 shrink-0 rounded-full transition-colors ${
        enabled ? 'bg-brand-600' : 'bg-slate-200'
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute left-1 top-1 h-8 w-8 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <AppShell role="Admin" breadcrumb="Admin / Settings">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Settings</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1.5">
            {tabButton('General', 'general')}
            {tabButton('Academic', 'academic')}
            {tabButton('Notifications', 'notifications')}
            {tabButton('Security', 'security')}
            {tabButton('Activity log', 'activity')}
            {tabButton('Danger zone', 'danger')}
          </div>

          <div className="space-y-6">
            <div
              className={`${
                activeTab === 'general' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-6`}
            >
              <div>
                <p className="text-sm font-bold text-slate-700">School profile</p>
                <p className="text-xs text-slate-400 mt-0.5">Basic information shown across the platform.</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  AM
                </div>
                <div>
                  <button className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Upload logo
                  </button>
                  <p className="text-[11.5px] text-slate-400 mt-1">PNG or SVG, square, up to 1MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">School name</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(event) => setSchoolName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Timezone</label>
                  <select
                    value={timeZone}
                    onChange={(event) => setTimeZone(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  >
                    <option>(GMT+6:00) Dhaka</option>
                    <option>(GMT+0:00) London</option>
                    <option>(GMT-5:00) New York</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Contact email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">Contact phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">Allowed sign-in email domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  className="w-full max-w-xs rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <p className="text-[11.5px] text-slate-400 mt-1">Only accounts using this domain can be invited as students, teachers, or admins.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
                  Save changes
                </button>
              </div>
            </div>

            <div
              className={`${
                activeTab === 'academic' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-6`}
            >
              <div>
                <p className="text-sm font-bold text-slate-700">Academic years</p>
                <p className="text-xs text-slate-400 mt-0.5">Manage active academic years. Only one year can be active at a time.</p>
              </div>

              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 p-6 mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-700">Create an academic year</p>
                    <p className="text-xs text-slate-400 mt-0.5">Add a new academic session and optionally set it active.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateError(null);
                      setShowCreateModal(true);
                    }}
                    className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Create academic year
                  </button>
                </div>
              </div>
              <Modal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create academic year"
                description="Add a new academic session and optionally set it active."
                footer={
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateYear}
                      disabled={createLoading}
                      className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {createLoading ? 'Creating…' : 'Create academic year'}
                    </button>
                  </div>
                }
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">Year name</label>
                    <input
                      type="text"
                      value={newYearName}
                      onChange={(event) => setNewYearName(event.target.value)}
                      placeholder="2027-2028"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">Start date</label>
                    <input
                      type="date"
                      value={newYearStart}
                      onChange={(event) => setNewYearStart(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">End date</label>
                    <input
                      type="date"
                      value={newYearEnd}
                      onChange={(event) => setNewYearEnd(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newYearIsActive}
                        onChange={() => setNewYearIsActive((value) => !value)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Set active
                    </label>
                  </div>
                </div>
                {createError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 mt-4">
                    {createError}
                  </div>
                )}
              </Modal>

              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading academic years...</div>
              ) : academicYears.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No academic years found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">YEAR</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">START DATE</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">END DATE</th>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400">STATUS</th>
                        <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {academicYears.map((year) => (
                        <tr key={year.id}>
                          <td className="px-4 py-3 font-semibold text-slate-700">{year.name}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(year.startDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(year.endDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {year.isActive ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11.5px] font-bold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-[11.5px] font-bold text-slate-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {!year.isActive && (
                              <button
                                onClick={() => handleActivateYear(year.id)}
                                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Enable grading workflow for new assignments</p>
                    <p className="text-xs text-slate-400 mt-0.5">New assignments require marks entry before being marked "graded."</p>
                  </div>
                  {toggleButton(gradingEnabled, () => setGradingEnabled((value) => !value))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
                  Save changes
                </button>
              </div>
            </div>

            <div
              className={`${
                activeTab === 'notifications' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-1`}
            >
              <div className="pb-4">
                <p className="text-sm font-bold text-slate-700">Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Choose what triggers an email, and to whom.</p>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="pr-6">
                    <p className="text-sm font-semibold text-slate-700">Assignment due-date reminders</p>
                    <p className="text-xs text-slate-400 mt-0.5">Email teachers before their assignment deadline passes.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <select className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-500">
                      <option>24 hours before</option>
                      <option>12 hours before</option>
                      <option>48 hours before</option>
                    </select>
                    {toggleButton(notificationDueReminder, () => setNotificationDueReminder((value) => !value))}
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-slate-100 pt-4">
                  <div className="pr-6">
                    <p className="text-sm font-semibold text-slate-700">Missing submission alerts</p>
                    <p className="text-xs text-slate-400 mt-0.5">Notify admins when a student misses a deadline entirely.</p>
                  </div>
                  {toggleButton(notificationMissingAlerts, () => setNotificationMissingAlerts((value) => !value))}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-slate-100 pt-4">
                  <div className="pr-6">
                    <p className="text-sm font-semibold text-slate-700">Weekly summary digest</p>
                    <p className="text-xs text-slate-400 mt-0.5">A Monday-morning summary of activity sent to all admins.</p>
                  </div>
                  {toggleButton(notificationWeeklyDigest, () => setNotificationWeeklyDigest((value) => !value))}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-slate-100 pt-4">
                  <div className="pr-6">
                    <p className="text-sm font-semibold text-slate-700">New account welcome emails</p>
                    <p className="text-xs text-slate-400 mt-0.5">Send onboarding instructions when a student or teacher account is created.</p>
                  </div>
                  {toggleButton(notificationWelcomeEmails, () => setNotificationWelcomeEmails((value) => !value))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
                  Save changes
                </button>
              </div>
            </div>

            <div
              className={`${
                activeTab === 'security' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 p-6 space-y-1`}
            >
              <div className="pb-4">
                <p className="text-sm font-bold text-slate-700">Security</p>
                <p className="text-xs text-slate-400 mt-0.5">Protect access to the admin dashboard.</p>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="pr-6">
                    <p className="text-sm font-semibold text-slate-700">Require 2FA for administrators</p>
                    <p className="text-xs text-slate-400 mt-0.5">All Super Admin and Admin accounts must set up two-factor authentication.</p>
                  </div>
                  {toggleButton(require2FAAdmins, () => setRequire2FAAdmins((value) => !value))}
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t border-slate-100 pt-4">
                  <div className="pr-6">
                    <p className="text-sm font-semibold text-slate-700">Auto sign-out after inactivity</p>
                    <p className="text-xs text-slate-400 mt-0.5">Automatically end idle admin sessions.</p>
                  </div>
                  <select
                    value={autoSignOut}
                    onChange={(event) => setAutoSignOut(event.target.value)}
                    className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-500 shrink-0"
                  >
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                  </select>
                </div>

                <div className="py-4 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Minimum password length</p>
                  <input
                    type="range"
                    min="6"
                    max="16"
                    value={passwordLength}
                    onChange={(event) => setPasswordLength(Number(event.target.value))}
                    className="w-full max-w-xs accent-brand-600"
                  />
                  <p className="text-[11.5px] text-slate-400 mt-1">{passwordLength} characters minimum</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">
                  Save changes
                </button>
              </div>
            </div>

            <div
              className={`${
                activeTab === 'activity' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-slate-200 overflow-hidden`}
            >
              <div className="p-6 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-700">Recent activity</p>
                  <p className="text-xs text-slate-400 mt-0.5">Sign-ins and changes made by administrators.</p>
                </div>
                <button className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">
                  Export CSV
                </button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-400">ADMIN</th>
                    <th className="px-2 py-3 text-[11px] font-bold text-slate-400">ACTION</th>
                    <th className="px-2 py-3 text-[11px] font-bold text-slate-400">TIME</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-400">IP ADDRESS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="px-6 py-3 font-semibold text-slate-700">Nusrat Jahan</td>
                    <td className="px-2 py-3 text-slate-500">Signed in</td>
                    <td className="px-2 py-3 text-slate-500">Today, 1:14 PM</td>
                    <td className="px-6 py-3 text-slate-400 font-mono text-xs">103.22.14.6</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-slate-700">Rakib Hossain</td>
                    <td className="px-2 py-3 text-slate-500">Updated student "Ayesha Rahman"</td>
                    <td className="px-2 py-3 text-slate-500">Yesterday, 4:52 PM</td>
                    <td className="px-6 py-3 text-slate-400 font-mono text-xs">45.118.9.201</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-slate-700">Nusrat Jahan</td>
                    <td className="px-2 py-3 text-slate-500">Invited administrator "Tania Karim"</td>
                    <td className="px-2 py-3 text-slate-500">Aug 3, 2026</td>
                    <td className="px-6 py-3 text-slate-400 font-mono text-xs">103.22.14.6</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-semibold text-slate-700">Rakib Hossain</td>
                    <td className="px-2 py-3 text-slate-500">Archived assignment "Old Quiz"</td>
                    <td className="px-2 py-3 text-slate-500">Aug 1, 2026</td>
                    <td className="px-6 py-3 text-slate-400 font-mono text-xs">45.118.9.201</td>
                  </tr>
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-slate-100">
                <button className="text-sm font-semibold text-brand-600 hover:text-brand-700">View full log →</button>
              </div>
            </div>

            <div
              className={`${
                activeTab === 'danger' ? 'block' : 'hidden'
              } bg-white rounded-2xl border border-rose-200 overflow-hidden`}
            >
              <div className="p-6 pb-4">
                <p className="text-sm font-bold text-rose-700">Danger zone</p>
                <p className="text-xs text-slate-400 mt-0.5">These actions are irreversible. Proceed with care.</p>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Export all school data</p>
                    <p className="text-xs text-slate-400 mt-0.5">Download students, teachers, classes, assignments and submissions as CSV.</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 shrink-0">
                    Export
                  </button>
                </div>
                <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Deactivate school account</p>
                    <p className="text-xs text-slate-400 mt-0.5">All users lose access immediately. Data is retained for 30 days.</p>
                  </div>
                  <button className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-100 shrink-0">
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
