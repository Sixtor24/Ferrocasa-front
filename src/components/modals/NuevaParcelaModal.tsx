import { useEffect, useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  /** CI del responsable del almacén Terrenos (Configuración); se envía sin mostrarlo en el formulario. */
  defaultCiResponsable?: string;
  onClose: () => void;
  onSave: (item: ParcelaRegistroDraft) => void;
  onDelete?: (key: string) => void;
};

function emptyParcela(ciResponsable = ''): ParcelaRegistroDraft {
  return {
    key: `parcela-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    codigo: '',
    identificacion: '',
    zona: '',
    zonificacion: '',
    ubicacionAdicional: '',
    areaTotalM2: 0,
    valorAdquisicion: 0,
    ciResponsable,
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
  defaultCiResponsable = '',
  onClose,
  onSave,
  onDelete,
}: NuevaParcelaModalProps) {
  const [itemKey, setItemKey] = useState('');
  const [areaDraft, setAreaDraft] = useState('');
  const isEditing = Boolean(item);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ParcelaRegistroForm>({
    resolver: zodResolver(parcelaRegistroFormSchema) as Resolver<ParcelaRegistroForm>,
    defaultValues: parcelaToFormValues(emptyParcela()),
  });

  useEffect(() => {
    if (!open) return;
    const ci = item?.ciResponsable || defaultCiResponsable || '';
    const next = item ?? emptyParcela(ci);
    if (!item && ci) {
      next.ciResponsable = ci;
    }
    setItemKey(next.key);
    reset(parcelaToFormValues(next));
    setAreaDraft(next.areaTotalM2 > 0 ? String(next.areaTotalM2).replace('.', ',') : '');
  }, [open, item, defaultCiResponsable, reset]);

  useEffect(() => {
    if (!open || !defaultCiResponsable) return;
    setValue('ciResponsable', defaultCiResponsable, { shouldValidate: false });
  }, [open, defaultCiResponsable, setValue]);

  const onSubmit = (parsed: ParcelaRegistroForm) => {
    const ciResponsable = (parsed.ciResponsable || defaultCiResponsable || '').trim();
    onSave({
      ...parsed,
      key: itemKey,
      codigo: parsed.codigo.trim(),
      identificacion: parsed.identificacion.trim(),
      zona: parsed.zona.trim(),
      zonificacion: parsed.zonificacion.trim(),
      ubicacionAdicional: parsed.ubicacionAdicional.trim(),
      observaciones: parsed.observaciones?.trim() ?? '',
      ciResponsable,
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
