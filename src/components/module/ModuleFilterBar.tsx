import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import SearchableSelect from '../forms/SearchableSelect';

export type FilterFieldType = 'text' | 'select' | 'search' | 'date';

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder?: string;
  className?: string;
}

interface ModuleFilterBarProps {
  fields: FilterField[];
  onClearFilters?: () => void;
  children?: ReactNode;
}

export default function ModuleFilterBar({ fields, onClearFilters, children }: ModuleFilterBarProps) {
  const showFooter = Boolean(onClearFilters || children);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) => (
          <div key={field.key} className={field.className}>
            <label className="filter-label">{field.label}</label>
            {field.type === 'select' ? (
              <SearchableSelect
                value={field.value}
                onChange={field.onChange}
                options={field.options ?? ['Todos']}
                placeholder={field.placeholder ?? 'Todos'}
              />
            ) : (
              <input
                type={field.type === 'date' ? 'date' : 'text'}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder ?? ''}
                className="input-field"
              />
            )}
          </div>
        ))}
      </div>
      {showFooter && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
          {onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-navy-800 transition-colors"
            >
              <RotateCcw size={14} aria-hidden />
              Limpiar filtros
            </button>
          ) : (
            <span />
          )}
          {children ? <div className="flex flex-wrap items-center justify-end gap-3 ml-auto">{children}</div> : null}
        </div>
      )}
    </div>
  );
}
