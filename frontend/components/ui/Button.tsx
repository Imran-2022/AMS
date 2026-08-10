'use client';

import React from 'react';

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles: Record<string, string> = {
    primary: 'bg-brand-600 text-white shadow-md shadow-brand-200 hover:bg-brand-700 active:scale-[0.98]',
    secondary: 'bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50 active:scale-[0.98]',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-600 text-white shadow-md shadow-rose-200 hover:bg-rose-700 active:scale-[0.98]',
  };

  return (
    <button className={` cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
