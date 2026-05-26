import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ModulePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ModulePagination({ page, totalPages, onPageChange }: ModulePaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const current = Math.min(page, safeTotal);

  return (
    <div className="flex items-center justify-end gap-2 py-2">
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="text-sm font-medium text-navy-800 tabular-nums min-w-[4rem] text-center">
        {current}/{safeTotal}
      </span>
      <button
        type="button"
        disabled={current >= safeTotal}
        onClick={() => onPageChange(current + 1)}
        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Página siguiente"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
