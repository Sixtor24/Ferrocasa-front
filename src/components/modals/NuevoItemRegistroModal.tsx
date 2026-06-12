import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from './Modal';
import CurrencyAmountInput from '../forms/CurrencyAmountInput';
import FlexibleIntegerInput from '../forms/FlexibleIntegerInput';
import SearchableSelect from '../forms/SearchableSelect';
import ModalField from './ModalField';
import {
  fetchCategoriasEspecificasBySubcategoriaId,
  fetchCategoriasGenerales,
  fetchSubcategoriasByGeneral,
} from '../../api/services/categorias.service';
import { fetchDepartamentos } from '../../api/services/departamentos.service';
import { API_MAX_LIMIT } from '../../api/pagination';
import type { ApiAlmacen } from '../../api/types';
import type { ConsumibilidadBienApi } from '../../api/services/bienes.service';
import type { ItemRegistroDraft, MonedaRegistro, RegistroBienesModulo } from '../../types/registroBienItem';
import { CONDICIONES_FISICAS, ESTADOS_USO, type CondicionFisica, type EstadoUso } from '../../types/bien';
import {
  itemDraftToFormInput,
  itemRegistroFormSchema,
  type ItemRegistroForm,
} from '../../schemas/registro.schema';
import { formatMoneda } from '../../utils/formatters';
import ResponsableAlmacenField from '../forms/ResponsableAlmacenField';
import { resolveResponsableForAlmacen } from '../../utils/registroBienMappers';

type NuevoItemRegistroModalProps = {
  open: boolean;
  onClose: () => void;
  modulo: RegistroBienesModulo;
  item: ItemRegistroDraft | null;
  almacenOptions: string[];
  almacenes: ApiAlmacen[];
  departamentoOptions: readonly string[];
  moneda: MonedaRegistro;
  onSave: (item: ItemRegistroDraft) => void;
  onDelete?: (key: string) => void;
};

type SelectOption = { id: number; nombre: string };

const CONSUMIBILIDAD_OPTIONS: { label: string; value: ConsumibilidadBienApi }[] = [
  { label: 'No perecedero', value: 'No_perecedero' },
  { label: 'Perecederos', value: 'Perecederos' },
];

function createEmptyItem(almacenDefault: string, unidadDefault: string): ItemRegistroDraft {
  return {
    key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    codigoInterno: '',
    descripcion: '',
    color: '',
    cantidad: 1,
    unidadAdministrativa: unidadDefault,
    responsable: '',
    ciResponsable: '',
    idCategoriaGeneral: 0,
    categoriaGeneralNombre: '',
    idSubcategoria: 0,
    subcategoriaNombre: '',
    idCategoriaEspecifica: 0,
    categoriaEspecificaNombre: '',
    estadoUso: 'En uso',
    serial: '',
    sinSerial: false,
    marca: '',
    modelo: '',
    valorAdquisicion: 0,
    almacen: almacenDefault,
    observaciones: '',
    consumibilidad: 'No_perecedero',
    condicionFisica: 'Bueno',
  };
}

export default function NuevoItemRegistroModal({
  open,
  onClose,
  modulo,
  item,
  almacenOptions,
  almacenes,
  departamentoOptions,
  moneda,
  onSave,
  onDelete,
}: NuevoItemRegistroModalProps) {
  const almacenDefault = almacenOptions[0] ?? '';
  const unidadDefault = modulo === 'cementerio' ? almacenDefault : (departamentoOptions[0] ?? '');

  const [itemKey, setItemKey] = useState('');
  const [responsable, setResponsable] = useState('');
  const [ciResponsable, setCiResponsable] = useState('');
  const [categoriasGenerales, setCategoriasGenerales] = useState<SelectOption[]>([]);
  const [subcategorias, setSubcategorias] = useState<SelectOption[]>([]);
  const [categoriasEspecificas, setCategoriasEspecificas] = useState<SelectOption[]>([]);
  const [departamentosApi, setDepartamentosApi] = useState<{ id: number; nombre: string }[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemRegistroForm>({
    resolver: zodResolver(itemRegistroFormSchema),
    defaultValues: itemDraftToFormInput(createEmptyItem(almacenDefault, unidadDefault)),
  });

  const idCategoriaGeneral = watch('idCategoriaGeneral');
  const idSubcategoria = watch('idSubcategoria');
  const sinSerial = watch('sinSerial');
  const cantidad = watch('cantidad');
  const valorAdquisicion = watch('valorAdquisicion');
  const almacen = watch('almacen');

  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) return;

    const draft = item ?? createEmptyItem(almacenDefault, unidadDefault);
    setItemKey(draft.key);
    setResponsable(draft.responsable);
    setCiResponsable(draft.ciResponsable);
    reset(itemDraftToFormInput(draft));

    fetchCategoriasGenerales({ page: 1, limit: API_MAX_LIMIT }).then((res) => {
      setCategoriasGenerales(
        (res.data ?? []).map((c) => ({
          id: c.id_categoria_general,
          nombre: c.nombre,
        })),
      );
    });

    fetchDepartamentos({ page: 1, limit: API_MAX_LIMIT }).then((res) => {
      setDepartamentosApi(
        (res.data ?? []).map((d) => ({
          id: d.id_departamento,
          nombre: d.nombre,
        })),
      );
    });
  }, [open, item, almacenDefault, unidadDefault, reset]);

  useEffect(() => {
    if (!open || !idCategoriaGeneral) {
      setSubcategorias([]);
      return;
    }
    fetchSubcategoriasByGeneral(idCategoriaGeneral).then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setSubcategorias(
        list.map((s) => ({
          id: s.id_subcategoria,
          nombre: s.nombre,
        })),
      );
    });
  }, [open, idCategoriaGeneral]);

  useEffect(() => {
    if (!open || !idSubcategoria) {
      setCategoriasEspecificas([]);
      return;
    }
    fetchCategoriasEspecificasBySubcategoriaId(idSubcategoria).then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setCategoriasEspecificas(
        list.map((c) => ({
          id: c.id_categoria_especifica,
          nombre: c.nombre,
        })),
      );
    });
  }, [open, idSubcategoria]);

  const loadResponsableForAlmacen = async (nombreAlmacen: string) => {
    const result = await resolveResponsableForAlmacen(nombreAlmacen, almacenes);
    setResponsable(result.responsable);
    setCiResponsable(result.ciResponsable);
  };

  useEffect(() => {
    if (!open || !almacen) return;
    void loadResponsableForAlmacen(almacen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, almacen, almacenes]);

  const onSubmit = (parsed: ItemRegistroForm) => {
    onSave({
      key: itemKey,
      codigoInterno: parsed.codigoInterno.trim(),
      descripcion: parsed.descripcion,
      color: parsed.color,
      cantidad: parsed.cantidad,
      unidadAdministrativa: parsed.unidadAdministrativa,
      responsable,
      ciResponsable,
      idCategoriaGeneral: parsed.idCategoriaGeneral,
      categoriaGeneralNombre:
        categoriasGenerales.find((c) => c.id === parsed.idCategoriaGeneral)?.nombre ?? '',
      idSubcategoria: parsed.idSubcategoria,
      subcategoriaNombre: subcategorias.find((c) => c.id === parsed.idSubcategoria)?.nombre ?? '',
      idCategoriaEspecifica: parsed.idCategoriaEspecifica,
      categoriaEspecificaNombre:
        categoriasEspecificas.find((c) => c.id === parsed.idCategoriaEspecifica)?.nombre ?? '',
      estadoUso: parsed.estadoUso,
      serial: parsed.sinSerial ? 'S/S' : parsed.serial.trim(),
      sinSerial: parsed.sinSerial,
      marca: parsed.marca,
      modelo: parsed.modelo,
      valorAdquisicion: parsed.valorAdquisicion,
      almacen: parsed.almacen,
      observaciones: parsed.observaciones,
      consumibilidad: parsed.consumibilidad,
      condicionFisica: parsed.condicionFisica,
    });
    onClose();
  };

  const departamentosSelect = useMemo(() => {
    if (modulo === 'cementerio') return [...almacenOptions];
    const fromCatalog = [...departamentoOptions];
    if (fromCatalog.length > 0) return fromCatalog;
    return departamentosApi.map((d) => d.nombre);
  }, [modulo, almacenOptions, departamentoOptions, departamentosApi]);

  const totalCalculado = (cantidad || 0) * (valorAdquisicion || 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo Item"
      maxWidth="6xl"
      zIndexClass="z-[60]"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(itemKey);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 border border-red-200 rounded-lg hover:bg-red-50"
            >
              Eliminar ítem
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              className="px-8 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800"
            >
              {isEditing ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ModalField label="Código *" error={errors.codigoInterno?.message}>
            <input
              {...register('codigoInterno')}
              className="input-field font-mono"
              autoComplete="off"
            />
          </ModalField>
          <ModalField label="Descripción *" error={errors.descripcion?.message}>
            <input {...register('descripcion')} className="input-field" />
          </ModalField>
          <ModalField label="Color" error={errors.color?.message}>
            <input {...register('color')} className="input-field" />
          </ModalField>
          <ModalField label="Cantidad *" error={errors.cantidad?.message}>
            <Controller
              name="cantidad"
              control={control}
              render={({ field }) => <FlexibleIntegerInput value={field.value} onChange={field.onChange} />}
            />
          </ModalField>
          <ModalField label="Unidad Administrativa *" error={errors.unidadAdministrativa?.message}>
            <Controller
              name="unidadAdministrativa"
              control={control}
              render={({ field }) => (
                <SearchableSelect value={field.value} onChange={field.onChange} options={departamentosSelect} />
              )}
            />
          </ModalField>
          <ModalField label="Categoría *" error={errors.idCategoriaGeneral?.message}>
            <Controller
              name="idCategoriaGeneral"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? String(field.value) : ''}
                  onChange={(value) => {
                    field.onChange(Number(value));
                    setValue('idSubcategoria', 0);
                    setValue('idCategoriaEspecifica', 0);
                  }}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    ...categoriasGenerales.map((c) => ({ value: String(c.id), label: c.nombre })),
                  ]}
                />
              )}
            />
          </ModalField>
          <ModalField label="Sub Categoría *" error={errors.idSubcategoria?.message}>
            <Controller
              name="idSubcategoria"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? String(field.value) : ''}
                  onChange={(value) => {
                    field.onChange(Number(value));
                    setValue('idCategoriaEspecifica', 0);
                  }}
                  disabled={!idCategoriaGeneral}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    ...subcategorias.map((c) => ({ value: String(c.id), label: c.nombre })),
                  ]}
                />
              )}
            />
          </ModalField>
          <ModalField label="Categoría Específica *" error={errors.idCategoriaEspecifica?.message}>
            <Controller
              name="idCategoriaEspecifica"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ? String(field.value) : ''}
                  onChange={(value) => field.onChange(Number(value))}
                  disabled={!idSubcategoria}
                  options={[
                    { value: '', label: 'Seleccionar...' },
                    ...categoriasEspecificas.map((c) => ({ value: String(c.id), label: c.nombre })),
                  ]}
                />
              )}
            />
          </ModalField>
          <ModalField label="Estado de uso *" error={errors.estadoUso?.message}>
            <Controller
              name="estadoUso"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={(value) => field.onChange(value as EstadoUso)}
                  options={ESTADOS_USO}
                />
              )}
            />
          </ModalField>
        </div>

        <div className="space-y-4">
          <ModalField label="Serial" error={errors.serial?.message}>
            <div className="flex items-center gap-3">
              <input
                {...register('serial')}
                disabled={sinSerial}
                className="input-field flex-1 font-mono"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                <Controller
                  name="sinSerial"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.checked);
                        if (e.target.checked) setValue('serial', 'S/S');
                      }}
                      className="rounded"
                    />
                  )}
                />
                Sin serial
              </label>
            </div>
          </ModalField>
          <ModalField label="Marca *" error={errors.marca?.message}>
            <input {...register('marca')} className="input-field" />
          </ModalField>
          <ModalField label="Modelo" error={errors.modelo?.message}>
            <input {...register('modelo')} className="input-field" />
          </ModalField>
          <ModalField label="Valor de Adquisición *" error={errors.valorAdquisicion?.message}>
            <Controller
              name="valorAdquisicion"
              control={control}
              render={({ field }) => <CurrencyAmountInput value={field.value} onChange={field.onChange} />}
            />
          </ModalField>
          <ModalField label="Total calculado">
            <div className="input-field bg-gray-50 font-semibold text-navy-900">
              {formatMoneda(totalCalculado, moneda)}
            </div>
          </ModalField>
          <ModalField label="Almacén *" error={errors.almacen?.message}>
            <Controller
              name="almacen"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    void loadResponsableForAlmacen(value);
                  }}
                  options={almacenOptions}
                />
              )}
            />
          </ModalField>
          <ResponsableAlmacenField
            nombre={responsable}
            ciResponsable={ciResponsable}
            sinConfigurar={Boolean(almacen) && !ciResponsable}
          />
          <ModalField label="Observaciones" error={errors.observaciones?.message}>
            <textarea {...register('observaciones')} className="input-field" rows={4} />
          </ModalField>
          <ModalField label="Consumibilidad *" error={errors.consumibilidad?.message}>
            <Controller
              name="consumibilidad"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value}
                  onChange={(value) => field.onChange(value as ConsumibilidadBienApi)}
                  options={CONSUMIBILIDAD_OPTIONS}
                />
              )}
            />
          </ModalField>
          {modulo !== 'cementerio' && (
            <ModalField label="Condición Física *" error={errors.condicionFisica?.message}>
              <Controller
                name="condicionFisica"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={(value) => field.onChange(value as CondicionFisica)}
                    options={CONDICIONES_FISICAS}
                  />
                )}
              />
            </ModalField>
          )}
        </div>
      </div>
    </Modal>
  );
}
