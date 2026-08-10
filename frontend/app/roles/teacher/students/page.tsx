"use client"

import { useEffect, useMemo, useState } from "react"
import { getAssignments, getSubmissions, API_BASE_URL } from '@/lib/api'
import { getEnrollments } from '@/lib/api/enrollments'
import { getClassCourses } from '@/lib/api'

type StudentRow = {
  id: string
  initials: string
  name: string
  cls: string
  className: string
  section: string
  parentContact: string
  avatarUrl: string
  average: string
  lastSubmission: string
  color: string
  isActive: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function getColorKey(name: string) {
  const colors = ['brand', 'amber', 'violet', 'rose', 'sky', 'emerald'] as const
  const index = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

export default function StudentsPage(){
  const [rows, setRows] = useState<StudentRow[]>([])
  const [filterClass, setFilterClass] = useState<string>('')
  const [filterSection, setFilterSection] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [selected, setSelected] = useState<StudentRow | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStudents() {
      setIsLoading(true)
      setError(null)
      try {
        console.debug('[StudentsPage] API_BASE_URL=', API_BASE_URL)
        console.debug('[StudentsPage] loading enrollments, classes, assignments, and submissions')

        const [enrollments, classCourses, assignments, submissions] = await Promise.all([
          getEnrollments(),
          getClassCourses(),
          getAssignments(),
          getSubmissions(),
        ])

        const classMap = new Map(classCourses.map((course) => [course.id, course]))
        const teacherAssignmentIds = new Set(assignments.map((assignment) => assignment.id))

        const studentRows = enrollments.map((enrollment) => {
          const course = classMap.get(enrollment.classCourseId)
          const name = enrollment.studentName ?? 'Unknown student'
          const className = course?.name ?? enrollment.classCourseName ?? 'Unassigned'
          const section = course?.section ?? ''
          const cls = section ? `${className} - ${section}` : className
          const studentSubmissions = submissions.filter((submission) => submission.studentId === enrollment.studentId && teacherAssignmentIds.has(submission.assignmentId))
          const graded = studentSubmissions.filter((submission) => submission.status === 'Graded' && typeof submission.marks === 'number' && submission.maxMarks)
          const average = graded.length
            ? `${Math.round((graded.reduce((total, submission) => total + ((submission.marks ?? 0) / (submission.maxMarks ?? 1)) * 100, 0) / graded.length))}%`
            : '—'
          const latest = studentSubmissions
            .map((submission) => new Date(submission.submittedAt))
            .sort((left, right) => right.getTime() - left.getTime())[0]

          return {
            id: `${enrollment.studentId}-${enrollment.classCourseId}`,
            initials: getInitials(name),
            name,
            cls,
            className,
            section,
            parentContact: enrollment.parentMobile || enrollment.phoneNumber || '—',
            avatarUrl: enrollment.avatarUrl
              ? (enrollment.avatarUrl.startsWith('http') ? enrollment.avatarUrl : `${API_BASE_URL}${enrollment.avatarUrl}`)
              : '',
            average,
            lastSubmission: latest ? latest.toLocaleDateString() : '—',
            color: getColorKey(name),
            isActive: enrollment.isActive,
          }
        })

        setRows(studentRows)
      } catch (err) {
        console.error('[StudentsPage] loadStudents error:', err)
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg || 'Unable to load student data.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadStudents()
  }, [])

  const sections = useMemo(() => {
    const filtered = rows.filter((row) => !filterClass || row.className === filterClass)
    return Array.from(new Set(filtered.map((row) => row.section).filter(Boolean)))
  }, [filterClass, rows])

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchClass = !filterClass || row.className === filterClass
      const matchSection = !filterSection || row.section === filterSection
      const matchQuery = !query || row.name.toLowerCase().includes(query.toLowerCase())
      return matchClass && matchSection && matchQuery
    })
  }, [filterClass, filterSection, query, rows])

  const totalStudents = filteredRows.length
  const classCounts = Array.from(new Set(rows.map((row) => row.className))).map((className) => ({
    className,
    count: filteredRows.filter((row) => row.className === className).length,
  }))
  const needsAttention = filteredRows.filter((row) => !row.isActive).length

  const colorMap: Record<string,{bg:string;text:string}> = {
    brand:{bg:'bg-brand-100 text-brand-700', text:''},
    amber:{bg:'bg-amber-100 text-amber-700', text:''},
    violet:{bg:'bg-violet-100 text-violet-700', text:''},
    rose:{bg:'bg-rose-100 text-rose-700', text:''},
    sky:{bg:'bg-sky-100 text-sky-700', text:''},
    emerald:{bg:'bg-emerald-100 text-emerald-700', text:''},
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold text-[#7C3AED]">TEACHER PORTAL</p>
        <h1 className="text-3xl font-extrabold text-slate-800 mt-0.5">Students</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400">TOTAL STUDENTS</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z"/><path d="M7 20c0-2.76 2.24-5 5-5s5 2.24 5 5"/></svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{isLoading ? '—' : rows.length}</p>
          <p className="mt-1 text-xs text-slate-400">Across your classes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400">{isLoading ? 'CLASS' : (classCounts[0]?.className ?? 'NO CLASS')}</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h18"/><path d="M12 4v16"/><path d="M6 11h12"/></svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{isLoading ? '—' : (classCounts[0]?.count ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">Students in this class</p>
        </div>
        {classCounts[1] || isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400">{isLoading ? 'CLASS' : classCounts[1]?.className}</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19h16"/><path d="M5 15h14"/><path d="M7 11h10"/></svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{isLoading ? '—' : (classCounts[1]?.count ?? 0)}</p>
          <p className="mt-1 text-xs text-slate-400">Students in this class</p>
        </div> : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400">NEEDS ATTENTION</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4"/><path d="M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{isLoading ? '—' : needsAttention}</p>
          <p className="mt-1 text-xs text-slate-400">Students requiring follow-up</p>
        </div>
      </div>

      <div className="bg-[#F5F3FF] border border-[#EDE9FE] rounded-2xl px-5 py-3.5 flex items-center gap-3">
        <svg className="w-5 h-5 text-[#7C3AED] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <div>
          <p className="text-sm font-semibold text-slate-900">Student roster overview</p>
          <p className="text-xs text-[#6D28D9]">This is a read-only view of students in your classes. To add, edit, or transfer a student, contact your school administrator.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <select value={filterClass} onChange={e=>{ setFilterClass(e.target.value); setFilterSection('') }} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 bg-white">
            <option value="">All classes</option>
            {Array.from(new Set(rows.map((row) => row.className))).map((className) => <option key={className} value={className}>{className}</option>)}
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
              <th className="px-5 py-3.5 text-[11px] font-bold text-slate-400">STUDENT</th>
              <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">CLASS</th>
              <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">PARENT CONTACT</th>
              <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">AVG. IN YOUR SUBJECTS</th>
              <th className="px-2 py-3.5 text-[11px] font-bold text-slate-400">LAST SUBMISSION</th>
              <th className="w-20 px-5 py-3.5 text-right text-[11px] font-bold text-slate-400">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-500">
                  {isLoading ? 'Loading students…' : error ? error : 'No students found for the selected filters.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {row.avatarUrl ? (
                        <img
                          src={row.avatarUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            event.currentTarget.nextElementSibling?.removeAttribute('hidden');
                          }}
                        />
                      ) : null}
                      <div hidden={Boolean(row.avatarUrl)} className={`w-8 h-8 rounded-full ${colorMap[row.color]?.bg} flex items-center justify-center text-xs font-bold text-brand-700 shrink-0`}>
                        {row.initials}
                      </div>
                      <span className="font-semibold text-slate-700">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-slate-500">{row.cls}</td>
                  <td className="px-2 py-3.5 text-slate-500">{row.parentContact}</td>
                  <td className="px-2 py-3.5 text-slate-500">{row.average}</td>
                  <td className="px-2 py-3.5 text-slate-500">{row.lastSubmission}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setSelected(row)} className="px-4 py-1.5 rounded border cursor-pointer border-slate-200 text-white text-xs font-semibold bg-brand-600 hover:bg-brand-700">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">Showing <span className="font-semibold text-slate-600">{filteredRows.length}</span> students</p>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-slate-950/30">
          <div className="bg-white rounded w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                {selected.avatarUrl ? (
                  <img
                    src={selected.avatarUrl}
                    alt={selected.name}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      event.currentTarget.nextElementSibling?.removeAttribute('hidden');
                    }}
                  />
                ) : null}
                <div hidden={Boolean(selected.avatarUrl)} className={`w-12 h-12 rounded-full ${colorMap[selected.color]?.bg} flex items-center justify-center text-sm font-bold text-brand-700 shrink-0`}>
                  {selected.initials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{selected.name}</h2>
                  <p className="text-sm text-slate-400">{selected.cls}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="overflow-y-auto px-7 py-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">PARENT CONTACT</p>
                  <p className="text-sm text-slate-600">{selected.parentContact}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 mb-2">STATUS</p>
                  <p className="text-sm text-slate-600">{selected.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">CLASS</p>
                <p className="text-sm text-slate-600">{selected.cls}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2">NOTE</p>
                <p className="text-sm text-slate-500">Student details are loaded from your school data. Contact the administrator to update class assignments or parent contact details.</p>
              </div>
            </div>
            <div className="flex items-center justify-end px-7 py-5 border-t border-slate-100 bg-slate-50/60">
              <button onClick={() => setSelected(null)} className="px-10 py-2.5 rounded border border-slate-200 cursor-pointer bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
