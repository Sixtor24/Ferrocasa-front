import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCompromiso } from '../../api/services/compromisos.service';
import { createDesincorporacion } from '../../api/services/desincorporaciones.service';
import { createProtocolo, type MotivoProtocolo } from '../../api/services/protocolos.service';
import {
  protocolizacionFormSchema,
  type ProtocolizacionForm,
} from '../../schemas/protocolizacion.schema';
import { parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import SearchableSelect from '../forms/SearchableSelect';
import Modal from './Modal';
import ModalField from './ModalField';

export type TipoProtocolizacionParcela = ProtocolizacionForm['tipo'];

type NuevaProtocolizacionModalProps = {
  open: boolean;
  onClose: () => void;
  tipo: TipoProtocolizacionParcela;
  /** Si es true, el tipo queda bloqueado y el beneficiario se registra automáticamente con el usuario actual */
  lockTipo?: boolean;
  areaDisponible?: number;
  areaComprometida?: number;
  onCreated: (tipo: TipoProtocolizacionParcela, idMovimiento: number) => Promise<void> | void;
  onError: (message: string) => void;
};

function areaMaximaPorTipo(
  tipo: TipoProtocolizacionParcela,
  areaDisponible = 0,
  areaComprometida = 0,
) {
  if (tipo === 'Compromiso') return areaDisponible;
  return areaDisponible + areaComprometida;
}

function formatAreaHint(value: number) {
  return value.toLocaleString('es-VE');
}

const MOTIVOS: { label: string; value: MotivoProtocolo }[] = [
  { label: 'Venta', value: 'Venta' },
  { label: 'Ejecución de obras', value: 'Ejecucion_de_obras' },
  { label: 'Afectado por bienhechurías de FMO', value: 'Afectado_por_bienhechurias_de_FMO' },
];

function defaultValues(tipo: TipoProtocolizacionParcela, beneficiario = ''): ProtocolizacionForm {
  return {
    tipo,
    motivo: 'Venta',
    fecha: '',
    beneficiario,
    cantidadM2: 0,
  };
}

export default function NuevaProtocolizacionModal({
  open,
  onClose,
  tipo,
  lockTipo = false,
  areaDisponible = 0,
  areaComprometida = 0,
  onCreated,
  onError,
}: NuevaProtocolizacionModalProps) {
  const { user } = useAuth();
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

  const tipoActual = useWatch({ control, name: 'tipo' }) ?? tipo;
  const esDesincorporacion = tipoActual === 'Desincorporación';
  const areaMaxima = areaMaximaPorTipo(tipoActual, areaDisponible, areaComprometida);

  const areaMaximaInicial = areaMaximaPorTipo(tipo, areaDisponible, areaComprometida);
  const esDesincorporacionInicial = tipo === 'Desincorporación';

  useEffect(() => {
    if (!open) return;
    const beneficiarioDefault = lockTipo ? (user?.username ?? '') : '';
    const defaults = defaultValues(tipo, beneficiarioDefault);

    if (esDesincorporacionInicial && areaMaximaInicial > 0) {
      const draft = String(areaMaximaInicial).replace('.', ',');
      setCantidadDraft(draft);
      reset({ ...defaults, cantidadM2: areaMaximaInicial });
      return;
    }
    reset(defaults);
    setCantidadDraft('');
  }, [open, tipo, reset, esDesincorporacionInicial, areaMaximaInicial, lockTipo, user?.username]);

  const onSubmit = async (form: ProtocolizacionForm) => {
    const maxPermitido = areaMaximaPorTipo(form.tipo, areaDisponible, areaComprometida);
    if (form.cantidadM2 > maxPermitido) {
      const etiqueta = form.tipo === 'Compromiso' ? 'área disponible' : 'área retirable';
      onError(`La cantidad no puede superar el ${etiqueta} (${formatAreaHint(maxPermitido)} m²).`);
      return;
    }

    const idBeneficiado = lockTipo
      ? null
      : (() => {
          const parsed = parseInt(form.beneficiario.replace(/\D/g, ''), 10);
          return parsed > 0 ? parsed : null;
        })();

    setSubmitting(true);
    try {
      const protocolo = await createProtocolo({
        motivo: form.motivo,
        id_beneficiado: idBeneficiado,
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
      title={lockTipo && esDesincorporacion ? 'Retirar de Inventario' : 'Nueva Protocolización'}
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
                disabled={lockTipo}
                disableSearch
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
        <ModalField
          label={lockTipo ? 'Ejecutado por (usuario actual)' : 'Beneficiario *'}
          error={!lockTipo ? errors.beneficiario?.message : undefined}
        >
          <input
            {...register('beneficiario')}
            className="input-field"
            readOnly={lockTipo}
            placeholder={!lockTipo ? 'V-12345678 o BEN-0001' : undefined}
          />
          {lockTipo && (
            <p className="text-xs text-gray-500 mt-1">
              Registrado automáticamente con el usuario activo.
            </p>
          )}
        </ModalField>
        <ModalField
          label={
            esDesincorporacion
              ? 'Cantidad de Área a desincorporar M² *'
              : 'Cantidad de Área Comprometida M² *'
          }
          error={errors.cantidadM2?.message}
          className="md:col-span-2"
        >
          <Controller
            name="cantidadM2"
            control={control}
            render={({ field }) => (
              <>
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
                {areaMaxima > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {esDesincorporacion
                      ? `Máximo retirable: ${formatAreaHint(areaMaxima)} m² (disponible + comprometida).`
                      : `Máximo disponible: ${formatAreaHint(areaMaxima)} m².`}
                  </p>
                )}
              </>
            )}
          />
        </ModalField>
      </div>
    </Modal>
  );
}
