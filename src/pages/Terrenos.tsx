import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchParcelas,
  fetchParcelaById,
  fetchParcelasAll,
  updateParcela,
  type ParcelaPayload,
} from '../api/services/parcelas.service';
import type { ApiParcela } from '../api/types';
import { useApiQuery } from '../hooks/useApiQuery';
import ModuleMetricCard, { formatAreaM2 } from '../components/module/ModuleMetricCard';
import SearchableSelect from '../components/forms/SearchableSelect';
import {
  ESTADOS_TRAMITE,
  LEVANTAMIENTO_TOPOGRAFICO_OPCIONES,
} from '../types/terreno';
import {
  levantamientoTopograficoToApi,
  mapLevantamientoTopografico,
} from '../api/mappers/enums';
import type { ProtocolizacionTerreno, Terreno } from '../types/terreno';
import {
  Modal,
  NuevaProtocolizacionModal,
  RegistroParcelasModal,
} from '../components/modals';
import { useAuth } from '../context/AuthContext';
import { createProtocolo } from '../api/services/protocolos.service';
import { createDesincorporacion } from '../api/services/desincorporaciones.service';
import UnsavedChangesModal from '../components/modals/UnsavedChangesModal';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import type { TipoProtocolizacionParcela } from '../components/modals/NuevaProtocolizacionModal';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import { FILTROS_TERRENOS_VACIOS } from '../constants/moduleFilters';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import AssetDetailView from '../components/module/AssetDetailView';
import ApiState from '../components/ApiState';
import { formatFecha, formatMoneda } from '../utils/formatters';
import { aggregateTerrenoMetricas } from '../utils/parcelasStats';
import { exportInventarioParcelas } from '../utils/exportInventarioParcelasExcel';
import { useModuleUiState } from '../stores/moduleUiStore';
import { useRolePermissions } from '../hooks/useRolePermissions';
import type { Column } from '../components/DataTable';
import { AlertTriangle, ArrowLeft, Map, MapPin, Layers, MinusCircle } from 'lucide-react';

const ESTADOS_PARCELA = ['disponible', 'comprometida', 'desincorporada'] as const;
type TerrenosFilters = typeof FILTROS_TERRENOS_VACIOS;

function formatAreaM2Detail(value: number) {
  return `${value.toLocaleString('es-VE')} m²`;
}

function acreditacionEstadoToApi(value: Terreno['acreditacionTecnicaAmbiental']) {
  if (value === 'Sí') return 'Si_posee';
  return 'No_posee';
}

function filterTerrenosByUiFilters(terrenos: Terreno[], filtros: TerrenosFilters) {
  return terrenos.filter((t) => {
    if (filtros.codigo && !t.codigo.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
    if (
      filtros.identificacion &&
      !t.identificacion.toLowerCase().includes(filtros.identificacion.toLowerCase())
    ) {
      return false;
    }
    if (filtros.nroPropiedad && !t.nroPropiedad.includes(filtros.nroPropiedad)) return false;
    if (filtros.fecha && t.fechaAdquisicion !== filtros.fecha) return false;
    if (filtros.levantamiento && filtros.levantamiento !== 'Todos' && t.levantamientoTopografico !== filtros.levantamiento) return false;
    if (filtros.acreditacion && filtros.acreditacion !== 'Todos' && t.acreditacionTecnicaAmbiental !== filtros.acreditacion) return false;
    return true;
  });
}

function entityIdAsString(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    throw new Error('ID de documento de propiedad inválido');
  }
  return String(value);
}

function nullableEntityIdAsNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error('ID de entidad inválido');
  }
  return num;
}

function parcelaPayloadFromApi(
  raw: ApiParcela,
  overrides: Partial<Pick<ParcelaPayload, 'id_comprometida' | 'id_desincorporada'>> = {},
): ParcelaPayload {
  return {
    nombre: raw.nombre ?? `Parcela ${raw.id_terreno}`,
    zona: raw.zona ?? 'Sin zona',
    id_documento_propiedad: entityIdAsString(raw.id_documento_propiedad),
    id_desincorporada: overrides.id_desincorporada
      ?? nullableEntityIdAsNumber(raw.id_desincorporada),
    id_comprometida: overrides.id_comprometida
      ?? nullableEntityIdAsNumber(raw.id_comprometida),
    ci_responsable: raw.ci_responsable ?? raw.responsable?.ci_responsable ?? '0',
    zonificacion: raw.zonificacion ?? 'Sin zonificar',
    observaciones: raw.observaciones ?? null,
    acreditacion_ambiental: raw.acreditacion_ambiental,
    levantamiento_topografico: levantamientoTopograficoToApi(
      mapLevantamientoTopografico(raw.levantamiento_topografico),
    ),
    valor_adquisicion:
      raw.valor_adquisicion != null
        ? Number(raw.valor_adquisicion)
        : raw.documento?.valor_adquisicion != null
          ? Number(raw.documento.valor_adquisicion)
          : null,
    ubicacion_adicional: raw.ubicacion_adicional ?? null,
  };
}

function TerrenoParcelaDetail({
  terreno,
  raw,
  protocolos,
  onVolver,
  onUpdated,
}: {
  terreno: Terreno;
  raw: ApiParcela;
  protocolos: ProtocolizacionTerreno[];
  onVolver: () => void;
  onUpdated: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canWriteAssets } = useRolePermissions();
  const [acreditacion, setAcreditacion] = useState(terreno.acreditacionTecnicaAmbiental);
  const [levantamiento, setLevantamiento] = useState(terreno.levantamientoTopografico);
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const [protocolTipo, setProtocolTipo] = useState<TipoProtocolizacionParcela>('Compromiso');
  const [protocolLockTipo, setProtocolLockTipo] = useState(false);
  const [retiroConfirmOpen, setRetiroConfirmOpen] = useState(false);
  const [retiroSubmitting, setRetiroSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAcreditacion(terreno.acreditacionTecnicaAmbiental);
    setLevantamiento(terreno.levantamientoTopografico);
  }, [terreno.acreditacionTecnicaAmbiental, terreno.levantamientoTopografico]);

  const isDirty =
    acreditacion !== terreno.acreditacionTecnicaAmbiental
    || levantamiento !== terreno.levantamientoTopografico;
  const unsaved = useUnsavedChangesGuard(isDirty);
  const areaRetirable = terreno.areaDisponible + terreno.areaComprometida;
  const yaDesincorporada = Boolean(raw.id_desincorporada);
  const compromisos = protocolos.filter((p) => p.tipoProtocolizacion === 'Compromiso');
  const desincorporaciones = protocolos.filter((p) => p.tipoProtocolizacion === 'Desincorporación');
  const sinAreaParaCompromiso = terreno.areaDisponible === 0 && !yaDesincorporada;

  const guardarCambio = async () => {
    setSaving(true);
    try {
      await updateParcela(terreno.id, {
        ...parcelaPayloadFromApi(raw),
        acreditacion_ambiental: acreditacionEstadoToApi(acreditacion),
        levantamiento_topografico: levantamientoTopograficoToApi(levantamiento),
      });
      toast.success('Cambio guardado', {
        description: `${terreno.codigo}: acreditación ${acreditacion}, levantamiento ${levantamiento}.`,
      });
      onUpdated();
    } catch (err) {
      toast.error('No se pudo guardar el cambio', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const vincularProtocolizacion = async (tipo: TipoProtocolizacionParcela, idMovimiento: number) => {
    await updateParcela(
      terreno.id,
      parcelaPayloadFromApi(raw, tipo === 'Compromiso'
        ? { id_comprometida: idMovimiento }
        : { id_desincorporada: idMovimiento }),
    );
    toast.success('Protocolización agregada', {
      description: `${terreno.codigo}: ${tipo.toLowerCase()} registrado correctamente.`,
    });
    onUpdated();
  };

  const handleRetiroConfirmado = async () => {
    const today = new Date().toISOString().split('T')[0];
    const areaTotal = terreno.areaDisponible + terreno.areaComprometida;
    setRetiroSubmitting(true);
    try {
      const protocolo = await createProtocolo({
        motivo: 'Venta',
        id_beneficiado: null,
        fecha_protocolo: today,
      });
      const desincorporacion = await createDesincorporacion({
        id_protocolo: protocolo.id_protocolo,
        cantidad_m2: areaTotal,
        fecha_desincorporacion: today,
      });
      await vincularProtocolizacion('Desincorporación', desincorporacion.id_desincorporada);
      setRetiroConfirmOpen(false);
    } catch (err) {
      toast.error('No se pudo retirar del inventario', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setRetiroSubmitting(false);
    }
  };

  return (
    <>
      <AssetDetailView
        title="Terrenos: Control de Parcelas"
        onNavigateTo={(to) =>
          unsaved.requestLeave(() => (to === '/terrenos' ? onVolver() : navigate(to)))
        }
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Terrenos', to: '/terrenos' },
          { label: terreno.codigo },
        ]}
        sections={[
          {
            title: 'Detalles',
            fields: [
              { label: 'Identificación', value: terreno.identificacion },
              { label: 'Código', value: terreno.codigo },
              {
                label: 'Acreditación Técnica Ambiental',
                value: canWriteAssets ? (
                  <SearchableSelect
                    value={acreditacion}
                    onChange={(value) => setAcreditacion(value as Terreno['acreditacionTecnicaAmbiental'])}
                    options={ESTADOS_TRAMITE}
                    className="max-w-xs"
                  />
                ) : (
                  acreditacion
                ),
              },
              { label: 'Fecha de Ingreso', value: formatFecha(terreno.fechaIngreso) },
              { label: 'Ubicación Adicional', value: terreno.ubicacionAdicional || '—' },
              {
                label: 'Levantamiento topográfico',
                value: canWriteAssets ? (
                  <SearchableSelect
                    value={levantamiento}
                    onChange={(value) => setLevantamiento(value as Terreno['levantamientoTopografico'])}
                    options={LEVANTAMIENTO_TOPOGRAFICO_OPCIONES}
                    className="max-w-xs"
                  />
                ) : (
                  levantamiento
                ),
              },
              { label: 'Número de Propiedad', value: terreno.nroPropiedad },
              {
                label: 'Valor de Adquisición',
                value: formatMoneda(terreno.valorAdquisicion, terreno.moneda),
              },
              { label: 'Área Desincorporada', value: formatAreaM2Detail(terreno.areaDesincorporada) },
              { label: 'Zona', value: terreno.zona },
              {
                label: 'Responsable',
                value: terreno.responsable !== '—'
                  ? terreno.responsable
                  : terreno.ciResponsable
                    ? `CI ${terreno.ciResponsable}`
                    : '—',
              },
              { label: 'Área Comprometida', value: formatAreaM2Detail(terreno.areaComprometida) },
              { label: 'Ubicación', value: terreno.ubicacion },
              { label: 'Observación', value: terreno.observacion || '—' },
              { label: 'Área Disponible', value: formatAreaM2Detail(terreno.areaDisponible) },
              { label: 'Zonificación', value: terreno.zonificacion },
            ],
          },
          {
            title: 'Detalles del documento de Ingreso',
            fields: [
              { label: 'Nro de Documento', value: terreno.numeroDocumento },
              { label: 'Número de Propiedad', value: terreno.nroPropiedad },
              { label: 'Área Total M²', value: formatAreaM2Detail(terreno.areaTotalM2) },
              { label: 'Fecha Adquisición', value: formatFecha(terreno.fechaAdquisicion) },
              { label: 'Forma de Adquisición', value: terreno.formaAdquisicion },
            ],
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => unsaved.requestLeave(onVolver)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
            {canWriteAssets && (
              <button
                type="button"
                onClick={() => {
                  setProtocolTipo('Compromiso');
                  setProtocolLockTipo(false);
                  setProtocolModalOpen(true);
                }}
                disabled={terreno.areaDisponible === 0}
                title={
                  terreno.areaDisponible === 0
                    ? 'No hay área disponible para nuevos compromisos'
                    : undefined
                }
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar Protocolización
              </button>
            )}
            {canWriteAssets && (
              <button
                type="button"
                onClick={guardarCambio}
                disabled={saving}
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800"
              >
                {saving ? 'Guardando...' : 'Guardar cambio'}
              </button>
            )}
            {canWriteAssets && (
              <button
                type="button"
                onClick={() => setRetiroConfirmOpen(true)}
                disabled={yaDesincorporada || areaRetirable === 0}
                title={
                  yaDesincorporada
                    ? 'Esta parcela ya fue retirada del inventario'
                    : areaRetirable === 0
                      ? 'No hay área para retirar'
                      : undefined
                }
                className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Retirar de Inventario
              </button>
            )}
          </>
        }
      />

      {protocolos.length > 0 && (
        <div className="px-4 md:px-6 pb-8 max-w-7xl space-y-6">
          {compromisos.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-linear-to-r from-navy-50/80 to-white">
                <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide">Compromisos</h2>
              </div>
              {sinAreaParaCompromiso && (
                <div className="mx-5 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p className="text-sm">
                    {terreno.areaComprometida > 0 ? (
                      <>
                        <span className="font-semibold">Área total comprometida.</span>
                        {' '}
                        Tiene {formatAreaM2Detail(terreno.areaComprometida)} asignados y no puede agregar otro compromiso.
                        Para retirar del inventario, use el botón «Retirar de Inventario» arriba.
                      </>
                    ) : (
                      'Esta parcela no tiene área disponible para nuevos compromisos.'
                    )}
                  </p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left font-medium">Motivo</th>
                      <th className="px-5 py-3 text-left font-medium">Beneficiario</th>
                      <th className="px-5 py-3 text-left font-medium">Fecha</th>
                      <th className="px-5 py-3 text-right font-medium">Cantidad M²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {compromisos.map((p) => (
                      <tr key={p.id} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-navy-900">{p.motivo}</td>
                        <td className="px-5 py-3 text-navy-900">{p.beneficiario}</td>
                        <td className="px-5 py-3 text-navy-900">{formatFecha(p.fecha)}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium text-blue-700">{formatAreaM2Detail(p.areaComprometidaM2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {desincorporaciones.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-linear-to-r from-navy-50/80 to-white">
                <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide">Desincorporaciones</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <th className="px-5 py-3 text-left font-medium">Motivo</th>
                      <th className="px-5 py-3 text-left font-medium">Beneficiario</th>
                      <th className="px-5 py-3 text-left font-medium">Fecha</th>
                      <th className="px-5 py-3 text-right font-medium">Cantidad M²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {desincorporaciones.map((p) => (
                      <tr key={p.id} className="bg-white hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-navy-900">{p.motivo}</td>
                        <td className="px-5 py-3 text-navy-900">{p.beneficiario}</td>
                        <td className="px-5 py-3 text-navy-900">{formatFecha(p.fecha)}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-medium text-amber-700">{formatAreaM2Detail(p.areaComprometidaM2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}

      <Modal
        open={retiroConfirmOpen}
        onClose={() => setRetiroConfirmOpen(false)}
        title="Retirar de Inventario"
        maxWidth="lg"
        zIndexClass="z-[60]"
        footer={
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setRetiroConfirmOpen(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleRetiroConfirmado}
              disabled={retiroSubmitting}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {retiroSubmitting ? 'Retirando...' : 'Confirmar y Retirar'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900">Está a punto de retirar esta parcela del inventario</p>
              <p className="text-sm text-red-800 mt-1">
                Esta operación registrará la parcela como desincorporada. Una vez confirmada, no podrá revertirse desde esta interfaz.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700">
            Al confirmar, usted declara conocer y asumir la responsabilidad de esta operación. Su usuario y la fecha actual quedarán registrados automáticamente como referencia de auditoría.
          </p>
          {user && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Responsable: <span className="font-semibold text-navy-900">{user.username}</span>
              {' · '}
              Fecha: <span className="font-semibold text-navy-900">{new Date().toLocaleDateString('es-VE')}</span>
            </p>
          )}
        </div>
      </Modal>
      <NuevaProtocolizacionModal
        open={protocolModalOpen}
        onClose={() => setProtocolModalOpen(false)}
        tipo={protocolTipo}
        lockTipo={protocolLockTipo}
        areaDisponible={terreno.areaDisponible}
        areaComprometida={terreno.areaComprometida}
        onCreated={vincularProtocolizacion}
        onError={(message) => toast.error('No se pudo crear la protocolización', { description: message })}
      />
      <UnsavedChangesModal
        open={unsaved.modalOpen}
        onClose={unsaved.cancelLeave}
        onConfirm={unsaved.confirmLeave}
        subject="de la parcela"
      />
    </>
  );
}

export default function Terrenos() {
  const { canWriteAssets, canExportInventory } = useRolePermissions();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    page,
    filters: filtros,
    modals,
    setPage,
    setFilter: setModuleFilter,
    resetFilters,
    setModal,
  } = useModuleUiState('terrenos', FILTROS_TERRENOS_VACIOS);
  const showRegistro = modals.registro ?? false;
  const [perPage, setPerPage] = useState(50);

  const apiSearch = useMemo(() => {
    return [filtros.buscar, filtros.identificacion, filtros.zonificacion]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' ') || undefined;
  }, [filtros.buscar, filtros.identificacion, filtros.zonificacion]);

  const detailQuery = useApiQuery(
    () => fetchParcelaById(Number(id)),
    [id],
    Boolean(id),
  );

  const listQuery = useApiQuery(
    () => fetchParcelas({
      page,
      limit: perPage,
      search: apiSearch,
      estado: filtros.estado && filtros.estado !== 'Todos'
        ? (filtros.estado as (typeof ESTADOS_PARCELA)[number])
        : undefined,
    }),
    [page, perPage, apiSearch, filtros.estado],
  );

  const metricsQuery = useApiQuery(() => fetchParcelasAll(), []);

  const terrenos = listQuery.data?.terrenos ?? [];
  const totalPages = listQuery.data?.meta.totalPages ?? 1;

  const metricas = useMemo(
    () => aggregateTerrenoMetricas(metricsQuery.data?.terrenos ?? []),
    [metricsQuery.data?.terrenos],
  );

  const filtered = useMemo(() => filterTerrenosByUiFilters(terrenos, filtros), [terrenos, filtros]);

  const paginated = filtered;

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setModuleFilter(key, value);
    setPage(1);
  };

  const refreshParcelas = () => {
    listQuery.refetch();
    metricsQuery.refetch();
    detailQuery.refetch();
  };

  const exportarInventarioParcelas = async () => {
    const result = await fetchParcelasAll({
      search: apiSearch,
      estado: filtros.estado && filtros.estado !== 'Todos'
        ? (filtros.estado as (typeof ESTADOS_PARCELA)[number])
        : undefined,
    });
    const rows = filterTerrenosByUiFilters(result.terrenos, filtros);
    if (rows.length === 0) {
      throw new Error('No hay terrenos para exportar con los filtros seleccionados');
    }
    await exportInventarioParcelas(rows);
  };

  const columns: Column<Terreno>[] = [
    { key: 'codigo', label: 'Código', render: (t) => <span className="font-mono font-bold text-navy-900">{t.codigo}</span> },
    { key: 'identificacion', label: 'Identificación' },
    { key: 'nroPropiedad', label: 'Nro de Propiedad' },
    { key: 'ubicacion', label: 'Ubicación', render: (t) => <span className="max-w-[180px] truncate block">{t.ubicacion}</span> },
    { key: 'areaDocumento', label: 'Área de documento', render: (t) => `${t.areaDocumento.toLocaleString('es-VE')} m²` },
    { key: 'areaDesincorporada', label: 'Área Desincorporada', render: (t) => `${t.areaDesincorporada.toLocaleString('es-VE')} m²` },
    {
      key: 'areaComprometida',
      label: 'Área Comprometida',
      render: (t) => (
        <span className="text-blue-800 font-medium tabular-nums">
          {t.areaComprometida.toLocaleString('es-VE')} m²
        </span>
      ),
    },
    {
      key: 'areaDisponible',
      label: 'Área Disponible',
      render: (t) => (
        <span className="text-green-700 font-medium tabular-nums">
          {t.areaDisponible.toLocaleString('es-VE')} m²
        </span>
      ),
    },
    { key: 'zonificacion', label: 'Zonificación' },
    { key: 'levantamientoTopografico', label: 'Levantamiento Topográfico' },
    { key: 'acreditacionTecnicaAmbiental', label: 'Acreditación Técnica Ambiental' },
  ];

  if (id) {
    const terreno = detailQuery.data?.terreno;
    const raw = detailQuery.data?.raw;
    const protos = detailQuery.data?.protocolos ?? [];

    return (
      <ApiState loading={detailQuery.loading} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {terreno && raw && (
          <TerrenoParcelaDetail
            terreno={terreno}
            raw={raw}
            protocolos={protos}
            onVolver={() => navigate('/terrenos')}
            onUpdated={refreshParcelas}
          />
        )}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Terrenos"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Terrenos' }]}
        exportLabel="Inventario de Parcelas"
        onExport={canExportInventory ? exportarInventarioParcelas : undefined}
        onCreate={canWriteAssets ? () => setModal('registro', true) : undefined}
        createLabel="Crear Registro"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <ModuleMetricCard
          label="Total Parcelas"
          value={(metricas.totalParcelas ?? 0).toLocaleString('es-VE')}
          icon={<Map size={22} className="text-navy-600" />}
          iconWrapClassName="bg-navy-100"
        />
        <ModuleMetricCard
          label="Áreas Disponibles m²"
          value={formatAreaM2(metricas.areaDisponible)}
          icon={<MapPin size={22} className="text-green-600" />}
          iconWrapClassName="bg-green-100"
          valueClassName="text-green-700"
        />
        <ModuleMetricCard
          label="Áreas Desincorporadas m²"
          value={formatAreaM2(metricas.areaDesincorporada)}
          icon={<MinusCircle size={22} className="text-amber-500" />}
          iconWrapClassName="bg-amber-100"
          borderClassName="border-amber-200"
          valueClassName="text-amber-700"
        />
        <ModuleMetricCard
          label="Áreas Comprometidas m²"
          value={formatAreaM2(metricas.areaComprometida)}
          icon={<Layers size={22} className="text-blue-600" />}
          iconWrapClassName="bg-blue-100"
          valueClassName="text-blue-700"
        />
        <ModuleMetricCard
          label="Área de documento m²"
          value={formatAreaM2(metricas.areaDocumento)}
          icon={<Map size={22} className="text-navy-600" />}
          iconWrapClassName="bg-navy-50"
        />
      </div>

      <ModuleFilterBar
        onClearFilters={() => {
          resetFilters();
        }}
        fields={[
          { key: 'codigo', label: 'Código', type: 'text', value: filtros.codigo, onChange: (v) => setFiltro('codigo', v) },
          {
            key: 'identificacion',
            label: 'Identificación',
            type: 'text',
            value: filtros.identificacion,
            onChange: (v) => setFiltro('identificacion', v),
          },
          { key: 'estado', label: 'Estado', type: 'select', value: filtros.estado, onChange: (v) => setFiltro('estado', v), options: ['Todos', ...ESTADOS_PARCELA] },
          { key: 'zonificacion', label: 'Zonificación', type: 'text', value: filtros.zonificacion, onChange: (v) => setFiltro('zonificacion', v) },
          { key: 'nroPropiedad', label: 'Nro de Propiedad', type: 'text', value: filtros.nroPropiedad, onChange: (v) => setFiltro('nroPropiedad', v) },
          { key: 'fecha', label: 'Fecha de Adquisición', type: 'date', value: filtros.fecha, onChange: (v) => setFiltro('fecha', v) },
          { key: 'levantamiento', label: 'Levantamiento Topográfico', type: 'select', value: filtros.levantamiento, onChange: (v) => setFiltro('levantamiento', v), options: ['Todos', ...LEVANTAMIENTO_TOPOGRAFICO_OPCIONES] },
          { key: 'acreditacion', label: 'Acreditación Técnica Ambiental', type: 'select', value: filtros.acreditacion, onChange: (v) => setFiltro('acreditacion', v), options: ['Todos', ...ESTADOS_TRAMITE] },
          { key: 'buscar', label: 'Buscar', type: 'search', value: filtros.buscar, onChange: (v) => setFiltro('buscar', v), placeholder: 'Buscar en registros...', className: 'sm:col-span-2 lg:col-span-1' },
        ]}
      />

      <ApiState
        loading={listQuery.loading && !listQuery.data}
        error={listQuery.error}
        onRetry={listQuery.refetch}
        empty={!listQuery.loading && filtered.length === 0}
        emptyMessage="No hay parcelas registradas. Use «Crear Registro» para cargar propiedad, documento y parcelas."
      >
        <ModuleDataTable
          data={paginated}
          columns={columns}
          loading={listQuery.loading && Boolean(listQuery.data)}
          onDetails={(t) => navigate(`/terrenos/${t.id}`)}
        />

        <div className="flex items-center justify-between flex-wrap gap-3 py-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Filas por página:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </ApiState>

      <RegistroParcelasModal
        open={showRegistro}
        onClose={() => setModal('registro', false)}
        onSuccess={() => {
          refreshParcelas();
        }}
        onError={() => {}}
      />

    </div>
  );
}
