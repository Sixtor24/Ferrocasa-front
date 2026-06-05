import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pencil, Plus } from 'lucide-react';
import Modal from './Modal';
import NuevoItemRegistroModal from './NuevoItemRegistroModal';
import { createBien } from '../../api/services/bienes.service';
import { createDocumento, type FormaAdquisicionDocumento } from '../../api/services/documentos.service';
import type { ApiAlmacen } from '../../api/types';
import type { DocumentoRegistroDraft, ItemRegistroDraft, RegistroBienesModulo } from '../../types/registroBienItem';
import { MONEDAS_REGISTRO } from '../../types/registroBienItem';
import { formatMoneda } from '../../utils/formatters';
import {
  documentoRegistroFormSchema,
  itemDraftToFormInput,
  registroItemsListSchema,
} from '../../schemas/registro.schema';
import { validarConZod } from '../../utils/validators';
import {
  itemRegistroToBienPayload,
  monedaBienToDocumento,
  normalizeCatalogValue,
} from '../../utils/registroBienMappers';
import {
  almacenesPorSede,
  departamentosPorSede,
} from '../../data/bienesCatalogos';

export type RegistroBienesModalConfig = {
  modulo: RegistroBienesModulo;
  titulo: string;
  sedes: readonly string[];
  sedeReadOnly?: boolean;
  departamentos: readonly string[];
  almacenesCatalog: readonly string[];
};

type RegistroBienesModalProps = RegistroBienesModalConfig & {
  open: boolean;
  onClose: () => void;
  almacenes: ApiAlmacen[];
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

function initialDocumento(sede: string): DocumentoRegistroDraft {
  return {
    numeroDocumento: '',
    nombreProveedor: '',
    fechaAdquisicion: '',
    formaAdquisicion: 'Compra',
    sede,
    moneda: 'Bs',
  };
}

function totalItem(item: ItemRegistroDraft) {
  return (item.cantidad || 0) * (item.valorAdquisicion || 0);
}

function resolveAlmacenId(nombre: string, almacenes: ApiAlmacen[]) {
  const match = almacenes.find(
    (almacen) => normalizeCatalogValue(almacen.nombre) === normalizeCatalogValue(nombre),
  );
  return match?.id_almacen ?? null;
}

function filterAlmacenesByCatalog(almacenes: ApiAlmacen[], catalog: readonly string[]) {
  const catalogNames = new Set(catalog.map(normalizeCatalogValue));
  const fromApi = almacenes.map((a) => a.nombre).filter((nombre) => catalogNames.has(normalizeCatalogValue(nombre)));
  if (fromApi.length > 0) return fromApi;
  return [...catalog];
}

export default function RegistroBienesModal({
  open,
  onClose,
  almacenes,
  onSuccess,
  onError,
  modulo,
  titulo,
  sedes,
  sedeReadOnly = false,
  departamentos,
  almacenesCatalog,
}: RegistroBienesModalProps) {
  const sedeInicial = sedes[0] ?? '';
  const [documento, setDocumento] = useState<DocumentoRegistroDraft>(() => initialDocumento(sedeInicial));
  const [items, setItems] = useState<ItemRegistroDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemRegistroDraft | null>(null);
  const [documentoErrors, setDocumentoErrors] = useState<Record<string, string>>({});

  const almacenOptions = useMemo(
    () => filterAlmacenesByCatalog(almacenes, almacenesPorSede(documento.sede) ?? almacenesCatalog),
    [almacenes, almacenesCatalog, documento.sede],
  );

  const departamentoOptions = useMemo(
    () => departamentosPorSede(documento.sede) ?? departamentos,
    [departamentos, documento.sede],
  );

  const valorTotalDocumento = useMemo(
    () => items.reduce((sum, item) => sum + totalItem(item), 0),
    [items],
  );

  useEffect(() => {
    if (!open) return;
    setDocumento(initialDocumento(sedeInicial));
    setItems([]);
    setEditingItem(null);
    setItemModalOpen(false);
    setDocumentoErrors({});
  }, [open, sedeInicial]);

  const updateDocumento = <K extends keyof DocumentoRegistroDraft>(key: K, value: DocumentoRegistroDraft[K]) => {
    setDocumento((prev) => ({ ...prev, [key]: value }));
    setDocumentoErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const updateSede = (sede: string) => {
    updateDocumento('sede', sede);
    setItems([]);
    setEditingItem(null);
    setItemModalOpen(false);
  };

  const abrirNuevoItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const abrirEditarItem = (item: ItemRegistroDraft) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const guardarItem = (item: ItemRegistroDraft) => {
    setItems((prev) => {
      const existe = prev.some((i) => i.key === item.key);
      if (existe) return prev.map((i) => (i.key === item.key ? item : i));
      return [...prev, item];
    });
  };

  const eliminarItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const validar = (): string | null => {
    const docResult = validarConZod(documentoRegistroFormSchema, {
      nombreProveedor: documento.nombreProveedor,
      fechaAdquisicion: documento.fechaAdquisicion,
      formaAdquisicion: documento.formaAdquisicion,
      sede: documento.sede,
      moneda: documento.moneda,
    });
    if (!docResult.success) {
      setDocumentoErrors(docResult.errors);
      return Object.values(docResult.errors)[0] ?? 'Revise los datos del documento';
    }
    setDocumentoErrors({});

    const itemsResult = validarConZod(
      registroItemsListSchema,
      items.map((item) => itemDraftToFormInput(item)),
    );
    if (!itemsResult.success) {
      return Object.values(itemsResult.errors)[0] ?? 'Revise los ítems agregados';
    }

    for (const [index, item] of items.entries()) {
      const idAlmacen = resolveAlmacenId(item.almacen, almacenes);
      if (!idAlmacen) {
        return `El almacén "${item.almacen}" del ítem ${index + 1} debe existir en configuración`;
      }
    }
    return null;
  };

  const handleCargar = async () => {
    const validationError = validar();
    if (validationError) {
      onError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const documentoCreado = await createDocumento({
        nombre_proveedor: documento.nombreProveedor.trim(),
        forma_adquisicion: documento.formaAdquisicion,
        fecha_adquisicion: documento.fechaAdquisicion,
        moneda: monedaBienToDocumento(documento.moneda),
      });

      const idDoc = documentoCreado.id_doc;
      const fechaIngreso = documento.fechaAdquisicion;

      for (const item of items) {
        const idAlmacen = resolveAlmacenId(item.almacen, almacenes)!;
        await createBien(
          itemRegistroToBienPayload(item, {
            idDoc,
            fechaIngreso,
            idAlmacen,
          }),
        );
      }

      onSuccess(`Documento ${idDoc} cargado con ${items.length} ítem(s)`);
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo cargar el registro');
    } finally {
      setSubmitting(false);
    }
  };

  const displayCodigo = (item: ItemRegistroDraft) => item.codigoInterno;

  const displaySerial = (item: ItemRegistroDraft) =>
    item.sinSerial || !item.serial.trim() ? 'S/S' : item.serial;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={titulo}
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
                  value={documento.numeroDocumento}
                  readOnly
                  placeholder="Se asigna al cargar"
                  className="input-field bg-gray-50"
                />
              </Field>
            <Field label="Nombre de Proveedor">
              <input
                type="text"
                value={documento.nombreProveedor}
                onChange={(e) => updateDocumento('nombreProveedor', e.target.value)}
                className={`input-field ${documentoErrors.nombreProveedor ? 'border-red-400' : ''}`}
              />
              {documentoErrors.nombreProveedor && (
                <p className="text-xs text-red-600 mt-1">{documentoErrors.nombreProveedor}</p>
              )}
            </Field>
            <Field label="Fecha Adquisición">
              <input
                type="date"
                value={documento.fechaAdquisicion}
                onChange={(e) => updateDocumento('fechaAdquisicion', e.target.value)}
                className={`input-field ${documentoErrors.fechaAdquisicion ? 'border-red-400' : ''}`}
              />
              {documentoErrors.fechaAdquisicion && (
                <p className="text-xs text-red-600 mt-1">{documentoErrors.fechaAdquisicion}</p>
              )}
            </Field>
              <Field label="Forma de Adquisición">
                <select
                  value={documento.formaAdquisicion}
                  onChange={(e) =>
                    updateDocumento('formaAdquisicion', e.target.value as FormaAdquisicionDocumento)
                  }
                  className="input-field"
                >
                  {FORMAS_DOCUMENTO.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sede">
                {sedeReadOnly ? (
                  <input
                    type="text"
                    value={sedeLabel(documento.sede)}
                    readOnly
                    className="input-field bg-gray-50 font-medium text-navy-900"
                  />
                ) : (
                  <select
                    value={documento.sede}
                    onChange={(e) => updateSede(e.target.value)}
                    className="input-field"
                  >
                    {sedes.map((sede) => (
                      <option key={sede} value={sede}>
                        {sedeLabel(sede)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Moneda">
                <select
                  value={documento.moneda}
                  onChange={(e) => updateDocumento('moneda', e.target.value as DocumentoRegistroDraft['moneda'])}
                  className="input-field"
                >
                  {MONEDAS_REGISTRO.map((moneda) => (
                    <option key={moneda} value={moneda}>
                      {moneda}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Valor Total de Documento">
                <div className="input-field bg-gray-50 font-semibold text-navy-900">
                  {formatMoneda(valorTotalDocumento, documento.moneda)}
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
                  <Th>Serial</Th>
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
                      No hay ítems agregados. Use el botón + para registrar cada bien.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.key}
                      className={`border-b border-gray-100 ${index % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}`}
                    >
                      <Td>
                        <span className="font-mono text-navy-900">{displayCodigo(item)}</span>
                      </Td>
                      <Td>
                        <span className="block max-w-[180px] truncate">{item.descripcion}</span>
                      </Td>
                      <Td>{item.marca || '—'}</Td>
                      <Td>{item.modelo || '—'}</Td>
                      <Td>{item.color || '—'}</Td>
                      <Td>
                        <span className="font-mono text-xs">{displaySerial(item)}</span>
                      </Td>
                      <Td>
                        <span className="block max-w-[140px] truncate">{item.almacen}</span>
                      </Td>
                      <Td>{item.cantidad.toLocaleString('es-VE')}</Td>
                      <Td>{formatMoneda(item.valorAdquisicion, documento.moneda)}</Td>
                      <Td>{formatMoneda(totalItem(item), documento.moneda)}</Td>
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
          </section>
        </div>
      </Modal>

      <NuevoItemRegistroModal
        open={itemModalOpen}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        modulo={modulo}
        item={editingItem}
        almacenOptions={almacenOptions}
        departamentoOptions={departamentoOptions}
        moneda={documento.moneda}
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
