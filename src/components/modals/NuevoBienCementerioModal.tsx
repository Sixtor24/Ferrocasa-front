import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal';
import ModalField from './ModalField';
import { AREAS_CEMENTERIO, ESTADOS_BIEN_CEMENTERIO } from '../../types/cementerio';
import type { InventarioCementerio } from '../../types/cementerio';
import { inventarioCementerioSchema } from '../../schemas/cementerio.schema';
import { validarConZod } from '../../utils/validators';

export type NuevoBienCementerioForm = {
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  color: string;
  serial: string;
  estadoBien: InventarioCementerio['estadoBien'];
  area: InventarioCementerio['area'];
  observaciones: string;
};

type NuevoBienCementerioModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: NuevoBienCementerioForm) => void;
};

const initialForm = {
  codigo: '',
  descripcion: '',
  marca: '',
  modelo: '',
  color: '',
  serial: '',
  estadoBien: 'Bueno' as InventarioCementerio['estadoBien'],
  area: AREAS_CEMENTERIO[0] as InventarioCementerio['area'],
  observaciones: '',
};

export default function NuevoBienCementerioModal({ open, onClose, onSubmit }: NuevoBienCementerioModalProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
    }
  }, [open]);

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = () => {
    const result = validarConZod(inventarioCementerioSchema, form);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    onSubmit({
      ...form,
      estadoBien: form.estadoBien as InventarioCementerio['estadoBien'],
      area: form.area as InventarioCementerio['area'],
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Bien — Cementerio" maxWidth="md">
      <div className="space-y-4">
        <ModalField label="Código *" error={errors.codigo}>
          <input
            value={form.codigo}
            onChange={(e) => updateForm('codigo', e.target.value)}
            className="input-field"
            placeholder="CEM-016"
          />
        </ModalField>
        <ModalField label="Descripción *" error={errors.descripcion}>
          <input
            value={form.descripcion}
            onChange={(e) => updateForm('descripcion', e.target.value)}
            className="input-field"
          />
        </ModalField>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Marca *" error={errors.marca}>
            <input value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Modelo" error={errors.modelo}>
            <input value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} className="input-field" />
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Color" error={errors.color}>
            <input value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Serial" error={errors.serial}>
            <input value={form.serial} onChange={(e) => updateForm('serial', e.target.value)} className="input-field" />
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Estado del bien *" error={errors.estadoBien}>
            <select
              value={form.estadoBien}
              onChange={(e) => updateForm('estadoBien', e.target.value)}
              className="input-field"
            >
              {ESTADOS_BIEN_CEMENTERIO.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Área *" error={errors.area}>
            <select value={form.area} onChange={(e) => updateForm('area', e.target.value)} className="input-field">
              {AREAS_CEMENTERIO.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </ModalField>
        </div>
        <ModalField label="Observaciones" error={errors.observaciones}>
          <textarea
            value={form.observaciones}
            onChange={(e) => updateForm('observaciones', e.target.value)}
            className="input-field"
            rows={2}
          />
        </ModalField>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Registrar Bien
        </button>
      </div>
    </Modal>
  );
}
