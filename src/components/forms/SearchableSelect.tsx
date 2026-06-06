import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

type SearchableSelectOption = {
  label: string;
  value: string;
};

type SearchableSelectProps = {
  value: string;
  options: ReadonlyArray<string | SearchableSelectOption>;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  minSearchLength?: number;
  /** Oculta el buscador en listas cortas (p. ej. estado de uso). */
  disableSearch?: boolean;
  'aria-label'?: string;
};

function normalizeOption(option: string | SearchableSelectOption): SearchableSelectOption {
  if (typeof option === 'string') {
    return {
      label: option,
      value: option === 'Todos' || option === 'Todas' ? '' : option,
    };
  }
  return option;
}

export default function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Seleccionar',
  searchPlaceholder = 'Escriba mínimo 3 caracteres...',
  className = '',
  disabled = false,
  minSearchLength = 3,
  disableSearch = false,
  'aria-label': ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const selected = normalizedOptions.find((option) => option.value === value);
  const trimmedSearch = search.trim().toLowerCase();

  const showSearch = !disableSearch && normalizedOptions.length > 6;

  const visibleOptions = useMemo(() => {
    if (!showSearch) return normalizedOptions;
    if (trimmedSearch.length > 0 && trimmedSearch.length < minSearchLength) return normalizedOptions;
    if (trimmedSearch.length >= minSearchLength) {
      return normalizedOptions.filter((option) => option.label.toLowerCase().includes(trimmedSearch));
    }
    return normalizedOptions;
  }, [minSearchLength, normalizedOptions, showSearch, trimmedSearch]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="input-field flex items-center justify-between gap-2 text-left disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={selected ? 'truncate' : 'truncate text-gray-400'}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-[60] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {showSearch && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-3 text-sm outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-100"
                  autoFocus
                />
              </div>
              {trimmedSearch.length > 0 && trimmedSearch.length < minSearchLength && (
                <p className="mt-1 text-[11px] text-gray-500">Escriba al menos {minSearchLength} caracteres para filtrar.</p>
              )}
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1" role="listbox">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
                <button
                  key={`${option.value}-${option.label}`}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    option.value === value
                      ? 'bg-navy-50 text-navy-900 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-sm text-gray-500">Sin coincidencias.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
