import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from './Modal';
import NuevoItemVehiculoRegistroModal from './NuevoItemVehiculoRegistroModal';
import SearchableSelect from '../forms/SearchableSelect';
import { createDocumento, type FormaAdquisicionDocumento } from '../../api/services/documentos.service';
import { fetchSedes } from '../../api/services/sedes.service';
import { API_MAX_LIMIT } from '../../api/pagination';
import { fetchResponsableByCi } from '../../api/services/responsables.service';
import { createVehiculo } from '../../api/services/vehiculos.service';
import type { ApiAlmacen, ApiSede } from '../../api/types';
import {
  almacenesPorSede,
  departamentosPorSede,
  SEDES_VEHICULOS,
} from '../../data/bienesCatalogos';
import { MONEDAS_REGISTRO } from '../../types/registroBienItem';
import type { ItemVehiculoRegistroDraft } from '../../types/registroVehiculoItem';
import { documentoRegistroFormSchema, type DocumentoRegistroForm } from '../../schemas/registro.schema';
import {
  itemVehiculoDraftToFormInput,
  registroVehiculosListSchema,
} from '../../schemas/registroVehiculo.schema';
import { formatMoneda } from '../../utils/formatters';
import { validarConZod } from '../../utils/validators';
import { toApiDateTime } from '../../api/mappers/enums';
import { almacenNombresPorSede, monedaBienToDocumento, normalizeCatalogValue } from '../../utils/registroBienMappers';
import { useAlmacenesRegistro } from '../../hooks/useAlmacenesRegistro';
import { buildRegistroVehiculosSuccessMessage } from '../../utils/assetNotify';
import { rollbackRegistroVehiculos } from '../../utils/registroRollback';
import { itemVehiculoToPayload, resolveAlmacenIdVehiculo } from '../../utils/registroVehiculoMappers';
import { ciResponsableForApi } from '../../utils/vehiculoApiFields';
import {
  extractRegistroError,
  notifyRegistroError,
  notifyRegistroSuccess,
} from '../../utils/registroNotify';

type RegistroVehiculosModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const FORMAS_DOCUMENTO: { label: string; value: FormaAdquisicionDocumento }[] = [
  { label: 'Compra', value: 'Compra' },
  { label: 'Donación', value: 'Donacion' },
  { label: 'Confiscación', value: 'Confiscacion' },
];

const SEDE_LABELS: Record<string, string> = {
  'Edificio Administrativo Ferrocasa': 'Edificio Administrativo',
  'Área Externa': 'Áreas externas',
  Cementerio: 'Cementerio',
};

function sedeLabel(value: string) {
  return SEDE_LABELS[value] ?? value;
}

function documentoDefaultValues(): DocumentoRegistroForm {
  return {
    numeroDocumento: '',
    nombreProveedor: '',
    fechaAdquisicion: '',
    formaAdquisicion: 'Compra',
    sede: SEDES_VEHICULOS[0],
    moneda: 'Bs',
  };
}

function totalItem(item: ItemVehiculoRegistroDraft) {
  return (item.cantidad || 0) * (item.valorAdquisicion || 0);
}

export default function RegistroVehiculosModal({
  open,
  onClose,
  onSuccess,
  onError,
}: RegistroVehiculosModalProps) {
  const { almacenes } = useAlmacenesRegistro(open);
  const [items, setItems] = useState<ItemVehiculoRegistroDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemVehiculoRegistroDraft | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [sedesApi, setSedesApi] = useState<ApiSede[]>([]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors: documentoErrors },
  } = useForm<DocumentoRegistroForm>({
    resolver: zodResolver(documentoRegistroFormSchema),
    defaultValues: documentoDefaultValues(),
  });

  const sede = watch('sede');
  const moneda = watch('moneda');
  const prevSedeRef = useRef(sede);

  const almacenOptions = useMemo(
    () => almacenNombresPorSede(almacenes, sede, sedesApi, almacenesPorSede(sede)),
    [almacenes, sede, sedesApi],
  );

  const departamentoOptions = useMemo(
    () => departamentosPorSede(sede),
    [sede],
  );

  const sedeSelectOptions = useMemo(() => {
    const catalogNormalized = new Set(SEDES_VEHICULOS.map(normalizeCatalogValue));
    const fromApi = sedesApi.filter((sedeApi) => {
      const apiName = normalizeCatalogValue(sedeApi.nombre);
      return [...catalogNormalized].some(
        (catalogName) => apiName === catalogName || apiName.includes(catalogName) || catalogName.includes(apiName),
      );
    });
    if (fromApi.length > 0) {
      return fromApi.map((sedeApi) => ({ value: sedeApi.nombre, label: sedeLabel(sedeApi.nombre) }));
    }
    return SEDES_VEHICULOS.map((s) => ({ value: s, label: sedeLabel(s) }));
  }, [sedesApi]);

  const valorTotalDocumento = useMemo(
    () => items.reduce((sum, item) => sum + totalItem(item), 0),
    [items],
  );

  useEffect(() => {
    if (!open) return;
    reset(documentoDefaultValues());
    setItems([]);
    setEditingItem(null);
    setItemModalOpen(false);
    setItemsError(null);
    prevSedeRef.current = SEDES_VEHICULOS[0];

    fetchSedes({ page: 1, limit: API_MAX_LIMIT }).then((res) => {
      setSedesApi(res.data ?? []);
    });
  }, [open, reset]);

  useEffect(() => {
    if (prevSedeRef.current === sede) return;
    prevSedeRef.current = sede;
    setItems([]);
    setEditingItem(null);
    setItemModalOpen(false);
    setItemsError(null);
  }, [sede]);

  const abrirNuevoItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const abrirEditarItem = (item: ItemVehiculoRegistroDraft) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const guardarItem = (item: ItemVehiculoRegistroDraft) => {
    setItems((prev) => {
      const existe = prev.some((i) => i.key === item.key);
      if (existe) return prev.map((i) => (i.key === item.key ? item : i));
      return [...prev, item];
    });
  };

  const eliminarItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  async function ensureResponsablesVehiculos(itemsToCheck: ItemVehiculoRegistroDraft[]) {
    for (const [index, item] of itemsToCheck.entries()) {
      const ci = ciResponsableForApi(item.ciResponsable);
      if (!ci) {
        throw new Error(
          `El ítem ${index + 1} (${item.placa || 'sin placa'}): seleccione un responsable registrado en el sistema.`,
        );
      }

      try {
        await fetchResponsableByCi(ci);
      } catch {
        throw new Error(
          `El ítem ${index + 1} (${item.placa}): la CI ${ci} no está registrada como responsable. Créela en Configuración antes de cargar.`,
        );
      }
    }
  }

  const validarItems = (): string | null => {
    const itemsResult = validarConZod(
      registroVehiculosListSchema,
      items.map((item) => itemVehiculoDraftToFormInput(item)),
    );
    if (!itemsResult.success) {
      const message = Object.values(itemsResult.errors)[0] ?? 'Revise los ítems agregados';
      setItemsError(message);
      return message;
    }
    setItemsError(null);

    for (const [index, item] of items.entries()) {
      const idAlmacen = resolveAlmacenIdVehiculo(item.almacen, almacenes);
      if (!idAlmacen) {
        const message = `El almacén "${item.almacen}" del ítem ${index + 1} debe existir en configuración`;
        setItemsError(message);
        return message;
      }
    }
    return null;
  };

  const handleCargar = handleSubmit(async (documento) => {
    const validationError = validarItems();
    if (validationError) {
      notifyRegistroError('No se pudo cargar el registro', validationError);
      onError(validationError);
      return;
    }

    setSubmitting(true);
    let idDoc: number | null = null;
    const codigosVehiculo: number[] = [];

    try {
      await ensureResponsablesVehiculos(items);

      const numeroDocumento = documento.numeroDocumento?.trim() || undefined;

      const documentoCreado = await createDocumento({
        numero_documento: numeroDocumento,
        nombre_proveedor: documento.nombreProveedor.trim(),
        forma_adquisicion: documento.formaAdquisicion,
        fecha_adquisicion: toApiDateTime(documento.fechaAdquisicion),
        moneda: monedaBienToDocumento(documento.moneda),
      });

      idDoc = documentoCreado.id_doc;
      const fechaIngreso = new Date().toISOString().split('T')[0];

      for (const item of items) {
        const idAlmacen = resolveAlmacenIdVehiculo(item.almacen, almacenes)!;
        const vehiculoCreado = await createVehiculo(
          itemVehiculoToPayload(item, {
            idDoc,
            fechaIngreso,
            idAlmacen,
            numeroDocumento: numeroDocumento ?? documentoCreado.numero_documento ?? undefined,
          }),
        );
        codigosVehiculo.push(vehiculoCreado.id);
      }

      const message = buildRegistroVehiculosSuccessMessage({
        numeroDocumento: documento.numeroDocumento,
        nombreProveedor: documento.nombreProveedor,
        items,
      });
      notifyRegistroSuccess(message);
      onSuccess(message);
      onClose();
    } catch (err) {
      await rollbackRegistroVehiculos({ idDoc, codigosVehiculo });
      const message = extractRegistroError(err, 'No se pudo cargar el registro');
      notifyRegistroError('No se pudo cargar el registro', message);
      onError(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Registro de Vehículos y Maquinaria"
        maxWidth="6xl"
        footer={
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCargar}
              disabled={submitting}
              className="px-8 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
            >
              {submitting ? 'Cargando...' : 'Cargar'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <section className="border border-gray-300 rounded-lg p-4 sm:p-5 space-y-4">
            <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wide">
              Detalles del documento de Ingreso
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Nro de Documento">
                <input
                  type="text"
                  {...register('numeroDocumento')}
                  placeholder="Ingrese nro de documento"
                  className="input-field"
                />
              </Field>
              <Field label="Nombre de Proveedor">
                <input
                  type="text"
                  {...register('nombreProveedor')}
                  className={`input-field ${documentoErrors.nombreProveedor ? 'border-red-400' : ''}`}
                />
                {documentoErrors.nombreProveedor && (
                  <p className="text-xs text-red-600 mt-1">{documentoErrors.nombreProveedor.message}</p>
                )}
              </Field>
              <Field label="Fecha Adquisición">
                <input
                  type="date"
                  {...register('fechaAdquisicion')}
                  className={`input-field ${documentoErrors.fechaAdquisicion ? 'border-red-400' : ''}`}
                />
                {documentoErrors.fechaAdquisicion && (
                  <p className="text-xs text-red-600 mt-1">{documentoErrors.fechaAdquisicion.message}</p>
                )}
              </Field>
              <Field label="Forma de Adquisición">
                <Controller
                  name="formaAdquisicion"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={(value) => field.onChange(value as FormaAdquisicionDocumento)}
                      options={FORMAS_DOCUMENTO}
                    />
                  )}
                />
              </Field>
              <Field label="Sede">
                <Controller
                  name="sede"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect value={field.value} onChange={field.onChange} options={sedeSelectOptions} />
                  )}
                />
              </Field>
              <Field label="Moneda">
                <Controller
                  name="moneda"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={MONEDAS_REGISTRO}
                    />
                  )}
                />
              </Field>
              <Field label="Valor Total de Documento">
                <div className="input-field bg-gray-50 font-semibold text-navy-900">
                  {formatMoneda(valorTotalDocumento, moneda)}
                </div>
              </Field>
            </div>
          </section>

          <section className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th>Código</Th>
                  <Th>Descripción</Th>
                  <Th>Marca</Th>
                  <Th>Modelo</Th>
                  <Th>Color</Th>
                  <Th>Placa</Th>
                  <Th>Almacén</Th>
                  <Th>Cantidad</Th>
                  <Th>Valor de adquisición</Th>
                  <Th>Total</Th>
                  <Th className="text-center w-16">Editar</Th>
                  <Th className="text-center w-20">
                    <button
                      type="button"
                      onClick={abrirNuevoItem}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-navy-300 text-navy-800 hover:bg-navy-50"
                      title="Agregar nuevo ítem"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="sr-only">Agregar Nuevo Item</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-10 text-center text-sm text-gray-400">
                      No hay ítems agregados. Use el botón + para registrar cada vehículo.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.key}
                      className={`border-b border-gray-100 ${index % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}`}
                    >
                      <Td>
                        <span className="font-mono text-xs">{item.codigoInterno || '—'}</span>
                      </Td>
                      <Td>
                        <span className="block max-w-[180px] truncate">{item.descripcion}</span>
                      </Td>
                      <Td>{item.marca || '—'}</Td>
                      <Td>{item.modelo || '—'}</Td>
                      <Td>{item.color || '—'}</Td>
                      <Td>
                        <span className="font-mono text-xs">{item.placa}</span>
                      </Td>
                      <Td>
                        <span className="block max-w-[140px] truncate">{item.almacen}</span>
                      </Td>
                      <Td>{item.cantidad.toLocaleString('es-VE')}</Td>
                      <Td>{formatMoneda(item.valorAdquisicion, moneda)}</Td>
                      <Td>{formatMoneda(totalItem(item), moneda)}</Td>
                      <Td className="text-center">
                        <button
                          type="button"
                          onClick={() => abrirEditarItem(item)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-navy-700 hover:bg-navy-50 hover:border-navy-300"
                          title="Editar ítem"
                        >
                          <Pencil size={15} />
                        </button>
                      </Td>
                      <Td />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {itemsError && <p className="text-xs text-red-600 p-3">{itemsError}</p>}
          </section>
        </div>
      </Modal>

      <NuevoItemVehiculoRegistroModal
        open={itemModalOpen}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        almacenOptions={almacenOptions}
        almacenes={almacenes}
        departamentoOptions={departamentoOptions}
        moneda={moneda}
        onSave={guardarItem}
        onDelete={eliminarItem}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function Th({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`text-left text-xs font-semibold text-gray-600 uppercase px-3 py-2.5 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle text-gray-800 ${className}`}>{children}</td>;
}
