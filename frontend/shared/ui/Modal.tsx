'use client';

import * as React from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className = '',
}: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-3xl max-h-[90vh] min-h-0 overflow-hidden rounded bg-white shadow-2xl ${className}`}>
        <div className="flex h-full flex-col min-h-0">
          <div className="flex-shrink-0 flex items-start justify-between gap-4 border-b border-slate-100 px-7 pt-6 pb-5">
            <div>
              {title && <h2 className="text-xl font-extrabold text-slate-800">{title}</h2>}
              {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">{children}</div>
          {footer && (
            <div className="sticky bottom-0 z-10 shrink-0 rounded-b-3xl border-t border-slate-100 bg-slate-50/90 px-7 py-5 backdrop-blur-sm">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
