"use client";

import React, { useEffect, useState } from 'react';
import { AppShell } from '../../layout/AppShell';

type TeacherRow = {
  id: string;
  initials: string;
  name: string;
  email: string;
  subjects: string[];
  classesCount: number;
  status: 'Active' | 'On leave';
  tone: 'emerald' | 'amber';
};

const TEACHERS: TeacherRow[] = [
  { id: 'mh', initials: 'MH', name: 'Mahfuz Hasan', email: 'mahfuz.h@ams.edu', subjects: ['Mathematics', 'Physics'], classesCount: 3, status: 'Active', tone: 'emerald' },
  { id: 'sr', initials: 'SR', name: 'Sabrina Rahim', email: 'sabrina.r@ams.edu', subjects: ['English'], classesCount: 4, status: 'Active', tone: 'emerald' },
  { id: 'ik', initials: 'IK', name: 'Imran Kabir', email: 'imran.k@ams.edu', subjects: ['Biology', 'Chemistry'], classesCount: 2, status: 'On leave', tone: 'amber' },
  { id: 'fa', initials: 'FA', name: 'Farzana Aktar', email: 'farzana.a@ams.edu', subjects: ['History', 'Civics'], classesCount: 3, status: 'Active', tone: 'emerald' },
  { id: 'rc', initials: 'RC', name: 'Rezwan Chowdhury', email: 'rezwan.c@ams.edu', subjects: ['Computer Science'], classesCount: 2, status: 'Active', tone: 'emerald' },
];

export function AdminTeachersPage() {
  const [mode, setMode] = useState<'data' | 'empty' | 'error'>('data');
  const [selectedTab, setSelectedTab] = useState<'All' | 'Active' | 'On leave'>('All');
  const [roleFilter] = useState('All subjects');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMode('data');
  }, []);

  function setState(s: 'data' | 'empty' | 'error') {
    setMode(s);
    if (s !== 'data') setSelectedIds({});
  }

  function setTab(tab: 'All' | 'Active' | 'On leave') {
    setSelectedTab(tab);
    setSelectedIds({});
  }

  function toggleAll(checked: boolean) {
    if (!checked) return setSelectedIds({});
    const map: Record<string, boolean> = {};
    visibleRows().forEach((r) => (map[r.id] = true));
    setSelectedIds(map);
  }

  function toggleBulk(id?: string) {
    if (!id) return;
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function visibleRows() {
    const q = search.trim().toLowerCase();
    return TEACHERS.filter((t) => {
      if (selectedTab === 'Active' && t.status !== 'Active') return false;
      if (selectedTab === 'On leave' && t.status !== 'On leave') return false;
      if (q && !(`${t.name} ${t.email}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }

  const rows = visibleRows();
  const selectedCount = Object.values(selectedIds).filter(Boolean).length;

  return (
    <AppShell role="Admin" breadcrumb="Admin / Teachers">
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-600">ADMINISTRATION</p>
            <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Teachers</h1>
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 flex items-center gap-2"> 
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
              <p className="text-[11px] font-bold tracking-widest text-slate-400">TOTAL TEACHERS</p>
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? TEACHERS.length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Across all departments</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">ACTIVE</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? TEACHERS.filter(t => t.status==='Active').length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Currently teaching</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">ON LEAVE</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? TEACHERS.filter(t => t.status==='On leave').length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Temporarily unavailable</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold tracking-widest text-slate-400">SUBJECTS COVERED</p>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 stat-num">{mode === 'data' ? Array.from(new Set(TEACHERS.flatMap(t=>t.subjects))).length : 0}</p>
            <p className="text-xs text-slate-400 mt-1">Distinct subjects taught</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={()=>setTab('All')} className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${selectedTab==='All' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>All <span className="opacity-70 font-normal">{TEACHERS.length}</span></button>
            <button onClick={()=>setTab('Active')} className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${selectedTab==='Active' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Active <span className="opacity-60 font-normal">{TEACHERS.filter(t=>t.status==='Active').length}</span></button>
            <button onClick={()=>setTab('On leave')} className={`tab px-4 py-2 rounded-xl text-sm font-semibold ${selectedTab==='On leave' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>On leave <span className="opacity-60 font-normal">{TEACHERS.filter(t=>t.status==='On leave').length}</span></button>
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

        <div className={`${selectedCount>0 ? 'flex' : 'hidden'} items-center justify-between bg-brand-600 text-white rounded-2xl px-5 py-3`} id="bulkBar">
          <p className="text-sm font-semibold"><span>{selectedCount}</span> selected</p>
          <div className="flex items-center gap-2">
            <button className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium">Set active</button>
            <button className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium">Set on leave</button>
            <button className="px-3.5 py-1.5 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-sm font-medium">Remove</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div id="dataTable" className={`${mode==='data' ? '' : 'hidden'}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="w-10 px-5 py-3.5"><input onChange={(e)=>toggleAll(e.target.checked)} type="checkbox" className="accent-brand-600 w-4 h-4" /></th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">NAME</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">EMAIL</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">SUBJECTS</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">CLASSES</th>
                  <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">STATUS</th>
                  <th className="w-16 px-5 py-3.5 text-right text-[11px] font-bold tracking-widest text-slate-400">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5"><input checked={!!selectedIds[t.id]} onChange={()=>toggleBulk(t.id)} type="checkbox" className="row-chk accent-brand-600 w-4 h-4" /></td>
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${t.id==='mh'?'bg-brand-100 text-brand-700':'bg-slate-100 text-slate-700'}`}>{t.initials}</div>
                        <span className="font-semibold text-slate-700">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 text-slate-500">{t.email}</td>
                    <td className="px-2 py-3.5">
                      <div className="flex flex-wrap gap-1">{t.subjects.map(s=> <span key={s} className="chip">{s}</span>)}</div>
                    </td>
                    <td className="px-2 py-3.5 text-slate-500">{t.classesCount} classes</td>
                    <td className="px-2 py-3.5">
                      <span className={`badge ${t.tone==='emerald'?'bg-emerald-50 text-emerald-600':'bg-amber-50 text-amber-600'}`}>
                        <span className={`badge-dot ${t.tone==='emerald'?'bg-emerald-500':'bg-amber-500'}`}></span>{t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 inline-flex items-center justify-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-600">1–{rows.length}</span> of <span className="font-semibold text-slate-600">{TEACHERS.length}</span> teachers</p>
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

          <div id="emptyState" className={`${mode==='empty' ? 'flex' : 'hidden'} flex-col items-center justify-center text-center py-20 px-6`}>
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-400 flex items-center justify-center mb-4">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
            </div>
            <p className="text-base font-bold text-slate-700">No teachers yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Add your first teacher to start assigning them to classes and subjects.</p>
            <div className="flex items-center gap-2.5 mt-5">
              <button className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Add teacher</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
