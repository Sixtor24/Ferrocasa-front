import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { API_MAX_LIMIT } from '../../api/pagination';
import { fetchResponsables } from '../../api/services/responsables.service';
import CurrencyAmountInput from '../forms/CurrencyAmountInput';
import SearchableSelect from '../forms/SearchableSelect';
import Modal from './Modal';
import ModalField from './ModalField';
import {
  ESTADOS_TRAMITE,
  LEVANTAMIENTO_TOPOGRAFICO_OPCIONES,
} from '../../types/terreno';
import { parseMontoInput, sanitizeMontoDraft } from '../../utils/formatters';
import {
  parcelaRegistroFormSchema,
  type ParcelaRegistroForm,
} from '../../schemas/registroParcela.schema';

export type ParcelaRegistroDraft = ParcelaRegistroForm & { key: string };

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
    codigo: '',
    identificacion: '',
    zona: '',
    zonificacion: '',
    ubicacionAdicional: '',
    areaTotalM2: 0,
    valorAdquisicion: 0,
    ciResponsable: '',
    observaciones: '',
    acreditacionTecnicaAmbiental: 'No',
    levantamientoTopografico: 'En trámite',
  };
}

function parcelaToFormValues(item: ParcelaRegistroDraft): ParcelaRegistroForm {
  const { key: _key, ...form } = item;
  return form;
}

export default function NuevaParcelaModal({
  open,
  item,
  onClose,
  onSave,
  onDelete,
}: NuevaParcelaModalProps) {
  const [itemKey, setItemKey] = useState('');
  const [areaDraft, setAreaDraft] = useState('');
  const [responsables, setResponsables] = useState<{ ci: string; nombre: string }[]>([]);
  const [loadingResponsables, setLoadingResponsables] = useState(false);
  const isEditing = Boolean(item);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParcelaRegistroForm>({
    resolver: zodResolver(parcelaRegistroFormSchema),
    defaultValues: parcelaToFormValues(emptyParcela()),
  });

  useEffect(() => {
    if (!open) return;
    const next = item ?? emptyParcela();
    setItemKey(next.key);
    reset(parcelaToFormValues(next));
    setAreaDraft(next.areaTotalM2 > 0 ? String(next.areaTotalM2).replace('.', ',') : '');
  }, [open, item, reset]);

  useEffect(() => {
    if (!open) return;
    setLoadingResponsables(true);
    fetchResponsables({ page: 1, limit: API_MAX_LIMIT })
      .then((res) => {
        setResponsables(
          (res.data ?? []).map((row) => ({
            ci: row.ci_responsable,
            nombre: row.nombre,
          })),
        );
      })
      .catch(() => setResponsables([]))
      .finally(() => setLoadingResponsables(false));
  }, [open]);

  const responsableOptions = useMemo(
    () =>
      responsables.map((row) => ({
        label: `${row.ci} — ${row.nombre}`,
        value: row.ci,
      })),
    [responsables],
  );

  const onSubmit = (parsed: ParcelaRegistroForm) => {
    onSave({
      ...parsed,
      key: itemKey,
      codigo: parsed.codigo.trim(),
      identificacion: parsed.identificacion.trim(),
      zona: parsed.zona.trim(),
      zonificacion: parsed.zonificacion.trim(),
      ubicacionAdicional: parsed.ubicacionAdicional.trim(),
      ciResponsable: parsed.ciResponsable.trim(),
      observaciones: parsed.observaciones?.trim() ?? '',
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
                onDelete(itemKey);
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
            onClick={handleSubmit(onSubmit)}
            className="px-6 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800"
          >
            {isEditing ? 'Guardar' : 'Agregar'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModalField label="Código *" error={errors.codigo?.message}>
            <input {...register('codigo')} className="input-field" />
          </ModalField>
          <ModalField label="Identificación *" error={errors.identificacion?.message}>
            <input {...register('identificacion')} className="input-field" />
          </ModalField>
          <ModalField label="Lote / Manzana *" error={errors.zona?.message}>
            <input {...register('zona')} className="input-field" />
          </ModalField>
          <ModalField label="Zonificación *" error={errors.zonificacion?.message}>
            <input {...register('zonificacion')} className="input-field" />
          </ModalField>
          <ModalField label="CI Responsable *" error={errors.ciResponsable?.message}>
            <Controller
              name="ciResponsable"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={responsableOptions}
                  placeholder={loadingResponsables ? 'Cargando responsables...' : 'Seleccionar responsable'}
                  searchPlaceholder="Buscar por CI o nombre..."
                  disabled={loadingResponsables || responsableOptions.length === 0}
                  minSearchLength={1}
                />
              )}
            />
            {!loadingResponsables && responsableOptions.length === 0 && (
              <p className="text-xs text-amber-700 mt-1.5">
                No hay responsables en el sistema. Créelos en el API (`POST /responsables`) antes de registrar parcelas.
              </p>
            )}
          </ModalField>
          <ModalField label="Ubicación Adicional *" error={errors.ubicacionAdicional?.message} className="md:col-span-2">
            <input
              {...register('ubicacionAdicional')}
              placeholder="Sector, referencia o ubicación adicional"
              className="input-field"
            />
          </ModalField>
          <ModalField label="Área Total M² *" error={errors.areaTotalM2?.message}>
            <Controller
              name="areaTotalM2"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  inputMode="decimal"
                  value={areaDraft}
                  onChange={(e) => {
                    const next = sanitizeMontoDraft(e.target.value);
                    setAreaDraft(next);
                    field.onChange(parseMontoInput(next));
                  }}
                  className="input-field"
                />
              )}
            />
          </ModalField>
          <ModalField label="Valor de Adquisición" error={errors.valorAdquisicion?.message}>
            <Controller
              name="valorAdquisicion"
              control={control}
              render={({ field }) => (
                <CurrencyAmountInput value={field.value} onChange={field.onChange} />
              )}
            />
          </ModalField>
          <ModalField label="Acreditación Técnica Ambiental">
            <Controller
              name="acreditacionTecnicaAmbiental"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={ESTADOS_TRAMITE}
                />
              )}
            />
          </ModalField>
          <ModalField label="Levantamiento topográfico">
            <Controller
              name="levantamientoTopografico"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={LEVANTAMIENTO_TOPOGRAFICO_OPCIONES}
                />
              )}
            />
          </ModalField>
          <ModalField label="Observaciones" className="md:col-span-2">
            <textarea {...register('observaciones')} className="input-field" rows={4} />
          </ModalField>
        </div>
      </div>
    </Modal>
  );
}
