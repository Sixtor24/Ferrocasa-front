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
import type { ConsumibilidadBienApi } from '../../api/services/bienes.service';
import type { ItemRegistroDraft, MonedaRegistro, RegistroBienesModulo } from '../../types/registroBienItem';
import { CONDICIONES_FISICAS, ESTADOS_USO, type CondicionFisica, type EstadoUso } from '../../types/bien';
import { itemDraftToFormInput, itemRegistroFormSchema } from '../../schemas/registro.schema';
import { validarConZod } from '../../utils/validators';
import { formatMoneda } from '../../utils/formatters';
import { normalizeCatalogValue } from '../../utils/registroBienMappers';

type NuevoItemRegistroModalProps = {
  open: boolean;
  onClose: () => void;
  modulo: RegistroBienesModulo;
  item: ItemRegistroDraft | null;
  almacenOptions: string[];
  departamentoOptions: readonly string[];
  moneda: MonedaRegistro;
  onSave: (item: ItemRegistroDraft) => void;
  onDelete?: (key: string) => void;
};

type SelectOption = { id: number; nombre: string };

const CONSUMIBILIDAD_OPTIONS: { label: string; value: ConsumibilidadBienApi }[] = [
  { label: 'No perecederos', value: 'No_Perecederos' },
  { label: 'Perecederos', value: 'Perecederos' },
];

function createEmptyItem(
  almacenDefault: string,
  unidadDefault: string,
): ItemRegistroDraft {
  return {
    key: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    codigoInterno: '',
    descripcion: '',
    color: '',
    cantidad: 0,
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
    consumibilidad: 'No_Perecederos',
    condicionFisica: 'Bueno',
  };
}

export default function NuevoItemRegistroModal({
  open,
  onClose,
  modulo,
  item,
  almacenOptions,
  departamentoOptions,
  moneda,
  onSave,
  onDelete,
}: NuevoItemRegistroModalProps) {
  const unidadDefault = departamentoOptions[0] ?? '';
  const almacenDefault = almacenOptions[0] ?? '';

  const [form, setForm] = useState<ItemRegistroDraft>(() => createEmptyItem(almacenDefault, unidadDefault));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categoriasGenerales, setCategoriasGenerales] = useState<SelectOption[]>([]);
  const [subcategorias, setSubcategorias] = useState<SelectOption[]>([]);
  const [categoriasEspecificas, setCategoriasEspecificas] = useState<SelectOption[]>([]);
  const [departamentosApi, setDepartamentosApi] = useState<{ id: number; nombre: string }[]>([]);

  const isEditing = Boolean(item);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setForm(item ? { ...item } : createEmptyItem(almacenDefault, unidadDefault));

    fetchCategoriasGenerales({ page: 1, limit: 500 }).then((res) => {
      setCategoriasGenerales(
        (res.data ?? []).map((c) => ({
          id: c.id_categoria_general,
          nombre: c.nombre,
        })),
      );
    });

    fetchDepartamentos({ page: 1, limit: 500 }).then((res) => {
      setDepartamentosApi(
        (res.data ?? []).map((d) => ({
          id: d.id_departamento,
          nombre: d.nombre,
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

  const updateForm = <K extends keyof ItemRegistroDraft>(key: K, value: ItemRegistroDraft[K]) => {
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
      updateForm('responsable', '');
      updateForm('ciResponsable', '');
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
    const result = validarConZod(itemRegistroFormSchema, itemDraftToFormInput(form));
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    const parsed = result.data!;
    onSave({
      ...form,
      codigoInterno: parsed.codigoInterno.trim(),
      descripcion: parsed.descripcion,
      color: parsed.color,
      cantidad: parsed.cantidad,
      unidadAdministrativa: parsed.unidadAdministrativa,
      idCategoriaGeneral: parsed.idCategoriaGeneral,
      idSubcategoria: parsed.idSubcategoria,
      idCategoriaEspecifica: parsed.idCategoriaEspecifica,
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
    if (modulo === 'cementerio') return [...departamentoOptions];
    const fromCatalog = [...departamentoOptions];
    if (fromCatalog.length > 0) return fromCatalog;
    return departamentosApi.map((d) => d.nombre);
  }, [modulo, departamentoOptions, departamentosApi]);
  const totalCalculado = (form.cantidad || 0) * (form.valorAdquisicion || 0);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ModalField label="Código *" error={errors.codigoInterno}>
            <input
              value={form.codigoInterno}
              onChange={(e) => updateForm('codigoInterno', e.target.value)}
              className="input-field"
              placeholder="BM-001"
            />
          </ModalField>
          <ModalField label="Descripción *" error={errors.descripcion}>
            <input
              value={form.descripcion}
              onChange={(e) => updateForm('descripcion', e.target.value)}
              className="input-field"
            />
          </ModalField>
          <ModalField label="Color" error={errors.color}>
            <input value={form.color} onChange={(e) => updateForm('color', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Cantidad *" error={errors.cantidad}>
            <FlexibleIntegerInput
              value={form.cantidad}
              onChange={(value) => updateForm('cantidad', value)}
            />
          </ModalField>
          <ModalField label="Unidad Administrativa *" error={errors.unidadAdministrativa}>
            <select
              value={form.unidadAdministrativa}
              onChange={(e) => handleUnidadChange(e.target.value)}
              className="input-field"
            >
              {departamentosSelect.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Responsable">
            <input
              value={form.responsable || '—'}
              readOnly
              className="input-field bg-gray-50 text-gray-700"
              title="Se asigna al elegir la unidad administrativa"
            />
          </ModalField>
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
              className="input-field"
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
              className="input-field"
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
              className="input-field"
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
          <ModalField label="Estado de uso *" error={errors.estadoUso}>
            <select
              value={form.estadoUso}
              onChange={(e) => updateForm('estadoUso', e.target.value as EstadoUso)}
              className="input-field"
            >
              {ESTADOS_USO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </ModalField>
        </div>

        <div className="space-y-4">
          <ModalField label="Serial" error={errors.serial}>
            <div className="flex items-center gap-3">
              <input
                value={form.serial}
                onChange={(e) => updateForm('serial', e.target.value)}
                disabled={form.sinSerial}
                className="input-field flex-1 font-mono"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sinSerial}
                  onChange={(e) => {
                    updateForm('sinSerial', e.target.checked);
                    if (e.target.checked) updateForm('serial', 'S/S');
                  }}
                  className="rounded"
                />
                Sin serial
              </label>
            </div>
          </ModalField>
          <ModalField label="Marca *" error={errors.marca}>
            <input value={form.marca} onChange={(e) => updateForm('marca', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Modelo" error={errors.modelo}>
            <input value={form.modelo} onChange={(e) => updateForm('modelo', e.target.value)} className="input-field" />
          </ModalField>
          <ModalField label="Valor de Adquisición *" error={errors.valorAdquisicion}>
            <CurrencyAmountInput
              value={form.valorAdquisicion}
              onChange={(value) => updateForm('valorAdquisicion', value)}
            />
          </ModalField>
          <ModalField label="Total calculado">
            <div className="input-field bg-gray-50 font-semibold text-navy-900">
              {formatMoneda(totalCalculado, moneda)}
            </div>
          </ModalField>
          <ModalField label="Almacén *" error={errors.almacen}>
            <select
              value={form.almacen}
              onChange={(e) => updateForm('almacen', e.target.value)}
              className="input-field"
            >
              {almacenOptions.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </ModalField>
          <ModalField label="Observaciones" error={errors.observaciones}>
            <textarea
              value={form.observaciones}
              onChange={(e) => updateForm('observaciones', e.target.value)}
              className="input-field"
              rows={4}
            />
          </ModalField>
          <ModalField label="Consumibilidad *" error={errors.consumibilidad}>
            <select
              value={form.consumibilidad}
              onChange={(e) => updateForm('consumibilidad', e.target.value as ConsumibilidadBienApi)}
              className="input-field"
            >
              {CONSUMIBILIDAD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </ModalField>
          {modulo !== 'cementerio' && (
            <ModalField label="Condición Física *" error={errors.condicionFisica}>
              <select
                value={form.condicionFisica}
                onChange={(e) => updateForm('condicionFisica', e.target.value as CondicionFisica)}
                className="input-field"
              >
                {CONDICIONES_FISICAS.map((condicion) => (
                  <option key={condicion} value={condicion}>
                    {condicion}
                  </option>
                ))}
              </select>
            </ModalField>
          )}
        </div>
      </div>
    </Modal>
  );
}
