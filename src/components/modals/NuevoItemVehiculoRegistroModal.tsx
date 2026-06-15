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
import type { ItemVehiculoRegistroDraft } from '../../types/registroVehiculoItem';
import { CONDICIONES_VEHICULO, ESTADOS_USO_VEHICULO, type CondicionVehiculo, type EstadoUsoVehiculo } from '../../types/vehiculo';
import {
  itemVehiculoDraftToFormInput,
  itemVehiculoRegistroFormSchema,
  type ItemVehiculoRegistroForm,
} from '../../schemas/registroVehiculo.schema';
import { formatMoneda } from '../../utils/formatters';
import ResponsableAlmacenField from '../forms/ResponsableAlmacenField';
import { resolveResponsableForAlmacen } from '../../utils/registroBienMappers';
import type { MonedaRegistro } from '../../types/registroBienItem';

type NuevoItemVehiculoRegistroModalProps = {
  open: boolean;
  onClose: () => void;
  item: ItemVehiculoRegistroDraft | null;
  almacenOptions: string[];
  almacenes: ApiAlmacen[];
  departamentoOptions: readonly string[];
  moneda: MonedaRegistro;
  onSave: (item: ItemVehiculoRegistroDraft) => void;
  onDelete?: (key: string) => void;
};

type SelectOption = { id: number; nombre: string };

function createEmptyItem(almacenDefault: string, unidadDefault: string): ItemVehiculoRegistroDraft {
  return {
    key: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    codigoInterno: '',
    placa: '',
    descripcion: '',
    marca: '',
    modelo: '',
    color: '',
    anioFabricacion: new Date().getFullYear(),
    serialMotor: '',
    serialCarroceria: '',
    cantidad: 1,
    valorAdquisicion: 0,
    unidadAdministrativa: unidadDefault,
    responsable: '',
    ciResponsable: '',
    almacen: almacenDefault,
    idCategoriaGeneral: 0,
    categoriaGeneralNombre: '',
    idSubcategoria: 0,
    subcategoriaNombre: '',
    idCategoriaEspecifica: 0,
    categoriaEspecificaNombre: '',
    estadoUso: 'En uso',
    condicionFisica: 'Bueno',
    observaciones: '',
  };
}

export default function NuevoItemVehiculoRegistroModal({
  open,
  onClose,
  item,
  almacenOptions,
  almacenes,
  departamentoOptions,
  moneda,
  onSave,
  onDelete,
}: NuevoItemVehiculoRegistroModalProps) {
  const unidadDefault = departamentoOptions[0] ?? '';
  const almacenDefault = almacenOptions[0] ?? '';

  const [itemKey, setItemKey] = useState('');
  const [responsable, setResponsable] = useState('');
  const [ciResponsable, setCiResponsable] = useState('');
  const [departamentosApi, setDepartamentosApi] = useState<{ id: number; nombre: string }[]>([]);
  const [categoriasGenerales, setCategoriasGenerales] = useState<SelectOption[]>([]);
  const [subcategorias, setSubcategorias] = useState<SelectOption[]>([]);
  const [categoriasEspecificas, setCategoriasEspecificas] = useState<SelectOption[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ItemVehiculoRegistroForm>({
    resolver: zodResolver(itemVehiculoRegistroFormSchema),
    defaultValues: itemVehiculoDraftToFormInput(createEmptyItem(almacenDefault, unidadDefault)),
  });

  const idCategoriaGeneral = watch('idCategoriaGeneral');
  const idSubcategoria = watch('idSubcategoria');
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
    reset(itemVehiculoDraftToFormInput(draft));

    fetchDepartamentos({ page: 1, limit: API_MAX_LIMIT }).then((res) => {
      setDepartamentosApi(
        (res.data ?? []).map((d) => ({
          id: d.id_departamento,
          nombre: d.nombre,
        })),
      );
    });

    fetchCategoriasGenerales({ page: 1, limit: API_MAX_LIMIT }).then((res) => {
      setCategoriasGenerales(
        (res.data ?? []).map((c) => ({
          id: c.id_categoria_general,
          nombre: c.nombre,
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

  const departamentosSelect = useMemo(() => {
    const fromCatalog = [...departamentoOptions];
    if (fromCatalog.length > 0) return fromCatalog;
    return departamentosApi.map((d) => d.nombre);
  }, [departamentoOptions, departamentosApi]);

  const totalCalculado = (cantidad || 0) * (valorAdquisicion || 0);

  const loadResponsableForAlmacen = async (nombreAlmacen: string) => {
    const result = await resolveResponsableForAlmacen(nombreAlmacen, almacenes);
    setResponsable(result.responsable);
    setCiResponsable(result.ciResponsable);
    setValue('ciResponsable', result.ciResponsable, { shouldValidate: true });
  };

  useEffect(() => {
    if (!open || !almacen) return;
    void loadResponsableForAlmacen(almacen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, almacen, almacenes]);

  const onSubmit = (parsed: ItemVehiculoRegistroForm) => {
    onSave({
      key: itemKey,
      codigoInterno: parsed.codigoInterno.trim(),
      placa: parsed.placa.trim(),
      descripcion: parsed.descripcion,
      marca: parsed.marca,
      color: parsed.color,
      modelo: parsed.modelo,
      anioFabricacion: parsed.anioFabricacion,
      serialMotor: parsed.serialMotor.trim(),
      serialCarroceria: parsed.serialCarroceria.trim(),
      cantidad: parsed.cantidad,
      valorAdquisicion: parsed.valorAdquisicion,
      unidadAdministrativa: parsed.unidadAdministrativa,
      responsable,
      ciResponsable: (ciResponsable || parsed.ciResponsable).trim(),
      almacen: parsed.almacen,
      idCategoriaGeneral: parsed.idCategoriaGeneral,
      idSubcategoria: parsed.idSubcategoria,
      idCategoriaEspecifica: parsed.idCategoriaEspecifica,
      estadoUso: parsed.estadoUso,
      condicionFisica: parsed.condicionFisica,
      observaciones: parsed.observaciones,
      categoriaGeneralNombre:
        categoriasGenerales.find((c) => c.id === parsed.idCategoriaGeneral)?.nombre ?? '',
      subcategoriaNombre: subcategorias.find((c) => c.id === parsed.idSubcategoria)?.nombre ?? '',
      categoriaEspecificaNombre:
        categoriasEspecificas.find((c) => c.id === parsed.idCategoriaEspecifica)?.nombre ?? '',
    });
    onClose();
  };

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
      <div className="w-full space-y-8">
        <section className="space-y-4">
          <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Datos del vehículo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ModalField label="Código *" error={errors.codigoInterno?.message}>
              <input
                {...register('codigoInterno')}
                className="input-field w-full font-mono"
                autoComplete="off"
              />
            </ModalField>
            <ModalField label="Placa / Serial *" error={errors.placa?.message}>
              <Controller
                name="placa"
                control={control}
                render={({ field }) => (
                  <input
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    className="input-field w-full font-mono"
                  />
                )}
              />
            </ModalField>
            <ModalField label="Descripción *" error={errors.descripcion?.message} className="md:col-span-2">
              <input {...register('descripcion')} className="input-field w-full" />
            </ModalField>
            <ModalField label="Marca" error={errors.marca?.message}>
              <input {...register('marca')} className="input-field w-full" />
            </ModalField>
            <ModalField label="Modelo" error={errors.modelo?.message}>
              <input {...register('modelo')} className="input-field w-full" />
            </ModalField>
            <ModalField label="Color" error={errors.color?.message}>
              <input {...register('color')} className="input-field w-full" />
            </ModalField>
            <ModalField label="Año de fabricación *" error={errors.anioFabricacion?.message}>
              <Controller
                name="anioFabricacion"
                control={control}
                render={({ field }) => (
                  <FlexibleIntegerInput
                    value={field.value}
                    onChange={field.onChange}
                    className="input-field w-full"
                    placeholder={String(new Date().getFullYear())}
                  />
                )}
              />
            </ModalField>
            <ModalField label="Serial del motor" error={errors.serialMotor?.message}>
              <input {...register('serialMotor')} className="input-field w-full font-mono" />
            </ModalField>
            <ModalField label="Serial de carrocería" error={errors.serialCarroceria?.message}>
              <input {...register('serialCarroceria')} className="input-field w-full font-mono" />
            </ModalField>
            <ModalField label="Cantidad *" error={errors.cantidad?.message}>
              <Controller
                name="cantidad"
                control={control}
                render={({ field }) => (
                  <FlexibleIntegerInput value={field.value} onChange={field.onChange} className="input-field w-full" />
                )}
              />
            </ModalField>
            <ModalField label="Valor de Adquisición *" error={errors.valorAdquisicion?.message}>
              <Controller
                name="valorAdquisicion"
                control={control}
                render={({ field }) => (
                  <CurrencyAmountInput value={field.value} onChange={field.onChange} className="input-field w-full" />
                )}
              />
            </ModalField>
            <ModalField label="Total calculado">
              <div className="input-field w-full bg-gray-50 font-semibold text-navy-900">
                {formatMoneda(totalCalculado, moneda)}
              </div>
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
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Clasificación y estado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ModalField label="Estado de uso *" error={errors.estadoUso?.message}>
              <Controller
                name="estadoUso"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={(value) => field.onChange(value as EstadoUsoVehiculo)}
                    options={ESTADOS_USO_VEHICULO}
                  />
                )}
              />
            </ModalField>
            <ModalField label="Condición Física *" error={errors.condicionFisica?.message}>
              <Controller
                name="condicionFisica"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onChange={(value) => field.onChange(value as CondicionVehiculo)}
                    options={CONDICIONES_VEHICULO}
                  />
                )}
              />
            </ModalField>
          </div>
          <ModalField label="Observaciones" error={errors.observaciones?.message}>
            <textarea {...register('observaciones')} className="input-field w-full" rows={4} />
          </ModalField>
        </section>
      </div>
    </Modal>
  );
}
