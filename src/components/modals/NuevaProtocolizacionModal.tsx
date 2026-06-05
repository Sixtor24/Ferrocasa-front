import { useEffect, useState } from 'react';
import { createCompromiso } from '../../api/services/compromisos.service';
import { createDesincorporacion } from '../../api/services/desincorporaciones.service';
import { createProtocolo, type MotivoProtocolo } from '../../api/services/protocolos.service';
import { parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';
import Modal from './Modal';
import ModalField from './ModalField';

export type TipoProtocolizacionParcela = 'Compromiso' | 'Desincorporación';

type NuevaProtocolizacionModalProps = {
  open: boolean;
  onClose: () => void;
  tipo: TipoProtocolizacionParcela;
  onCreated: (tipo: TipoProtocolizacionParcela, idMovimiento: number) => Promise<void> | void;
  onError: (message: string) => void;
};

type ProtocolizacionForm = {
  tipo: TipoProtocolizacionParcela;
  motivo: MotivoProtocolo;
  fecha: string;
  idBeneficiado: number;
  cantidadM2: number;
};

const MOTIVOS: { label: string; value: MotivoProtocolo }[] = [
  { label: 'Venta', value: 'Venta' },
  { label: 'Ejecución de obras', value: 'Ejecucion_de_obras' },
  { label: 'Afectado por bienhechurías de FMO', value: 'Afectado_por_bienhechurias_de_FMO' },
];

function initialForm(tipo: TipoProtocolizacionParcela): ProtocolizacionForm {
  return {
    tipo,
    motivo: 'Venta',
    fecha: '',
    idBeneficiado: 0,
    cantidadM2: 0,
  };
}

export default function NuevaProtocolizacionModal({
  open,
  onClose,
  tipo,
  onCreated,
  onError,
}: NuevaProtocolizacionModalProps) {
  const [form, setForm] = useState<ProtocolizacionForm>(() => initialForm(tipo));
  const [cantidadDraft, setCantidadDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initialForm(tipo));
    setCantidadDraft('');
    setErrors({});
  }, [open, tipo]);

  const updateForm = <K extends keyof ProtocolizacionForm>(key: K, value: ProtocolizacionForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fecha) next.fecha = 'Indique la fecha';
    if (!form.idBeneficiado) next.idBeneficiado = 'Indique el beneficiario';
    if (form.cantidadM2 <= 0) next.cantidadM2 = 'Indique la cantidad de área';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const protocolo = await createProtocolo({
        motivo: form.motivo,
        id_beneficiado: form.idBeneficiado,
        fecha_protocolo: form.fecha,
      });

      if (form.tipo === 'Compromiso') {
        const compromiso = await createCompromiso({
          id_protocolo: protocolo.id_protocolo,
          cantidad_m2: form.cantidadM2,
          fecha_compromiso: form.fecha,
        });
        await onCreated(form.tipo, compromiso.id_comprometida);
      } else {
        const desincorporacion = await createDesincorporacion({
          id_protocolo: protocolo.id_protocolo,
          cantidad_m2: form.cantidadM2,
          fecha_desincorporacion: form.fecha,
        });
        await onCreated(form.tipo, desincorporacion.id_desincorporada);
      }

      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo crear la protocolización');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva Protocolización"
      maxWidth="2xl"
      footer={
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
          >
            {submitting ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModalField label="Tipo de Protocolización">
          <select
            value={form.tipo}
            onChange={(e) => updateForm('tipo', e.target.value as TipoProtocolizacionParcela)}
            className="input-field"
          >
            <option value="Compromiso">Compromiso</option>
            <option value="Desincorporación">Desincorporación</option>
          </select>
        </ModalField>
        <ModalField label="Fecha *" error={errors.fecha}>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => updateForm('fecha', e.target.value)}
            className="input-field"
          />
        </ModalField>
        <ModalField label="Motivo">
          <select
            value={form.motivo}
            onChange={(e) => updateForm('motivo', e.target.value as MotivoProtocolo)}
            className="input-field"
          >
            {MOTIVOS.map((motivo) => (
              <option key={motivo.value} value={motivo.value}>
                {motivo.label}
              </option>
            ))}
          </select>
        </ModalField>
        <ModalField label="Beneficiario *" error={errors.idBeneficiado}>
          <input
            type="text"
            inputMode="numeric"
            value={form.idBeneficiado > 0 ? String(form.idBeneficiado) : ''}
            onChange={(e) => updateForm('idBeneficiado', Number(e.target.value.replace(/\D/g, '')))}
            className="input-field"
          />
        </ModalField>
        <ModalField
          label="Cantidad de Área Comprometida o desincorporada M² *"
          error={errors.cantidadM2}
          className="md:col-span-2"
        >
          <input
            type="text"
            inputMode="decimal"
            value={cantidadDraft}
            onChange={(e) => {
              const next = sanitizeMontoDraft(e.target.value);
              setCantidadDraft(next);
              updateForm('cantidadM2', parseMontoInput(next));
            }}
            className="input-field"
          />
        </ModalField>
      </div>
    </Modal>
  );
}
