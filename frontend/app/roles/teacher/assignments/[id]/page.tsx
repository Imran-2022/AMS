"use client";

export default function TeacherAssignmentDetailPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-3xl font-extrabold text-slate-800">Physics Assignment 1</h1>
                <span className="badge bg-emerald-50 text-emerald-600"><span className="badge-dot bg-emerald-500" />Published</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_340px] gap-5 items-start">
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="eyebrow mb-3">DESCRIPTION</p>
                <p className="text-sm text-slate-600 leading-relaxed">Complete this assignment within the given deadline. Show all working for full marks.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="eyebrow">ATTACHMENTS</p>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">Reference files students can download.</p>
                <div className="space-y-2.5">
                  <a href="#" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 truncate">lab_instructions.pdf</p>
                      <p className="text-[11px] text-slate-400">PDF · 1.2 MB</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </a>

                  <a href="#" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 truncate">answer_sheet_template.docx</p>
                      <p className="text-[11px] text-slate-400">DOCX · 340 KB</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </a>

                  <a href="#" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-700 truncate">circuit_diagram.jpg</p>
                      <p className="text-[11px] text-slate-400">JPG · 890 KB</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="eyebrow">PROGRESS</p>
                  <button className="text-xs font-semibold text-brand-600 hover:text-brand-700">View submissions →</button>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold text-slate-700">0 submitted</span>
                  <span className="text-slate-400">of 29 students</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill bg-slate-300" style={{ width: '0%' }} />
                </div>
                <p className="text-xs text-slate-400 mt-2">No submissions yet — nothing to grade until a student turns in work.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="eyebrow mb-3">CLASS</p>
                <p className="text-lg font-extrabold text-slate-800">Class 11 — A</p>
                <p className="text-sm text-slate-500 mt-0.5">Physics</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="eyebrow mb-3">DEADLINE</p>
                <p className="text-base font-bold text-slate-800">Aug 19, 2026 · 7:22 PM</p>
                <span className="badge bg-amber-50 text-amber-600 mt-2"><span className="badge-dot bg-amber-500" />Due in 9 days</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="eyebrow mb-3">MAX MARKS</p>
                <p className="text-2xl font-extrabold text-slate-800">35</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="eyebrow mb-3">SUBMISSION OPTIONS</p>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Allow late submission</span>
                    <span className="badge bg-slate-100 text-slate-500">No</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Allow resubmission</span>
                    <span className="badge bg-slate-100 text-slate-500">No</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
