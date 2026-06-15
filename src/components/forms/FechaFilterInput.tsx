import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { toIsoDate } from '../../api/mappers/enums';
import { isoDateToDisplay } from '../../utils/formatters';

type FechaFilterInputProps = {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
};

export default function FechaFilterInput({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
}: FechaFilterInputProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => isoDateToDisplay(value));

  useEffect(() => {
    setDraft(isoDateToDisplay(value));
  }, [value]);

  const commitDraft = () => {
    if (!draft.trim()) {
      onChange('');
      return;
    }

    const iso = toIsoDate(draft);
    if (iso) {
      onChange(iso);
      setDraft(isoDateToDisplay(iso));
      return;
    }

    setDraft(isoDateToDisplay(value));
  };

  const openCalendar = () => {
    const input = dateRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.click();
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="input-field pr-10"
      />
      <button
        type="button"
        onClick={openCalendar}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700"
        aria-label="Abrir calendario"
      >
        <Calendar size={16} />
      </button>
      <input
        ref={dateRef}
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
