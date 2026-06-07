import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SearchableSelect from '../forms/SearchableSelect';

export interface DetailField {
  label: string;
  value: ReactNode;
}

export interface DetailSection {
  title: string;
  fields: DetailField[];
}

interface AssetDetailViewProps {
  title: string;
  breadcrumb?: { label: string; to?: string }[];
  /** Si se define, intercepta clics en migas con `to` (p. ej. confirmar cambios sin guardar). */
  onNavigateTo?: (to: string) => void;
  categoryFields?: { label: string; value: string; onChange?: (v: string) => void; options?: string[] }[];
  sections: DetailSection[];
  actions?: ReactNode;
}

export default function AssetDetailView({
  title,
  breadcrumb = [{ label: 'Dashboard', to: '/dashboard' }],
  onNavigateTo,
  categoryFields,
  sections,
  actions,
}: AssetDetailViewProps) {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl">
      <div>
        {breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-2 flex-wrap">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
                {item.to ? (
                  onNavigateTo ? (
                    <button
                      type="button"
                      onClick={() => onNavigateTo(item.to!)}
                      className="hover:text-navy-700 text-left"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link to={item.to} className="hover:text-navy-700">{item.label}</Link>
                  )
                ) : (
                  <span className="font-medium text-navy-800">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 font-display tracking-tight">{title}</h1>
      </div>

      {categoryFields && categoryFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {categoryFields.map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5">
                {f.label}
              </label>
              {f.onChange && f.options ? (
                <SearchableSelect
                  value={f.value}
                  onChange={(value) => f.onChange!(value)}
                  options={f.options}
                />
              ) : (
                <p className="text-sm font-medium text-navy-900 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
                  {f.value || '—'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {sections.map((section) => (
        <section
          key={section.title}
          className="bg-white rounded-xl border border-gray-200/80 shadow-sm"
        >
          <div className="px-5 py-3.5 border-b border-gray-100 bg-linear-to-r from-navy-50/80 to-white">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide">{section.title}</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
            {section.fields.map((field) => (
              <div key={field.label} className="relative overflow-visible">
                <p className="text-xs font-medium text-gray-500 mb-1">{field.label}</p>
                <div className="text-sm font-medium text-navy-900">{field.value ?? '—'}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {actions && (
        <div className="flex flex-wrap justify-end gap-3 pt-2">{actions}</div>
      )}
    </div>
  );
}
