'use client';

import * as React from 'react';

type AmsDeleteComfiramtionModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  cancelLabel?: string;
  children?: React.ReactNode;
};

export function AmsDeleteComfiramtionModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  cancelLabel = 'Cancel',
  children,
}: AmsDeleteComfiramtionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded w-full max-w-sm shadow-2xl p-7 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">{title}</h3>
        {description ? <p className="text-sm text-slate-500 mt-1.5">{description}</p> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded text-white text-sm font-semibold cursor-pointer ${
              confirmVariant === 'primary' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
