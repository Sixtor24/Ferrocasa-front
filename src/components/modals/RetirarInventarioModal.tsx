import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

type RetirarInventarioModalProps = {
  open: boolean;
  onClose: () => void;
  assetLabel: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
};

export default function RetirarInventarioModal({
  open,
  onClose,
  assetLabel,
  onConfirm,
  loading = false,
}: RetirarInventarioModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Retirar de inventario"
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 border border-red-200 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? 'Retirando...' : 'Confirmar retiro'}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            ¿Confirma retirar <span className="font-semibold text-navy-900">{assetLabel}</span> del
            inventario activo?
          </p>
          <p className="text-gray-500">
            El ítem <strong>no se elimina</strong> de la base de datos: queda marcado como dado de baja
            con fecha de egreso de hoy y deja de contarse en el inventario activo. Puede revertirse
            editando el estado desde el listado si fue un error.
          </p>
        </div>
      </div>
    </Modal>
  );
}
