import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import CurrencyAmountInput from '../forms/CurrencyAmountInput';
import FlexibleIntegerInput from '../forms/FlexibleIntegerInput';
import ModalField from './ModalField';
import {
  fetchCategoriasEspecificasBySubcategoriaId,
  fetchCategoriasGenerales,
  fetchSubcategoriasByGeneral,
} from '../../api/services/categorias.service';
import { fetchDepartamentos, fetchDepartamentoResponsables } from '../../api/services/departamentos.service';
import type { ItemVehiculoRegistroDraft } from '../../types/registroVehiculoItem';
import { CONDICIONES_VEHICULO, ESTADOS_USO_VEHICULO, type CondicionVehiculo, type EstadoUsoVehiculo } from '../../types/vehiculo';
import {
  itemVehiculoDraftToFormInput,
  itemVehiculoRegistroFormSchema,
} from '../../schemas/registroVehiculo.schema';
import { validarConZod } from '../../utils/validators';
import { formatMoneda } from '../../utils/formatters';
import { normalizeCatalogValue } from '../../utils/registroBienMappers';
import type { MonedaRegistro } from '../../types/registroBienItem';

type NuevoItemVehiculoRegistroModalProps = {
  open: boolean;
  onClose: () => void;
  item: ItemVehiculoRegistroDraft | null;
  almacenOptions: string[];
  departamentoOptions: readonly string[];
  moneda: MonedaRegistro;
  onSave: (item: ItemVehiculoRegistroDraft) => void;
  onDelete?: (key: string) => void;
};

type SelectOption = { id: number; nombre: string };

function createEmptyItem(
  almacenDefault: string,
  unidadDefault: string,
): ItemVehiculoRegistroDraft {
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
    cantidad: 0,
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
  departamentoOptions,
  moneda,
  onSave,
  onDelete,
}: NuevoItemVehiculoRegistroModalProps) {
  const unidadDefault = departamentoOptions[0] ?? '';
  const almacenDefault = almacenOptions[0] ?? '';

  const [form, setForm] = useState<ItemVehiculoRegistroDraft>(() =>
    createEmptyItem(almacenDefault, unidadDefault),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departamentosApi, setDepartamentosApi] = useState<{ id: number; nombre: string }[]>([]);
  const [categoriasGenerales, setCategoriasGenerales] = useState<SelectOption[]>([]);
  const [subcategorias, setSubcategorias] = useState<SelectOption[]>([]);
  const [categoriasEspecificas, setCategoriasEspecificas] = useState<SelectOption[]>([]);

  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(item ? { ...item } : createEmptyItem(almacenDefault, unidadDefault));

    fetchDepartamentos({ page: 1, limit: 500 }).then((res) => {
      setDepartamentosApi(
        (res.data ?? []).map((d) => ({
          id: d.id_departamento,
          nombre: d.nombre,
        })),
      );
    });

    fetchCategoriasGenerales({ page: 1, limit: 500 }).then((res) => {
      setCategoriasGenerales(
        (res.data ?? []).map((c) => ({
          id: c.id_categoria_general,
          nombre: c.nombre,
        })),
      );
    });
  }, [open, item, almacenDefault, unidadDefault]);

  useEffect(() => {
    if (!open || !form.idCategoriaGeneral) {
      setSubcategorias([]);
      return;
    }
    fetchSubcategoriasByGeneral(form.idCategoriaGeneral).then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setSubcategorias(
        list.map((s) => ({
          id: s.id_subcategoria,
          nombre: s.nombre,
        })),
      );
    });
  }, [open, form.idCategoriaGeneral]);

  useEffect(() => {
    if (!open || !form.idSubcategoria) {
      setCategoriasEspecificas([]);
      return;
    }
    fetchCategoriasEspecificasBySubcategoriaId(form.idSubcategoria).then((rows) => {
      const list = Array.isArray(rows) ? rows : [];
      setCategoriasEspecificas(
        list.map((c) => ({
          id: c.id_categoria_especifica,
          nombre: c.nombre,
        })),
      );
    });
  }, [open, form.idSubcategoria]);

  const departamentosSelect = useMemo(() => {
    const fromCatalog = [...departamentoOptions];
    if (fromCatalog.length > 0) return fromCatalog;
    return departamentosApi.map((d) => d.nombre);
  }, [departamentoOptions, departamentosApi]);
  const totalCalculado = (form.cantidad || 0) * (form.valorAdquisicion || 0);

  const updateForm = <K extends keyof ItemVehiculoRegistroDraft>(
    key: K,
    value: ItemVehiculoRegistroDraft[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const loadResponsableForUnidad = async (nombreUnidad: string) => {
    const departamento = departamentosApi.find(
      (d) => normalizeCatalogValue(d.nombre) === normalizeCatalogValue(nombreUnidad),
    );
    if (!departamento) {
      setForm((prev) => ({ ...prev, responsable: '', ciResponsable: '' }));
      return;
    }
    try {
      const responsables = await fetchDepartamentoResponsables(departamento.id);
      const principal = responsables[0];
      setForm((prev) => ({
        ...prev,
        responsable: principal?.nombre ?? '—',
        ciResponsable: principal?.ci_responsable ?? '',
      }));
    } catch {
      setForm((prev) => ({ ...prev, responsable: '—', ciResponsable: '' }));
    }
  };

  const handleUnidadChange = (nombre: string) => {
    updateForm('unidadAdministrativa', nombre);
    void loadResponsableForUnidad(nombre);
  };

  useEffect(() => {
    if (!open || !form.unidadAdministrativa || departamentosApi.length === 0) return;
    void loadResponsableForUnidad(form.unidadAdministrativa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.unidadAdministrativa, departamentosApi.length]);

  const handleAgregar = () => {
    const result = validarConZod(itemVehiculoRegistroFormSchema, itemVehiculoDraftToFormInput(form));
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    const parsed = result.data!;
    onSave({
      ...form,
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
      almacen: parsed.almacen,
      idCategoriaGeneral: parsed.idCategoriaGeneral,
      idSubcategoria: parsed.idSubcategoria,
      idCategoriaEspecifica: parsed.idCategoriaEspecifica,
      estadoUso: parsed.estadoUso,
      condicionFisica: parsed.condicionFisica,
      observaciones: parsed.observaciones,
      categoriaGeneralNombre:
        categoriasGenerales.find((c) => c.id === parsed.idCategoriaGeneral)?.nombre ?? form.categoriaGeneralNombre,
      subcategoriaNombre:
        subcategorias.find((c) => c.id === parsed.idSubcategoria)?.nombre ?? form.subcategoriaNombre,
      categoriaEspecificaNombre:
        categoriasEspecificas.find((c) => c.id === parsed.idCategoriaEspecifica)?.nombre ??
        form.categoriaEspecificaNombre,
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
                onDelete(form.key);
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
              onClick={handleAgregar}
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
            <ModalField label="Código *" error={errors.codigoInterno}>
              <input
                value={form.codigoInterno}
                onChange={(e) => updateForm('codigoInterno', e.target.value)}
                className="input-field w-full"
                placeholder="VH-001"
              />
            </ModalField>
            <ModalField label="Placa / Serial *" error={errors.placa}>
              <input
                value={form.placa}
                onChange={(e) => updateForm('placa', e.target.value.toUpperCase())}
                className="input-field w-full font-mono"
              />
            </ModalField>
            <ModalField label="Descripción *" error={errors.descripcion} className="md:col-span-2">
              <input
                value={form.descripcion}
                onChange={(e) => updateForm('descripcion', e.target.value)}
                className="input-field w-full"
              />
            </ModalField>
            <ModalField label="Marca" error={errors.marca}>
              <input
                value={form.marca}
                onChange={(e) => updateForm('marca', e.target.value)}
                className="input-field w-full"
              />
            </ModalField>
            <ModalField label="Modelo" error={errors.modelo}>
              <input
                value={form.modelo}
                onChange={(e) => updateForm('modelo', e.target.value)}
                className="input-field w-full"
              />
            </ModalField>
            <ModalField label="Color" error={errors.color}>
              <input
                value={form.color}
                onChange={(e) => updateForm('color', e.target.value)}
                className="input-field w-full"
              />
            </ModalField>
            <ModalField label="Año de fabricación *" error={errors.anioFabricacion}>
              <FlexibleIntegerInput
                value={form.anioFabricacion}
                onChange={(value) => updateForm('anioFabricacion', value)}
                className="input-field w-full"
                placeholder={String(new Date().getFullYear())}
              />
            </ModalField>
            <ModalField label="Serial del motor" error={errors.serialMotor}>
              <input
                value={form.serialMotor}
                onChange={(e) => updateForm('serialMotor', e.target.value)}
                className="input-field w-full font-mono"
              />
            </ModalField>
            <ModalField label="Serial de carrocería" error={errors.serialCarroceria}>
              <input
                value={form.serialCarroceria}
                onChange={(e) => updateForm('serialCarroceria', e.target.value)}
                className="input-field w-full font-mono"
              />
            </ModalField>
            <ModalField label="Cantidad *" error={errors.cantidad}>
              <FlexibleIntegerInput
                value={form.cantidad}
                onChange={(value) => updateForm('cantidad', value)}
                className="input-field w-full"
              />
            </ModalField>
            <ModalField label="Valor de Adquisición *" error={errors.valorAdquisicion}>
              <CurrencyAmountInput
                value={form.valorAdquisicion}
                onChange={(value) => updateForm('valorAdquisicion', value)}
                className="input-field w-full"
              />
            </ModalField>
            <ModalField label="Total calculado">
              <div className="input-field w-full bg-gray-50 font-semibold text-navy-900">
                {formatMoneda(totalCalculado, moneda)}
              </div>
            </ModalField>
            <ModalField label="Unidad Administrativa *" error={errors.unidadAdministrativa}>
              <select
                value={form.unidadAdministrativa}
                onChange={(e) => handleUnidadChange(e.target.value)}
                className="input-field w-full"
              >
                {departamentosSelect.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Almacén *" error={errors.almacen}>
              <select
                value={form.almacen}
                onChange={(e) => updateForm('almacen', e.target.value)}
                className="input-field w-full"
              >
                {almacenOptions.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Responsable" className="md:col-span-2">
              <input
                value={form.responsable || '—'}
                readOnly
                className="input-field w-full bg-gray-50 text-gray-700"
              />
            </ModalField>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wide border-b border-gray-100 pb-2">
            Clasificación y estado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <ModalField label="Categoría *" error={errors.idCategoriaGeneral}>
              <select
                value={form.idCategoriaGeneral || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const nombre = categoriasGenerales.find((c) => c.id === id)?.nombre ?? '';
                  setForm((prev) => ({
                    ...prev,
                    idCategoriaGeneral: id,
                    categoriaGeneralNombre: nombre,
                    idSubcategoria: 0,
                    subcategoriaNombre: '',
                    idCategoriaEspecifica: 0,
                    categoriaEspecificaNombre: '',
                  }));
                }}
                className="input-field w-full"
              >
                <option value="">Seleccionar...</option>
                {categoriasGenerales.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Sub Categoría *" error={errors.idSubcategoria}>
              <select
                value={form.idSubcategoria || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const nombre = subcategorias.find((c) => c.id === id)?.nombre ?? '';
                  setForm((prev) => ({
                    ...prev,
                    idSubcategoria: id,
                    subcategoriaNombre: nombre,
                    idCategoriaEspecifica: 0,
                    categoriaEspecificaNombre: '',
                  }));
                }}
                className="input-field w-full"
                disabled={!form.idCategoriaGeneral}
              >
                <option value="">Seleccionar...</option>
                {subcategorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Categoría Específica *" error={errors.idCategoriaEspecifica}>
              <select
                value={form.idCategoriaEspecifica || ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const nombre = categoriasEspecificas.find((c) => c.id === id)?.nombre ?? '';
                  setForm((prev) => ({
                    ...prev,
                    idCategoriaEspecifica: id,
                    categoriaEspecificaNombre: nombre,
                  }));
                }}
                className="input-field w-full"
                disabled={!form.idSubcategoria}
              >
                <option value="">Seleccionar...</option>
                {categoriasEspecificas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </ModalField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <ModalField label="Estado de uso *" error={errors.estadoUso}>
              <select
                value={form.estadoUso}
                onChange={(e) => updateForm('estadoUso', e.target.value as EstadoUsoVehiculo)}
                className="input-field w-full"
              >
                {ESTADOS_USO_VEHICULO.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Condición Física *" error={errors.condicionFisica}>
              <select
                value={form.condicionFisica}
                onChange={(e) => updateForm('condicionFisica', e.target.value as CondicionVehiculo)}
                className="input-field w-full"
              >
                {CONDICIONES_VEHICULO.map((condicion) => (
                  <option key={condicion} value={condicion}>
                    {condicion}
                  </option>
                ))}
              </select>
            </ModalField>
          </div>
          <ModalField label="Observaciones" error={errors.observaciones}>
            <textarea
              value={form.observaciones}
              onChange={(e) => updateForm('observaciones', e.target.value)}
              className="input-field w-full"
              rows={4}
            />
          </ModalField>
        </section>
      </div>
    </Modal>
  );
}
