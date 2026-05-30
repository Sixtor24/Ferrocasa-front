import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal';
import ModalField from './ModalField';
import {
  SEDES,
  CONDICIONES_FISICAS,
  ESTADOS_USO,
  CATEGORIAS_GENERALES,
  FORMAS_ADQUISICION,
  MONEDAS,
} from '../../types/bien';
import type { BienMueble } from '../../types/bien';
import { bienMuebleSchema } from '../../schemas/bien.schema';
import { validarConZod } from '../../utils/validators';

export type NuevoBienMueblePayload = Omit<
  BienMueble,
  'id' | 'fuenteRegistro' | 'estatusCarga' | 'creadoEn' | 'actualizadoEn'
>;

type NuevoBienMuebleModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (bien: NuevoBienMueblePayload) => void;
};

const initialForm = {
  sede: SEDES[0] as string,
  unidadAdministrativa: '',
  codigoInterno: '',
  sinCodigo: false,
  descripcion: '',
  formaAdquisicion: 'Compra' as string,
  fechaAdquisicion: '',
  numeroDocumento: '',
  moneda: 'Bs' as string,
  valorAdquisicion: '',
  estadoUso: 'En uso' as string,
  condicionFisica: 'Bueno' as string,
  marca: '',
  modelo: '',
  color: '',
  serial: '',
  sinSerial: false,
  categoriaGeneral: CATEGORIAS_GENERALES[0] as string,
  subcategoria: '',
  categoriaEspecifica: '',
  codigoCategoria: '',
  ubicacion: '',
  observaciones: '',
};

export default function NuevoBienMuebleModal({ open, onClose, onSubmit }: NuevoBienMuebleModalProps) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setErrors({});
    }
  }, [open]);

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = () => {
    const parsed = {
      ...form,
      valorAdquisicion: form.valorAdquisicion ? parseFloat(form.valorAdquisicion) : null,
    };
    const result = validarConZod(bienMuebleSchema, parsed);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    onSubmit({
      ...parsed,
      valorAdquisicion: parsed.valorAdquisicion,
      condicionFisica: parsed.condicionFisica as BienMueble['condicionFisica'],
      estadoUso: parsed.estadoUso as BienMueble['estadoUso'],
      formaAdquisicion: parsed.formaAdquisicion as BienMueble['formaAdquisicion'],
      moneda: parsed.moneda as BienMueble['moneda'],
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Bien Mueble">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Sede *" error={errors.sede}>
            <select value={form.sede} onChange={(e) => updateForm('sede', e.target.value)} className="input-field">
              {SEDES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Unidad administrativa *" error={errors.unidadAdministrativa}>
            <input
              value={form.unidadAdministrativa}
              onChange={(e) => updateForm('unidadAdministrativa', e.target.value)}
              className="input-field"
            />
          </ModalField>
        </div>
        <ModalField label="Código interno *" error={errors.codigoInterno}>
          <div className="flex items-center gap-3">
            <input
              value={form.codigoInterno}
              onChange={(e) => updateForm('codigoInterno', e.target.value)}
              className="input-field flex-1"
              disabled={form.sinCodigo}
              placeholder="BM-013"
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={form.sinCodigo}
                onChange={(e) => {
                  updateForm('sinCodigo', e.target.checked);
                  if (e.target.checked) updateForm('codigoInterno', 'S/C');
                }}
                className="rounded"
              />
              Sin código
            </label>
          </div>
        </ModalField>
        <ModalField label="Descripción *" error={errors.descripcion}>
          <input
            value={form.descripcion}
            onChange={(e) => updateForm('descripcion', e.target.value)}
            className="input-field"
            placeholder="Ej: Escritorio ejecutivo en madera"
          />
        </ModalField>
        <div className="grid grid-cols-3 gap-3">
          <ModalField label="Marca *" error={errors.marca}>
            <input value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Modelo" error={errors.modelo}>
            <input value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Color" error={errors.color}>
            <input value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="input-field" />
          </ModalField>
        </div>
        <ModalField label="Serial" error={errors.serial}>
          <div className="flex items-center gap-3">
            <input
              value={form.serial}
              onChange={(e) => updateForm('serial', e.target.value)}
              className="input-field flex-1"
              disabled={form.sinSerial}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={form.sinSerial}
                onChange={(e) => updateForm('sinSerial', e.target.checked)}
                className="rounded"
              />
              Sin serial
            </label>
          </div>
        </ModalField>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Condición física *" error={errors.condicionFisica}>
            <select
              value={form.condicionFisica}
              onChange={(e) => updateForm('condicionFisica', e.target.value)}
              className="input-field"
            >
              {CONDICIONES_FISICAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Estado de uso *" error={errors.estadoUso}>
            <select value={form.estadoUso} onChange={(e) => updateForm('estadoUso', e.target.value)} className="input-field">
              {ESTADOS_USO.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </ModalField>
        </div>
        <ModalField label="Categoría general *" error={errors.categoriaGeneral}>
          <select
            value={form.categoriaGeneral}
            onChange={(e) => updateForm('categoriaGeneral', e.target.value)}
            className="input-field"
          >
            {CATEGORIAS_GENERALES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </ModalField>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Forma de adquisición" error={errors.formaAdquisicion}>
            <select
              value={form.formaAdquisicion}
              onChange={(e) => updateForm('formaAdquisicion', e.target.value)}
              className="input-field"
            >
              {FORMAS_ADQUISICION.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Moneda" error={errors.moneda}>
            <select value={form.moneda} onChange={(e) => updateForm('moneda', e.target.value)} className="input-field">
              {MONEDAS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Valor de adquisición" error={errors.valorAdquisicion}>
            <input
              type="number"
              value={form.valorAdquisicion}
              onChange={(e) => updateForm('valorAdquisicion', e.target.value)}
              className="input-field"
              placeholder="0.00"
            />
          </ModalField>
          <ModalField label="Ubicación *" error={errors.ubicacion}>
            <input
              value={form.ubicacion}
              onChange={(e) => updateForm('ubicacion', e.target.value)}
              className="input-field"
              placeholder="Piso 3, Oficina 301"
            />
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
          Registrar Bien Mueble
        </button>
      </div>
    </Modal>
  );
}
