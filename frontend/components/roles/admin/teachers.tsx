"use client";

import { useEffect, useState } from 'react';
import { Modal, AddTeacherModal, type AddTeacherFormData } from '../../ui';
import { AppShell } from '../../layout/AppShell';
import { createUser, deleteUser, getUsers, updateUser } from '@/lib/api';
import { getTeacherAssignments, type TeacherSubjectAssignmentDto } from '@/lib/api/teacherAssignments';

type TeacherRow = {
  id: string;
  initials: string;
  name: string;
  email: string;
  subjects: string[];
  classesCount: number;
  status: 'Active' | 'Inactive' | 'On leave';
  tone: 'emerald' | 'amber' | 'slate';
  phone?: string;
  gender?: string;
  qualification?: string;
  joiningDate?: string;
  subjectSpecialization?: string;
  avatarUrl?: string;
};

function mapUserToTeacherRow(user: {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  subjectSpecialization?: string;
  phoneNumber?: string;
  employeeId?: string;
  gender?: string;
  qualification?: string;
  joiningDate?: string;
  avatarUrl?: string;
}) {
  const initials = user.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: user.id,
    initials,
    name: user.fullName,
    email: user.email,
    subjects: user.subjectSpecialization ? [user.subjectSpecialization] : [],
    classesCount: 0,
    status: user.isActive ? 'Active' : 'Inactive',
    tone: user.isActive ? 'emerald' : 'slate',
    phone: user.phoneNumber,
    gender: user.gender,
    qualification: user.qualification,
    joiningDate: user.joiningDate,
    subjectSpecialization: user.subjectSpecialization,
    avatarUrl: user.avatarUrl,
  } as TeacherRow;
}

export function AdminTeachersPage() {
  const [mode, setMode] = useState<'data' | 'empty' | 'error'>('data');
  const [selectedTab, setSelectedTab] = useState<'All' | 'Active' | 'On leave'>('All');
  const [roleFilter] = useState('All subjects');
  const [search, setSearch] = useState('');
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherSubjectAssignmentDto[]>([]);
  const [actionMenuFor, setActionMenuFor] = useState<string | null>(null);
  const [pendingDeleteTeacher, setPendingDeleteTeacher] = useState<TeacherRow | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [teacherModalSubmitting, setTeacherModalSubmitting] = useState(false);

  useEffect(() => {
    void loadTeachers();
  }, []);

  async function loadTeachers() {
    try {
      const [apiUsers, apiAssignments] = await Promise.all([getUsers(), getTeacherAssignments()]);
      const teacherUsers = apiUsers.filter((user) => user.role === 'Teacher');
      setTeacherAssignments(apiAssignments);
      const teacherRows = teacherUsers.map((user) => {
        const classesForTeacher = new Set(
          apiAssignments
            .filter((assignment) => assignment.teacherId === user.id)
            .map((assignment) => assignment.classCourseId)
        );

        return {
          ...mapUserToTeacherRow(user),
          classesCount: classesForTeacher.size,
          subjects: Array.from(new Set(
            apiAssignments
              .filter((assignment) => assignment.teacherId === user.id)
              .map((assignment) => assignment.subjectName)
          )),
        };
      });
      setTeachers(teacherRows);
      setMode(teacherRows.length === 0 ? 'empty' : 'data');
    } catch (err) {
      console.error(err);
      setMode('error');
    }
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!actionMenuFor) return;
      const target = event.target as Node;
      const menuEl = document.querySelector(`[data-action-menu="${actionMenuFor}"]`);
      const btnEl = document.querySelector(`[data-action-button="${actionMenuFor}"]`);
      if (menuEl && menuEl.contains(target)) return;
      if (btnEl && btnEl.contains(target)) return;
      setActionMenuFor(null);
    }
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [actionMenuFor]);

  function setState(s: 'data' | 'empty' | 'error') {
    setMode(s);
    if (s !== 'data') setActionMenuFor(null);
  }

  function setTab(tab: 'All' | 'Active' | 'On leave') {
    setSelectedTab(tab);
    setActionMenuFor(null);
  }

  function openDeleteTeacher(t: TeacherRow) {
    setPendingDeleteTeacher(t);
    setActionMenuFor(null);
  }

  function openNewTeacher() {
    setEditingTeacher(null);
    setIsTeacherModalOpen(true);
    setActionMenuFor(null);
  }

  function handleEditTeacher(t: TeacherRow) {
    setEditingTeacher(t);
    setIsTeacherModalOpen(true);
    setActionMenuFor(null);
  }

  async function confirmDeleteTeacher() {
    if (!pendingDeleteTeacher) return;

    try {
      await deleteUser(pendingDeleteTeacher.id);
      await loadTeachers();
    } catch (err) {
      console.error(err);
      alert('Unable to delete teacher.');
    } finally {
      setPendingDeleteTeacher(null);
      setActionMenuFor(null);
    }
  }

  async function handleSaveTeacher(values: AddTeacherFormData) {
    if (!values.fullName.trim() || !values.email.trim()) {
      alert('Full name and email are required.');
      return;
    }

    if (!values.joiningDate?.trim()) {
      alert('Joining date is required.');
      return;
    }

    if (!editingTeacher && !values.password.trim()) {
      alert('Password is required when creating a new teacher.');
      return;
    }

    setTeacherModalSubmitting(true);
    try {
      if (editingTeacher) {
        await updateUser(editingTeacher.id, {
          fullName: values.fullName,
          email: values.email,
          isActive: values.status === 'Active',
          subjectSpecialization: values.subjectSpecialization,
          phoneNumber: values.phone,
          gender: values.gender,
          qualification: values.qualification,
          joiningDate: values.joiningDate,
          password: values.password?.trim() ? values.password : undefined,
        });
      } else {
        await createUser({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          role: 'Teacher',
          isActive: values.status === 'Active',
          subjectSpecialization: values.subjectSpecialization,
          phoneNumber: values.phone,
          gender: values.gender,
          qualification: values.qualification,
          joiningDate: values.joiningDate,
        });
      }

      await loadTeachers();
      setIsTeacherModalOpen(false);
      setEditingTeacher(null);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Unable to save teacher. ${message}`);
    } finally {
      setTeacherModalSubmitting(false);
    }
  }

  function visibleRows() {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (selectedTab === 'Active' && t.status !== 'Active') return false;
      if (selectedTab === 'On leave' && t.status !== 'On leave') return false;
      if (q && !(`${t.name} ${t.email}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  const rows = visibleRows();

  return (
    <AppShell role="Admin" breadcrumb="Admin / Teachers">
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-brand-600">ADMINISTRATION</p>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Teachers</h1>
          </div>
          <button onClick={openNewTeacher} className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 flex items-center gap-2"> 
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add teacher
          </button>
          
        </div>

        <div className={`hidden ${mode === 'error' ? 'flex' : ''} bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4 items-center justify-between`} id="errorBanner">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-700">Couldn't load teachers</p>
              <p className="text-xs text-rose-500 mt-0.5">Check your connection and try again. If this keeps happening, contact support.</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-white border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-100">Retry</button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">TOTAL TEACHERS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? teachers.length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Across all departments</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">ACTIVE</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? teachers.filter(t => t.status==='Active').length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Currently teaching</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">ON LEAVE</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? teachers.filter(t => t.status==='On leave').length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Temporarily unavailable</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold text-slate-400">SUBJECTS COVERED</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? Array.from(new Set(teachers.flatMap(t=>t.subjects))).length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Distinct subjects taught</p>
          </div>
        </div>

        {mode === 'data' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <button onClick={()=>setTab('All')} className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${selectedTab==='All' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All <span className="opacity-70 font-normal">{teachers.length}</span></button>
                <button onClick={()=>setTab('Active')} className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${selectedTab==='Active' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Active <span className="opacity-60 font-normal">{teachers.filter(t=>t.status==='Active').length}</span></button>
                <button onClick={()=>setTab('On leave')} className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${selectedTab==='On leave' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>On leave <span className="opacity-60 font-normal">{teachers.filter(t=>t.status==='On leave').length}</span></button>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end min-w-[280px]">
                <select className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
                  <option>All subjects</option>
                </select>
                <div className="relative flex-1 max-w-xs">
                  <input value={search} onChange={(e)=>setSearch(e.target.value)} type="text" placeholder="Search teachers…" className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-500" />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-visible">
              <div id="dataTable" className="">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left">
                      <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">NAME</th>
                      <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">EMAIL</th>
                      <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">SUBJECTS</th>
                      <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">CLASSES</th>
                      <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">STATUS</th>
                      <th className="w-16 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-2 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${t.id==='mh'?'bg-brand-100 text-brand-700':'bg-slate-100 text-slate-700'}`}>{t.initials}</div>
                            <span className="font-semibold text-slate-700">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3.5 text-slate-500">{t.email}</td>
                        <td className="px-2 py-3.5">
                          <div className="flex flex-wrap gap-1">{t.subjects.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                        </td>
                        <td className="px-2 py-3.5 text-slate-500">{t.classesCount} classes</td>
                        <td className="px-2 py-3.5">
                          <span className={`badge ${t.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : t.tone === 'slate' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-600'}`}>
                            <span className={`badge-dot ${t.tone === 'emerald' ? 'bg-emerald-500' : t.tone === 'slate' ? 'bg-slate-500' : 'bg-amber-500'}`}></span>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="relative inline-flex">
                            <button
                              type="button"
                              data-action-button={t.id}
                              onClick={(e) => { e.stopPropagation(); setActionMenuFor(actionMenuFor === t.id ? null : t.id); }}
                              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 inline-flex items-center justify-center"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                            </button>
                            {actionMenuFor === t.id ? (
                              <div data-action-menu={t.id} onClick={(ev) => ev.stopPropagation()} className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                                <button type="button" onClick={() => handleEditTeacher(t)} className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">Edit teacher</button>
                                <button type="button" onClick={() => openDeleteTeacher(t)} className="w-full px-4 py-3 text-left text-sm text-rose-600 hover:bg-slate-50">Delete teacher</button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-600">1–{rows.length}</span> of <span className="font-semibold text-slate-600">{teachers.length}</span> teachers</p>
                  <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-500">
                      <option>10 / page</option>
                      <option>25 / page</option>
                      <option>50 / page</option>
                    </select>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center" disabled>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <span className="w-8 h-8 rounded-lg bg-brand-600 text-white text-xs font-semibold flex items-center justify-center">1</span>
                    <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center" disabled>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div id="emptyState" className={`${mode==='empty' ? 'flex' : 'hidden'} flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20 px-6 text-center`}>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="16" y1="11" x2="22" y2="11" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-800">No teachers yet</p>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Add your first teacher, or import a roster from a CSV file to get started quickly.</p>
          <div className="mt-5">
            <button onClick={openNewTeacher} className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">Add teacher</button>
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(pendingDeleteTeacher)}
        onClose={() => setPendingDeleteTeacher(null)}
        title="Delete teacher?"
        description={pendingDeleteTeacher ? `${pendingDeleteTeacher.name} will be removed. This action cannot be undone.` : undefined}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button type="button" className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50" onClick={() => setPendingDeleteTeacher(null)}>Cancel</button>
            <button type="button" className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700" onClick={confirmDeleteTeacher}>Delete</button>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">This action will permanently delete the teacher record.</p>
        </div>
      </Modal>
      <AddTeacherModal
        open={isTeacherModalOpen}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setEditingTeacher(null);
          setTeacherModalSubmitting(false);
        }}
        title={editingTeacher ? 'Edit teacher' : 'Add teacher'}
        submitLabel={editingTeacher ? 'Save changes' : 'Create teacher'}
        initialValues={editingTeacher ? {
          fullName: editingTeacher.name,
          email: editingTeacher.email,
          password: '',
          status: editingTeacher.status,
          phone: editingTeacher.phone ?? '',
          gender: editingTeacher.gender ?? '',
          qualification: editingTeacher.qualification ?? '',
          joiningDate: editingTeacher.joiningDate ?? '',
          subjectSpecialization: editingTeacher.subjectSpecialization ?? editingTeacher.subjects[0] ?? '',
          avatarUrl: editingTeacher.avatarUrl ?? '',
        } : undefined}
        isSubmitting={teacherModalSubmitting}
        requirePassword={!editingTeacher}
        onSubmit={handleSaveTeacher}
      />
    </AppShell>
  );
}
