import type { ReactNode } from 'react';

const INPUT_CLASS = 'input-field max-w-full';

export function DetailReadOnly({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm font-medium text-navy-900 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-100">
      {children ?? '—'}
    </p>
  );
}

type DetailFieldInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export default function DetailFieldInput({
  value,
  onChange,
  disabled,
  placeholder,
  className = INPUT_CLASS,
}: DetailFieldInputProps) {
  if (disabled) {
    return <DetailReadOnly>{value.trim() || '—'}</DetailReadOnly>;
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
