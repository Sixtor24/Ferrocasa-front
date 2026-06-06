import { useEffect, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCompromiso } from '../../api/services/compromisos.service';
import { createDesincorporacion } from '../../api/services/desincorporaciones.service';
import { createProtocolo, type MotivoProtocolo } from '../../api/services/protocolos.service';
import {
  protocolizacionFormSchema,
  type ProtocolizacionForm,
} from '../../schemas/protocolizacion.schema';
import { parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';
import SearchableSelect from '../forms/SearchableSelect';
import Modal from './Modal';
import ModalField from './ModalField';

export type TipoProtocolizacionParcela = ProtocolizacionForm['tipo'];

type NuevaProtocolizacionModalProps = {
  open: boolean;
  onClose: () => void;
  tipo: TipoProtocolizacionParcela;
  onCreated: (tipo: TipoProtocolizacionParcela, idMovimiento: number) => Promise<void> | void;
  onError: (message: string) => void;
};

const MOTIVOS: { label: string; value: MotivoProtocolo }[] = [
  { label: 'Venta', value: 'Venta' },
  { label: 'Ejecución de obras', value: 'Ejecucion_de_obras' },
  { label: 'Afectado por bienhechurías de FMO', value: 'Afectado_por_bienhechurias_de_FMO' },
];

function defaultValues(tipo: TipoProtocolizacionParcela): ProtocolizacionForm {
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
  const [cantidadDraft, setCantidadDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProtocolizacionForm>({
    resolver: zodResolver(protocolizacionFormSchema) as Resolver<ProtocolizacionForm>,
    defaultValues: defaultValues(tipo),
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValues(tipo));
    setCantidadDraft('');
  }, [open, tipo, reset]);

  const onSubmit = async (form: ProtocolizacionForm) => {
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
            onClick={handleSubmit(onSubmit)}
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
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                onChange={field.onChange}
                options={['Compromiso', 'Desincorporación']}
              />
            )}
          />
        </ModalField>
        <ModalField label="Fecha *" error={errors.fecha?.message}>
          <input type="date" {...register('fecha')} className="input-field" />
        </ModalField>
        <ModalField label="Motivo">
          <Controller
            name="motivo"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                onChange={field.onChange}
                options={MOTIVOS}
              />
            )}
          />
        </ModalField>
        <ModalField label="Beneficiario *" error={errors.idBeneficiado?.message}>
          <Controller
            name="idBeneficiado"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                inputMode="numeric"
                value={field.value > 0 ? String(field.value) : ''}
                onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
                className="input-field"
              />
            )}
          />
        </ModalField>
        <ModalField
          label="Cantidad de Área Comprometida o desincorporada M² *"
          error={errors.cantidadM2?.message}
          className="md:col-span-2"
        >
          <Controller
            name="cantidadM2"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                inputMode="decimal"
                value={cantidadDraft}
                onChange={(e) => {
                  const next = sanitizeMontoDraft(e.target.value);
                  setCantidadDraft(next);
                  field.onChange(parseMontoInput(next));
                }}
                className="input-field"
              />
            )}
          />
        </ModalField>
      </div>
    </Modal>
  );
}
