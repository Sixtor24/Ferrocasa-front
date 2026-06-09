import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDocumentoPropiedad, type FormaAdquisicionPropiedad } from '../../api/services/documentos-propiedad.service';
import { createParcela } from '../../api/services/parcelas.service';
import { createPropiedad } from '../../api/services/propiedades.service';
import { fetchResponsableByCi } from '../../api/services/responsables.service';
import { levantamientoTopograficoToApi } from '../../api/mappers/enums';
import { buildParcelaObservacionesMeta } from '../../utils/parcelaFechaMeta';
import { MONEDAS_REGISTRO } from '../../types/registroBienItem';
import { formatMoneda } from '../../utils/formatters';
import {
  documentoParcelaFormSchema,
  parcelaDraftToFormInput,
  registroParcelasListSchema,
  type DocumentoParcelaForm,
  type DocumentoParcelaFormInput,
} from '../../schemas/registroParcela.schema';
import { validarConZod } from '../../utils/validators';
import {
  extractRegistroError,
  notifyRegistroError,
  notifyRegistroSuccess,
} from '../../utils/registroNotify';
import Modal from './Modal';
import NuevaParcelaModal, { type ParcelaRegistroDraft } from './NuevaParcelaModal';
import SearchableSelect from '../forms/SearchableSelect';

type RegistroParcelasModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const FORMAS_DOCUMENTO: { label: string; value: FormaAdquisicionPropiedad }[] = [
  { label: 'Compra', value: 'Compra' },
  { label: 'Donación', value: 'Donacion' },
  { label: 'Confiscación', value: 'Confiscacion' },
];

const documentoDefaultValues: DocumentoParcelaFormInput = {
  numeroDocumento: '',
  numeroPropiedad: 0,
  nombrePropiedad: '',
  ubicacionPropiedad: '',
  fechaAdquisicion: '',
  formaAdquisicion: 'Compra',
  moneda: 'Bs',
};

function areaTotal(items: ParcelaRegistroDraft[]) {
  return items.reduce((sum, item) => sum + (item.areaTotalM2 || 0), 0);
}

function valorTotal(items: ParcelaRegistroDraft[]) {
  return items.reduce((sum, item) => sum + (item.valorAdquisicion || 0), 0);
}

function acreditacionToApi(value: ParcelaRegistroDraft['acreditacionTecnicaAmbiental']) {
  if (value === 'Sí') return 'Si_posee';
  return 'No_posee';
}

async function ensurePropiedad(documento: DocumentoParcelaForm) {
  try {
    await createPropiedad({
      numero_propiedad: documento.numeroPropiedad,
      nombre: documento.nombrePropiedad.trim(),
      ubicacion: documento.ubicacionPropiedad.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    const alreadyExists = message.includes('existe') || message.includes('duplicate') || message.includes('409');
    if (!alreadyExists) throw err;
  }
}

async function ensureResponsablesParcelas(items: ParcelaRegistroDraft[]) {
  const cedulas = [...new Set(items.map((item) => item.ciResponsable.trim()).filter(Boolean))];

  for (const ci of cedulas) {
    try {
      await fetchResponsableByCi(ci);
    } catch {
      throw new Error(
        `La CI ${ci} no está registrada como responsable. Seleccione un responsable del listado o créelo en el API (POST /responsables).`,
      );
    }
  }
}

export default function RegistroParcelasModal({
  open,
  onClose,
  onSuccess,
  onError,
}: RegistroParcelasModalProps) {
  const [items, setItems] = useState<ParcelaRegistroDraft[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ParcelaRegistroDraft | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DocumentoParcelaFormInput, unknown, DocumentoParcelaForm>({
    resolver: zodResolver(documentoParcelaFormSchema),
    defaultValues: documentoDefaultValues,
  });

  const moneda = watch('moneda');

  const totalArea = useMemo(() => areaTotal(items), [items]);
  const totalValor = useMemo(() => valorTotal(items), [items]);

  useEffect(() => {
    if (!open) return;
    reset(documentoDefaultValues);
    setItems([]);
    setEditingItem(null);
    setItemModalOpen(false);
    setItemsError(null);
  }, [open, reset]);

  const guardarItem = (item: ParcelaRegistroDraft) => {
    setItems((prev) => {
      const exists = prev.some((row) => row.key === item.key);
      if (exists) return prev.map((row) => (row.key === item.key ? item : row));
      return [...prev, item];
    });
  };

  const eliminarItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const validarItems = (): string | null => {
    const itemsResult = validarConZod(
      registroParcelasListSchema,
      items.map((item) => parcelaDraftToFormInput(item)),
    );
    if (!itemsResult.success) {
      const message = Object.values(itemsResult.errors)[0] ?? 'Agregue al menos una parcela con el botón +';
      setItemsError(message);
      return message;
    }
    setItemsError(null);
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
    try {
      await ensurePropiedad(documento);
      await ensureResponsablesParcelas(items);

      const createdIds: number[] = [];
      for (const item of items) {
        const doc = await createDocumentoPropiedad({
          numero_propiedad: documento.numeroPropiedad,
          forma_adquisicion: documento.formaAdquisicion,
          area_total_m2: item.areaTotalM2,
        });

        const observaciones = buildParcelaObservacionesMeta(item.observaciones ?? '', {
          codigo: item.codigo,
          fechaAdquisicion: documento.fechaAdquisicion,
          fechaIngreso: new Date().toISOString().split('T')[0],
          numeroDocumento: documento.numeroDocumento,
        });

        const parcela = await createParcela({
          nombre: item.identificacion,
          zona: item.zona,
          id_documento_propiedad: doc.id_documento_propiedad,
          ci_responsable: item.ciResponsable,
          zonificacion: item.zonificacion,
          observaciones,
          acreditacion_ambiental: acreditacionToApi(item.acreditacionTecnicaAmbiental),
          levantamiento_topografico: levantamientoTopograficoToApi(item.levantamientoTopografico),
          valor_adquisicion: item.valorAdquisicion || null,
          ubicacion_adicional: item.ubicacionAdicional,
          id_comprometida: null,
          id_desincorporada: null,
        });
        createdIds.push(parcela.id);
      }

      const message = `Registro cargado con ${createdIds.length} parcela(s)`;
      notifyRegistroSuccess(message);
      onSuccess(message);
      onClose();
    } catch (err) {
      const message = extractRegistroError(err, 'No se pudo cargar el registro de parcelas');
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
        title="Registro de Parcelas"
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
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-bold text-navy-900 uppercase tracking-wide">
                Detalles del documento de Ingreso
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setItemModalOpen(true);
                }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-navy-300 text-navy-800 hover:bg-navy-50"
                title="Agregar nueva parcela"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Nro de Documento">
                <input
                  type="text"
                  {...register('numeroDocumento')}
                  placeholder="Ingrese nro de documento"
                  className="input-field"
                />
              </Field>
              <Field label="Nro de Propiedad">
                <Controller
                  name="numeroPropiedad"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={field.value > 0 ? String(field.value) : ''}
                      onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
                      className={`input-field ${errors.numeroPropiedad ? 'border-red-400' : ''}`}
                    />
                  )}
                />
                {errors.numeroPropiedad && <p className="text-xs text-red-600 mt-1">{errors.numeroPropiedad.message}</p>}
              </Field>
              <Field label="Nombre de Propiedad">
                <input
                  {...register('nombrePropiedad')}
                  className={`input-field ${errors.nombrePropiedad ? 'border-red-400' : ''}`}
                />
                {errors.nombrePropiedad && <p className="text-xs text-red-600 mt-1">{errors.nombrePropiedad.message}</p>}
              </Field>
              <Field label="Ubicación">
                <input
                  {...register('ubicacionPropiedad')}
                  className={`input-field ${errors.ubicacionPropiedad ? 'border-red-400' : ''}`}
                />
                {errors.ubicacionPropiedad && <p className="text-xs text-red-600 mt-1">{errors.ubicacionPropiedad.message}</p>}
              </Field>
              <Field label="Fecha Adquisición">
                <input
                  type="date"
                  {...register('fechaAdquisicion')}
                  className={`input-field ${errors.fechaAdquisicion ? 'border-red-400' : ''}`}
                />
                {errors.fechaAdquisicion && <p className="text-xs text-red-600 mt-1">{errors.fechaAdquisicion.message}</p>}
              </Field>
              <Field label="Forma de Adquisición">
                <Controller
                  name="formaAdquisicion"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={(value) => field.onChange(value as FormaAdquisicionPropiedad)}
                      options={FORMAS_DOCUMENTO}
                    />
                  )}
                />
              </Field>
              <Field label="Moneda">
                <Controller
                  name="moneda"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect value={field.value} onChange={field.onChange} options={MONEDAS_REGISTRO} />
                  )}
                />
              </Field>
              <Field label="Área Total M²">
                <div className="input-field bg-gray-50 font-semibold text-navy-900">
                  {totalArea.toLocaleString('es-VE')}
                </div>
              </Field>
              <Field label="Valor Total de Adquisición">
                <div className="input-field bg-gray-50 font-semibold text-navy-900">
                  {formatMoneda(totalValor, moneda)}
                </div>
              </Field>
            </div>
          </section>

          <section className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <Th>Código</Th>
                  <Th>Identificación</Th>
                  <Th>Ubicación Adicional</Th>
                  <Th>Área Total M²</Th>
                  <Th>Valor de adquisición</Th>
                  <Th>Zonificación</Th>
                  <Th>Lote / Manzana</Th>
                  <Th>Levantamiento Topográfico</Th>
                  <Th>Acreditación Técnica Ambiental</Th>
                  <Th className="text-center w-16">Editar</Th>
                  <Th className="text-center w-16">Quitar</Th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">
                      No hay parcelas agregadas. Use el botón + para registrar cada parcela.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.key}
                      className={`border-b border-gray-100 ${index % 2 === 1 ? 'bg-gray-50/80' : 'bg-white'}`}
                    >
                      <Td><span className="font-mono font-medium text-navy-900">{item.codigo}</span></Td>
                      <Td>{item.identificacion}</Td>
                      <Td><span className="block max-w-[180px] truncate">{item.ubicacionAdicional}</span></Td>
                      <Td>{item.areaTotalM2.toLocaleString('es-VE')}</Td>
                      <Td>{formatMoneda(item.valorAdquisicion, moneda)}</Td>
                      <Td>{item.zonificacion}</Td>
                      <Td>{item.zona}</Td>
                      <Td>{item.levantamientoTopografico}</Td>
                      <Td>{item.acreditacionTecnicaAmbiental}</Td>
                      <Td className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setItemModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-navy-700 hover:bg-navy-50 hover:border-navy-300"
                          title="Editar parcela"
                        >
                          <Pencil size={15} />
                        </button>
                      </Td>
                      <Td className="text-center">
                        <button
                          type="button"
                          onClick={() => eliminarItem(item.key)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-200 text-red-700 hover:bg-red-50"
                          title="Quitar parcela"
                        >
                          ×
                        </button>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {itemsError && <p className="text-xs text-red-600 p-3">{itemsError}</p>}
          </section>
        </div>
      </Modal>

      <NuevaParcelaModal
        open={itemModalOpen}
        item={editingItem}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
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
