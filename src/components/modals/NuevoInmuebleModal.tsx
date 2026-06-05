import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Modal from './Modal';
import { PLACEHOLDER_AREA, PLACEHOLDER_PRECIO } from '../../constants/ui';
import { parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';
import ModalField from './ModalField';
import { ESTADOS_OCUPACION, ZONIFICACIONES, TIPOS_INMUEBLE } from '../../types/inmueble';
import type { Inmueble } from '../../types/inmueble';
import { inmuebleSchema } from '../../schemas/inmueble.schema';
import { validarConZod } from '../../utils/validators';

export type NuevoInmueblePayload = Omit<Inmueble, 'id'>;

type NuevoInmuebleModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (inmueble: NuevoInmueblePayload) => void;
};

const initialForm = {
  ubicacion: '',
  identificacionParcela: '',
  zonificacion: 'Residencial' as string,
  estadoOcupacion: 'Disponible' as string,
  usoActual: 'Vivienda' as string,
  tipoInmueble: 'Apartamento' as string,
  areaSegunDocumento: '',
  precio: '',
  proyecto: '',
  linderos: '',
  coordenadas: '',
  datosRegistrales: '',
  observaciones: '',
};

export default function NuevoInmuebleModal({ open, onClose, onSubmit }: NuevoInmuebleModalProps) {
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
    const parsed = {
      ...form,
      areaSegunDocumento: form.areaSegunDocumento ? parseMontoInput(form.areaSegunDocumento) : null,
      areaDesincorporada: null,
      areaComprometida: null,
      areaDisponible: form.areaSegunDocumento ? parseMontoInput(form.areaSegunDocumento) : null,
      precio: form.precio ? parseMontoInput(form.precio) : null,
    };
    const result = validarConZod(inmuebleSchema, parsed);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }
    onSubmit({
      ...parsed,
      zonificacion: parsed.zonificacion as Inmueble['zonificacion'],
      estadoOcupacion: parsed.estadoOcupacion as Inmueble['estadoOcupacion'],
      usoActual: parsed.usoActual as Inmueble['usoActual'],
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Inmueble">
      <div className="space-y-4">
        <ModalField label="Ubicación *" error={errors.ubicacion}>
          <input
            value={form.ubicacion}
            onChange={(e) => updateForm('ubicacion', e.target.value)}
            className="input-field"
            placeholder="Urbanización Villa Rosa, Parcela 150"
          />
        </ModalField>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Identificación de parcela *" error={errors.identificacionParcela}>
            <input
              value={form.identificacionParcela}
              onChange={(e) => updateForm('identificacionParcela', e.target.value)}
              className="input-field"
              placeholder="VR-P-150"
            />
          </ModalField>
          <ModalField label="Tipo de inmueble *" error={errors.tipoInmueble}>
            <select
              value={form.tipoInmueble}
              onChange={(e) => updateForm('tipoInmueble', e.target.value)}
              className="input-field"
            >
              {TIPOS_INMUEBLE.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Zonificación *" error={errors.zonificacion}>
            <select
              value={form.zonificacion}
              onChange={(e) => updateForm('zonificacion', e.target.value)}
              className="input-field"
            >
              {ZONIFICACIONES.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Estado *" error={errors.estadoOcupacion}>
            <select
              value={form.estadoOcupacion}
              onChange={(e) => updateForm('estadoOcupacion', e.target.value)}
              className="input-field"
            >
              {ESTADOS_OCUPACION.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </ModalField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Área (m²)" error={errors.areaSegunDocumento}>
            <input
              type="text"
              inputMode="decimal"
              value={form.areaSegunDocumento}
              onChange={(e) => updateForm('areaSegunDocumento', sanitizeMontoDraft(e.target.value))}
              className="input-field"
              placeholder={PLACEHOLDER_AREA}
            />
          </ModalField>
          <ModalField label="Precio (USD)" error={errors.precio}>
            <input
              type="text"
              inputMode="decimal"
              value={form.precio}
              onChange={(e) => updateForm('precio', sanitizeMontoDraft(e.target.value))}
              className="input-field"
              placeholder={PLACEHOLDER_PRECIO}
            />
          </ModalField>
        </div>
        <ModalField label="Proyecto" error={errors.proyecto}>
          <input
            value={form.proyecto}
            onChange={(e) => updateForm('proyecto', e.target.value)}
            className="input-field"
            placeholder="Urbanización Villa Rosa"
          />
        </ModalField>
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
          Registrar Inmueble
        </button>
      </div>
    </Modal>
  );
}
