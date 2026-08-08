import React from 'react';

type AmsPaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  label?: string;
  itemLabel?: string;
};

export function AmsPagination({
  currentPage,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  label = 'Showing',
  itemLabel = 'items',
}: AmsPaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const firstItem = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const lastItem = Math.min(totalItems, currentPage * pageSize + pageSize);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        {label} <span className="font-semibold text-slate-600">{firstItem}–{lastItem}</span> of <span className="font-semibold text-slate-600">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        ) : null}

        <button
          type="button"
          disabled={currentPage === 0}
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <span className="inline-flex h-8 min-w-[36px] items-center justify-center rounded-lg bg-brand-600 px-3 text-xs font-semibold text-white">
          {currentPage + 1}
        </span>

        <button
          type="button"
          disabled={currentPage >= pageCount - 1}
          onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
