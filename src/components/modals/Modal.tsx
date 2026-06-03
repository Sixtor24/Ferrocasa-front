import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'md' | 'lg' | '2xl' | '6xl';
  footer?: ReactNode;
  /** Clase z-index para modales anidados (ej. z-[60]) */
  zIndexClass?: string;
};

const maxWidthClass = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  '2xl': 'max-w-2xl',
  '6xl': 'max-w-6xl',
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  footer,
  zIndexClass = 'z-50',
}: ModalProps) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 ${zIndexClass}`}>
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClass[maxWidth]} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <h3 id="modal-title" className="text-lg font-bold text-navy-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="p-6 pt-0 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
