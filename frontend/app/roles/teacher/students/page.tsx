"use client"
import { useMemo, useState } from "react"

type Profile = {
  key: string
  name: string
  cls: string
  contact: string
  color: string
  perf: { s: string; v: string }[]
  recent: { a: string; v?: string }[]
}

const TEACHING_MAP: Record<string, string[]> = { '9': ['A'], '10': ['B'] }

const PROFILES: Record<string, Profile> = {
  AR: { key:'AR', name:'Ayesha Rahman', cls:'Class 9 - A', contact:'+880 1711-223344', color:'brand', perf:[{s:'Mathematics',v:'84%'},{s:'Physics',v:'—'}], recent:[{a:'Algebraic Expressions — Set 4',v:'Submitted · pending review'}] },
  KH: { key:'KH', name:'Karim Hasan', cls:'Class 9 - A', contact:'+880 1822-556677', color:'amber', perf:[{s:'Mathematics',v:'—'},{s:'Physics',v:'78%'}], recent:[{a:'Algebraic Expressions — Set 4',v:'Submitted late · pending review'}] },
  SA: { key:'SA', name:'Sadia Akter', cls:'Class 9 - A', contact:'+880 1733-112200', color:'violet', perf:[{s:'Mathematics',v:'90%'},{s:'Physics',v:'88%'}], recent:[{a:'Algebraic Expressions — Set 4',v:'Submitted · pending review'}] },
  TI: { key:'TI', name:'Tanvir Islam', cls:'Class 9 - A', contact:'+880 1611-990022', color:'rose', perf:[{s:'Mathematics',v:'—'},{s:'Physics',v:'—'}], recent:[{a:"Newton's Laws Lab Report",v:'Missing — past deadline'}] },
  NF: { key:'NF', name:'Nusrat Farah', cls:'Class 10 - B', contact:'+880 1955-887766', color:'sky', perf:[{s:'Mathematics',v:'—'}], recent:[{a:'No assignments published yet'}] },
  RM: { key:'RM', name:'Rafiq Mia', cls:'Class 10 - B', contact:'+880 1544-330011', color:'emerald', perf:[{s:'Mathematics',v:'—'}], recent:[{a:'No assignments published yet'}] },
}

const DATA = Object.values(PROFILES)

export default function StudentsPage(){
  const [filterClass, setFilterClass] = useState<string>('')
  const [filterSection, setFilterSection] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [selected, setSelected] = useState<Profile | null>(null)

  const sections = useMemo(()=> filterClass ? TEACHING_MAP[filterClass] ?? [] : [], [filterClass])

  const rows = useMemo(()=> {
    return DATA.filter(p => {
      const matchClass = !filterClass || p.cls.startsWith(`Class ${filterClass}`)
      const matchSection = !filterSection || p.cls.endsWith(filterSection)
      const matchQuery = !query || p.name.toLowerCase().includes(query.toLowerCase())
      return matchClass && matchSection && matchQuery
    })
  }, [filterClass, filterSection, query])

  const colorMap: Record<string,{bg:string;text:string}> = {
    brand:{bg:'bg-brand-100 text-brand-700', text:''},
    amber:{bg:'bg-amber-100 text-amber-700', text:''},
    violet:{bg:'bg-violet-100 text-violet-700', text:''},
    rose:{bg:'bg-rose-100 text-rose-700', text:''},
    sky:{bg:'bg-sky-100 text-sky-700', text:''},
    emerald:{bg:'bg-emerald-100 text-emerald-700', text:''},
  }

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <div className="flex h-screen overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-100 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#6D28D9] flex items-center justify-center text-white font-bold text-sm">AM</div>
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-slate-800">AMS School</p>
              <p className="text-[11px] text-slate-400">Education management</p>
            </div>
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-sm">Dashboard</a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-sm">My Classes</a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-sm">Assignments</a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F5F3FF] text-[#7C3AED] font-semibold text-sm">Students</a>
          </nav>
          <div className="border-t border-slate-100 p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-xs font-bold shrink-0">RI</div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-slate-800">Rafiul Islam</p>
              <p className="text-[11px] text-slate-400">3 classes · 2 subjects</p>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div>
              <p className="text-[11px] font-semibold text-[#7C3AED] tracking-wide">TEACHER / STUDENTS</p>
              <p className="text-sm text-slate-400">View students across your classes</p>
            </div>
            <button className="relative w-9 h-9 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-500">
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-[#7C3AED]">TEACHER PORTAL</p>
              <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Students</h1>
            </div>

            <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-2xl px-5 py-3.5 flex items-center gap-3">
              <svg className="w-5 h-5 text-[#7C3AED] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p className="text-xs text-[#6D28D9]">This is a read-only view of students in your classes. To add, edit, or transfer a student, contact your school administrator.</p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold tracking-widest text-slate-400">TOTAL STUDENTS</p>
                </div>
                <p className="text-2xl font-extrabold text-slate-800">58</p>
                <p className="text-xs text-slate-400 mt-1">Across your 2 classes</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl font-extrabold text-slate-800">32</p>
                <p className="text-xs text-slate-400 mt-1">Class 9 - A</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl font-extrabold text-slate-800">26</p>
                <p className="text-xs text-slate-400 mt-1">Class 10 - B</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-2xl font-extrabold text-slate-800">2</p>
                <p className="text-xs text-slate-400 mt-1">Needs attention</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <select value={filterClass} onChange={e=>{ setFilterClass(e.target.value); setFilterSection('') }} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
                  <option value="">All classes</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                </select>
                <select value={filterSection} onChange={e=>setFilterSection(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
                  <option value="">All sections</option>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="relative max-w-xs">
                <input value={query} onChange={e=>setQuery(e.target.value)} type="text" placeholder="Search students…" className="pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#7C3AED] w-56" />
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">STUDENT</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">CLASS</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">PARENT CONTACT</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">AVG. IN YOUR SUBJECTS</th>
                    <th className="px-2 py-3.5 text-[11px] font-bold tracking-widest text-slate-400">LAST SUBMISSION</th>
                    <th className="w-20 px-5 py-3.5 text-right text-[11px] font-bold tracking-widest text-slate-400">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(r => (
                    <tr key={r.key} className="stu-row" data-class={r.cls.split(' ')[1]} data-section={r.cls.split(' - ')[1]}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const c = colorMap[r.color] ?? {bg:'bg-slate-100 text-slate-700', text:''}
                            return <div className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-xs font-bold shrink-0`}>{r.key}</div>
                          })()}
                          <span className="font-semibold text-slate-700">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3.5 text-slate-500">{r.cls}</td>
                      <td className="px-2 py-3.5 text-slate-500">{r.contact}</td>
                      <td className="px-2 py-3.5 font-semibold text-slate-700">{r.perf[0]?.v ?? '—'}</td>
                      <td className="px-2 py-3.5 text-slate-500">{r.recent[0]?.v ? 'Aug 9, 2026' : '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={()=>setSelected(r)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-600">1–{rows.length}</span> of <span className="font-semibold text-slate-600">58</span> students</p>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center" disabled>{'<'}</button>
                  <span className="w-8 h-8 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold flex items-center justify-center">1</span>
                  <span className="w-8 h-8 rounded-lg text-slate-500 text-xs font-semibold flex items-center justify-center hover:bg-slate-50">2</span>
                  <button className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50">{'>'}</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {selected && (
        <div id="profileModal" className="fixed inset-0 flex items-center justify-center modal-backdrop z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                {(() => {
                  const c = colorMap[selected.color] ?? {bg:'bg-slate-100 text-slate-700', text:''}
                  return <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center text-sm font-bold shrink-0`}>{selected.key}</div>
                })()}
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{selected.name}</h2>
                  <p className="text-sm text-slate-400">{selected.cls}</p>
                </div>
              </div>
              <button onClick={()=>setSelected(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="overflow-y-auto px-7 py-6 space-y-5">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">CONTACT</p>
                <p className="text-sm text-slate-600">{selected.contact}</p>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">PERFORMANCE IN YOUR SUBJECTS</p>
                <div className="space-y-2">
                  {selected.perf.map((x,i)=> (
                    <div key={i} className="flex items-center justify-between border border-slate-100 rounded-lg px-3.5 py-2.5">
                      <span className="text-sm text-slate-600">{x.s}</span>
                      <span className={`text-sm font-semibold ${x.v==='—' ? 'text-slate-400' : 'text-slate-800'}`}>{x.v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 mb-2">RECENT SUBMISSIONS</p>
                <div className="space-y-2">
                  {selected.recent.map((x,i)=> (
                    <div key={i} className="border border-slate-100 rounded-lg px-3.5 py-2.5">
                      <p className="text-sm text-slate-700">{x.a}</p>
                      {x.v && <p className="text-xs text-slate-400 mt-0.5">{x.v}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end px-7 py-5 border-t border-slate-100 bg-slate-50/60 rounded-b-3xl shrink-0">
              <button onClick={()=>setSelected(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
