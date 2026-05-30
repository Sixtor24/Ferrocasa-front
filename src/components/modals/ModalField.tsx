import type { ReactNode } from 'react';
import { XCircle } from 'lucide-react';

type ModalFieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export default function ModalField({ label, error, children }: ModalFieldProps) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <XCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}
