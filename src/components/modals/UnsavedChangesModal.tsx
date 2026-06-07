import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

type UnsavedChangesModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Texto del recurso en edición (p. ej. "del bien", "de la parcela"). */
  subject?: string;
};

export default function UnsavedChangesModal({
  open,
  onClose,
  onConfirm,
  subject = 'de este registro',
}: UnsavedChangesModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cambios sin guardar"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Seguir editando
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 border border-red-200 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            Salir sin guardar
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700">
          {`Tiene cambios sin guardar en los detalles ${subject}. Si sale ahora, perderá esos cambios.`}
        </p>
      </div>
    </Modal>
  );
}
