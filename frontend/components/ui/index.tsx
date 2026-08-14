import React from 'react';
import { ROLE } from '@/shared/constants/roles';
export { Button } from './Button';
export { FileUpload } from './FileUpload';
export { UserFormModal } from './UserFormModal';
export { TeacherAssignmentModal } from '../roles/admin/shared/TeacherAssignmentModal';
export { Modal } from './Modal';
export { AmsDeleteComfiramtionModal } from './AmsDeleteComfiramtionModal';
export { AmsPermissionConfirmationModal } from './AmsPermissionConfirmationModal';

export function Pill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${className}`}>
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: keyof typeof ROLE }) {
  const c = ROLE[role] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {role}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    Draft: 'bg-slate-100 text-slate-700 border border-slate-200',
    Published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
    Late: 'bg-amber-50 text-amber-700 border border-amber-200',
    UnderReview: 'bg-purple-50 text-purple-700 border border-purple-200',
    ResubmissionRequested: 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse',
    Resubmitted: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    Graded: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold',
  };

  const style = statusStyles[status] || 'bg-slate-100 text-slate-700 border border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-sm rounded-2xl p-6 transition-all duration-200 hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function Metric({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-bold font-mono text-slate-900 tabular-nums tracking-tight group-hover:scale-[1.02] transition-transform origin-left">
            {value}
          </p>
          {sub && <p className="mt-1.5 text-xs text-slate-400 font-medium">{sub}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3.5 border-b-2 border-slate-200 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`py-4 border-b border-slate-100 text-sm text-slate-700 font-medium ${className}`}>{children}</td>;
}

export { AmsPagination } from './AmsPagination';

export function PageHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        {eyebrow && <p className="text-xs font-bold text-indigo-600 uppercase mb-1">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
}

export { ToastContainer, emitToast } from './Toast';
