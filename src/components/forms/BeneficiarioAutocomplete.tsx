import { useEffect, useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchBeneficiarios } from '../../api/services/beneficiarios.service';
import type { ApiBeneficiario } from '../../api/types';

type BeneficiarioAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minSearchLength?: number;
  'aria-label'?: string;
};

export default function BeneficiarioAutocomplete({
  value,
  onChange,
  placeholder = 'Nombre, cédula o BEN-0001',
  className = '',
  disabled = false,
  minSearchLength = 2,
  'aria-label': ariaLabel,
}: BeneficiarioAutocompleteProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ApiBeneficiario[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = value.trim();
  const canSearch = trimmed.length >= minSearchLength;

  useEffect(() => {
    if (disabled || !canSearch) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const { data } = await fetchBeneficiarios({ search: trimmed, limit: 10 });
        if (!cancelled) {
          setSuggestions(data);
          setActiveIndex(-1);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed, canSearch, disabled]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const showDropdown = open && canSearch && (loading || suggestions.length > 0);

  const selectSuggestion = (item: ApiBeneficiario) => {
    onChange(item.nombre);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-label={ariaLabel}
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? listboxId : undefined}
        aria-autocomplete="list"
        role="combobox"
        className="input-field disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      />

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-[60] mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Buscando beneficiarios...
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto py-1">
              {suggestions.map((item, index) => (
                <button
                  key={item.id_beneficiario}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion(item)}
                  className={`w-full px-3 py-2 text-left transition-colors ${
                    index === activeIndex
                      ? 'bg-navy-50 text-navy-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="block text-sm font-medium truncate">{item.nombre}</span>
                  <span className="block text-xs text-gray-500 truncate">{item.id_beneficiario}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
