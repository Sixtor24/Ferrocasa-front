import { useEffect, useRef, useState } from 'react';
import { PLACEHOLDER_PRECIO } from '../../constants/ui';
import { formatMontoInput, parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';

type CurrencyAmountInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  id?: string;
};

/** Monto editable con borrador de texto (permite vaciar y reescribir sin forzar 0 al instante). */
export default function CurrencyAmountInput({
  value,
  onChange,
  className = 'input-field',
  id,
}: CurrencyAmountInputProps) {
  const [draft, setDraft] = useState(() => formatMontoInput(value));
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) setDraft(formatMontoInput(value));
  }, [value]);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={PLACEHOLDER_PRECIO}
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onChange={(e) => {
        const next = sanitizeMontoDraft(e.target.value);
        setDraft(next);
        onChange(parseMontoInput(next));
      }}
      onBlur={() => {
        isFocusedRef.current = false;
        setDraft((current) => {
          const cleaned = sanitizeMontoDraft(current);
          return cleaned.endsWith(',') ? cleaned.slice(0, -1) : cleaned;
        });
      }}
      className={className}
    />
  );
}
