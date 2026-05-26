import type { ReactNode } from 'react';

export type FilterFieldType = 'text' | 'select' | 'search';

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
  children?: ReactNode;
}

export default function ModuleFilterBar({ fields, children }: ModuleFilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) => (
          <div key={field.key} className={field.className}>
            <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5">
              {field.label}
            </label>
            {field.type === 'select' ? (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="input-field"
              >
                {(field.options ?? ['Todos']).map((opt) => (
                  <option key={opt} value={opt === 'Todos' || opt === 'Todas' ? '' : opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder ?? ''}
                className="input-field"
              />
            )}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}
