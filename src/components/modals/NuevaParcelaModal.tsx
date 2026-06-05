import { useEffect, useState } from 'react';
import CurrencyAmountInput from '../forms/CurrencyAmountInput';
import Modal from './Modal';
import ModalField from './ModalField';
import { ESTADOS_TRAMITE, ZONIFICACIONES } from '../../types/terreno';
import { parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';

export type ParcelaRegistroDraft = {
  key: string;
  identificacion: string;
  zona: string;
  zonificacion: string;
  ubicacionAdicional: string;
  areaTotalM2: number;
  valorAdquisicion: number;
  ciResponsable: string;
  observaciones: string;
  acreditacionTecnicaAmbiental: 'Sí' | 'No' | 'En trámite';
  levantamientoTopografico: 'Sí' | 'No' | 'En trámite';
};

type NuevaParcelaModalProps = {
  open: boolean;
  item: ParcelaRegistroDraft | null;
  onClose: () => void;
  onSave: (item: ParcelaRegistroDraft) => void;
  onDelete?: (key: string) => void;
};

function emptyParcela(): ParcelaRegistroDraft {
  return {
    key: `parcela-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    identificacion: '',
    zona: '',
    zonificacion: ZONIFICACIONES[0],
    ubicacionAdicional: '',
    areaTotalM2: 0,
    valorAdquisicion: 0,
    ciResponsable: '',
    observaciones: '',
    acreditacionTecnicaAmbiental: 'No',
    levantamientoTopografico: 'No',
  };
}

export default function NuevaParcelaModal({
  open,
  item,
  onClose,
  onSave,
  onDelete,
}: NuevaParcelaModalProps) {
  const [form, setForm] = useState<ParcelaRegistroDraft>(() => emptyParcela());
  const [areaDraft, setAreaDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) return;
    const next = item ? { ...item } : emptyParcela();
    setForm(next);
    setAreaDraft(next.areaTotalM2 > 0 ? String(next.areaTotalM2).replace('.', ',') : '');
    setErrors({});
  }, [open, item]);

  const updateForm = <K extends keyof ParcelaRegistroDraft>(key: K, value: ParcelaRegistroDraft[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.identificacion.trim()) next.identificacion = 'Indique la identificación';
    if (!form.zona.trim()) next.zona = 'Indique lote / manzana';
    if (!form.zonificacion.trim()) next.zonificacion = 'Seleccione la zonificación';
    if (!form.ubicacionAdicional.trim()) next.ubicacionAdicional = 'Indique la ubicación adicional';
    if (form.areaTotalM2 <= 0) next.areaTotalM2 = 'Indique el área total';
    if (form.valorAdquisicion < 0) next.valorAdquisicion = 'El valor no puede ser negativo';
    if (!form.ciResponsable.trim()) next.ciResponsable = 'Indique la CI del responsable';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      identificacion: form.identificacion.trim(),
      zona: form.zona.trim(),
      ubicacionAdicional: form.ubicacionAdicional.trim(),
      ciResponsable: form.ciResponsable.trim(),
      observaciones: form.observaciones.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Parcela' : 'Nueva Parcela'}
      maxWidth="2xl"
      zIndexClass="z-[60]"
      footer={
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(form.key);
                onClose();
              }}
              className="px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50"
            >
              Eliminar
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800"
          >
            {isEditing ? 'Guardar' : 'Agregar'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModalField label="Identificación *" error={errors.identificacion}>
            <input
              value={form.identificacion}
              onChange={(e) => updateForm('identificacion', e.target.value)}
              className="input-field"
            />
          </ModalField>
          <ModalField label="Lote / Manzana *" error={errors.zona}>
            <input
              value={form.zona}
              onChange={(e) => updateForm('zona', e.target.value)}
              className="input-field"
            />
          </ModalField>
          <ModalField label="Zonificación *" error={errors.zonificacion}>
            <select
              value={form.zonificacion}
              onChange={(e) => updateForm('zonificacion', e.target.value)}
              className="input-field"
            >
              {ZONIFICACIONES.map((zona) => (
                <option key={zona} value={zona}>
                  {zona}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="CI Responsable *" error={errors.ciResponsable}>
            <input
              value={form.ciResponsable}
              onChange={(e) => updateForm('ciResponsable', e.target.value)}
              className="input-field"
            />
          </ModalField>
          <ModalField label="Ubicación Adicional *" error={errors.ubicacionAdicional} className="md:col-span-2">
            <input
              value={form.ubicacionAdicional}
              onChange={(e) => updateForm('ubicacionAdicional', e.target.value)}
              placeholder="Sector, referencia o ubicación adicional"
              className="input-field"
            />
          </ModalField>
          <ModalField label="Área Total M² *" error={errors.areaTotalM2}>
            <input
              type="text"
              inputMode="decimal"
              value={areaDraft}
              onChange={(e) => {
                const next = sanitizeMontoDraft(e.target.value);
                setAreaDraft(next);
                updateForm('areaTotalM2', parseMontoInput(next));
              }}
              className="input-field"
            />
          </ModalField>
          <ModalField label="Valor de Adquisición">
            <CurrencyAmountInput
              value={form.valorAdquisicion}
              onChange={(value) => updateForm('valorAdquisicion', value)}
            />
          </ModalField>
          <ModalField label="Acreditación Técnica Ambiental">
            <select
              value={form.acreditacionTecnicaAmbiental}
              onChange={(e) =>
                updateForm('acreditacionTecnicaAmbiental', e.target.value as ParcelaRegistroDraft['acreditacionTecnicaAmbiental'])
              }
              className="input-field"
            >
              {ESTADOS_TRAMITE.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Levantamiento topográfico">
            <select
              value={form.levantamientoTopografico}
              onChange={(e) =>
                updateForm('levantamientoTopografico', e.target.value as ParcelaRegistroDraft['levantamientoTopografico'])
              }
              className="input-field"
            >
              {ESTADOS_TRAMITE.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Observaciones" className="md:col-span-2">
            <textarea
              value={form.observaciones}
              onChange={(e) => updateForm('observaciones', e.target.value)}
              className="input-field"
              rows={4}
            />
          </ModalField>
        </div>
      </div>
    </Modal>
  );
}
