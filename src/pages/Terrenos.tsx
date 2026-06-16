import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchParcelas,
  fetchParcelaById,
  fetchParcelasAll,
  updateParcela,
} from '../api/services/parcelas.service';
import type { ApiParcela } from '../api/types';
import { useApiQuery } from '../hooks/useApiQuery';
import ModuleMetricCard, { formatAreaM2 } from '../components/module/ModuleMetricCard';
import SearchableSelect from '../components/forms/SearchableSelect';
import type { FormaAdquisicion } from '../types/bien';
import type { ProtocolizacionTerreno, Terreno } from '../types/terreno';
import {
  ESTADOS_TRAMITE,
  LEVANTAMIENTO_TOPOGRAFICO_OPCIONES,
  ZONIFICACIONES,
} from '../types/terreno';
import {
  NuevaProtocolizacionModal,
  RegistroParcelasModal,
} from '../components/modals';
import UnsavedChangesModal from '../components/modals/UnsavedChangesModal';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import type { TipoProtocolizacionParcela } from '../components/modals/NuevaProtocolizacionModal';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import { FILTROS_TERRENOS_VACIOS } from '../constants/moduleFilters';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModuleTablePaginationBar from '../components/module/ModuleTablePaginationBar';
import AssetDetailView from '../components/module/AssetDetailView';
import ApiState from '../components/ApiState';
import CurrencyAmountInput from '../components/forms/CurrencyAmountInput';
import DetailFieldInput, { DetailReadOnly } from '../components/module/DetailFieldInput';
import { formatFecha, formatMoneda, fechaCalendarioIso } from '../utils/formatters';
import {
  FORMAS_ADQUISICION_DOCUMENTO,
  formaAdquisicionToApi,
} from '../utils/formaAdquisicionMappers';
import { useTerrenoParcelaDetailEdit } from '../modules/terrenos/useTerrenoParcelaDetailEdit';
import {
  parcelaSoloConsulta,
  parcelaTotalmenteDesincorporada,
} from '../utils/parcelaMovimientos';
import { aggregateTerrenoMetricas } from '../utils/parcelasStats';
import { exportInventarioParcelas } from '../utils/exportInventarioParcelasExcel';
import { useModuleUiState } from '../stores/moduleUiStore';
import { useRolePermissions } from '../hooks/useRolePermissions';
import type { Column } from '../components/DataTable';
import { AlertTriangle, ArrowLeft, Loader2, Map, MapPin, Layers, MinusCircle } from 'lucide-react';

const ESTADOS_PARCELA = ['disponible', 'comprometida', 'desincorporada'] as const;
type TerrenosFilters = typeof FILTROS_TERRENOS_VACIOS;

const ACTION_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed';

function formatAreaM2Detail(value: number) {
  return `${value.toLocaleString('es-VE')} m²`;
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
    if (filtros.fecha) {
      const fechaAdquisicion =
        t.fechaAdquisicion !== '—' ? t.fechaAdquisicion : t.fechaIngreso !== '—' ? t.fechaIngreso : '';
      if (fechaCalendarioIso(fechaAdquisicion) !== filtros.fecha) return false;
    }
    if (filtros.levantamiento && filtros.levantamiento !== 'Todos' && t.levantamientoTopografico !== filtros.levantamiento) return false;
    if (filtros.acreditacion && filtros.acreditacion !== 'Todos' && t.acreditacionTecnicaAmbiental !== filtros.acreditacion) return false;
    return true;
  });
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
  const { canWriteAssets } = useRolePermissions();
  const [protocolModalOpen, setProtocolModalOpen] = useState(false);
  const soloConsulta = parcelaSoloConsulta(terreno);
  const fieldsDisabled = soloConsulta || !canWriteAssets;
  const {
    draft,
    patchDraft,
    isDirty,
    saving,
    guardarCambio,
    parcelaPayloadFromApi,
  } = useTerrenoParcelaDetailEdit({
    terreno,
    raw,
    disabled: fieldsDisabled,
    onSaved: onUpdated,
  });
  const unsaved = useUnsavedChangesGuard(isDirty);
  const yaDesincorporada = parcelaTotalmenteDesincorporada(terreno);
  const compromisos = protocolos.filter((p) => p.tipoProtocolizacion === 'Compromiso');
  const desincorporaciones = protocolos.filter((p) => p.tipoProtocolizacion === 'Desincorporación');
  const sinAreaParaCompromiso = terreno.areaDisponible === 0 && !yaDesincorporada;

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

  return (
    <>
      {soloConsulta && (
        <div className="mx-4 md:mx-6 mt-4 max-w-7xl flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">Parcela sin área disponible.</span>
            {' '}
            Toda la superficie está protocolizada o desincorporada. Solo puede consultar la información histórica;
            no es posible mover la parcela, editar datos ni registrar nuevas protocolizaciones.
          </p>
        </div>
      )}
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
              {
                label: 'Identificación',
                value: (
                  <DetailFieldInput
                    value={draft.identificacion}
                    onChange={(value) => patchDraft({ identificacion: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Código',
                value: <DetailReadOnly>{terreno.codigo}</DetailReadOnly>,
              },
              {
                label: 'Acreditación Técnica Ambiental',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.acreditacionTecnicaAmbiental}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={draft.acreditacionTecnicaAmbiental}
                    onChange={(value) =>
                      patchDraft({
                        acreditacionTecnicaAmbiental: value as Terreno['acreditacionTecnicaAmbiental'],
                      })
                    }
                    options={ESTADOS_TRAMITE}
                    className="max-w-xs"
                    disableSearch
                  />
                ),
              },
              {
                label: 'Fecha de Ingreso',
                value: (
                  <DetailReadOnly>{formatFecha(terreno.fechaIngreso) || '—'}</DetailReadOnly>
                ),
              },
              {
                label: 'Ubicación Adicional',
                value: (
                  <DetailFieldInput
                    value={draft.ubicacionAdicional}
                    onChange={(value) => patchDraft({ ubicacionAdicional: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Levantamiento topográfico',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.levantamientoTopografico}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={draft.levantamientoTopografico}
                    onChange={(value) =>
                      patchDraft({
                        levantamientoTopografico: value as Terreno['levantamientoTopografico'],
                      })
                    }
                    options={LEVANTAMIENTO_TOPOGRAFICO_OPCIONES}
                    className="max-w-xs"
                    disableSearch
                  />
                ),
              },
              {
                label: 'Número de Propiedad',
                value: <DetailReadOnly>{terreno.nroPropiedad}</DetailReadOnly>,
              },
              {
                label: 'Valor de Adquisición',
                value: fieldsDisabled ? (
                  <DetailReadOnly>
                    {formatMoneda(draft.valorAdquisicion, terreno.moneda)}
                  </DetailReadOnly>
                ) : (
                  <CurrencyAmountInput
                    value={draft.valorAdquisicion}
                    onChange={(value) => patchDraft({ valorAdquisicion: value })}
                  />
                ),
              },
              {
                label: 'Área Desincorporada',
                value: <DetailReadOnly>{formatAreaM2Detail(terreno.areaDesincorporada)}</DetailReadOnly>,
              },
              {
                label: 'Zona',
                value: (
                  <DetailFieldInput
                    value={draft.zona}
                    onChange={(value) => patchDraft({ zona: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Responsable',
                value: (
                  <DetailReadOnly>
                    {terreno.responsable !== '—'
                      ? terreno.responsable
                      : terreno.ciResponsable
                        ? `CI ${terreno.ciResponsable}`
                        : '—'}
                  </DetailReadOnly>
                ),
              },
              {
                label: 'Área Comprometida',
                value: <DetailReadOnly>{formatAreaM2Detail(terreno.areaComprometida)}</DetailReadOnly>,
              },
              {
                label: 'Ubicación',
                value: <DetailReadOnly>{terreno.ubicacion}</DetailReadOnly>,
              },
              {
                label: 'Observación',
                value: (
                  <DetailFieldInput
                    value={draft.observacion}
                    onChange={(value) => patchDraft({ observacion: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Área Disponible',
                value: <DetailReadOnly>{formatAreaM2Detail(terreno.areaDisponible)}</DetailReadOnly>,
              },
              {
                label: 'Zonificación',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.zonificacion || '—'}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={draft.zonificacion}
                    onChange={(value) => patchDraft({ zonificacion: value })}
                    options={[...ZONIFICACIONES]}
                    className="max-w-xs"
                  />
                ),
              },
            ],
          },
          {
            title: 'Detalles del documento de Ingreso',
            fields: [
              {
                label: 'Nro de Documento',
                value: <DetailReadOnly>{terreno.numeroDocumento || '—'}</DetailReadOnly>,
              },
              {
                label: 'Número de Propiedad',
                value: <DetailReadOnly>{terreno.nroPropiedad}</DetailReadOnly>,
              },
              {
                label: 'Área Total M²',
                value: <DetailReadOnly>{formatAreaM2Detail(terreno.areaTotalM2)}</DetailReadOnly>,
              },
              {
                label: 'Fecha Adquisición',
                value: <DetailReadOnly>{formatFecha(terreno.fechaAdquisicion) || '—'}</DetailReadOnly>,
              },
              {
                label: 'Forma de Adquisición',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.formaAdquisicion}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={formaAdquisicionToApi(draft.formaAdquisicion)}
                    onChange={(value) => {
                      const forma = FORMAS_ADQUISICION_DOCUMENTO.find((item) => item.value === value);
                      if (forma) {
                        patchDraft({ formaAdquisicion: forma.label as FormaAdquisicion });
                      }
                    }}
                    options={FORMAS_ADQUISICION_DOCUMENTO}
                    className="max-w-xs"
                    disableSearch
                  />
                ),
              },
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
            {canWriteAssets && !soloConsulta && (
              <button
                type="button"
                onClick={() => setProtocolModalOpen(true)}
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
            {canWriteAssets && !soloConsulta && (
              <button
                type="button"
                onClick={guardarCambio}
                disabled={saving || !isDirty}
                aria-busy={saving}
                className={`${ACTION_BTN} px-5 py-2.5 bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-60`}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambio'
                )}
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
                        Para desincorporar área comprometida, use «Agregar Protocolización» con tipo Desincorporación.
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

      <NuevaProtocolizacionModal
        open={protocolModalOpen}
        onClose={() => setProtocolModalOpen(false)}
        tipo="Compromiso"
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
    () => fetchParcelaById(id!),
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
    const terrenoDetalle =
      detailQuery.data?.terreno
      ?? terrenos.find((t) => t.codigo === id || String(t.id) === id)
      ?? null;
    const raw = detailQuery.data?.raw;
    const protos = detailQuery.data?.protocolos ?? [];

    return (
      <ApiState
        loading={detailQuery.loading && !terrenoDetalle}
        error={detailQuery.error}
        onRetry={detailQuery.refetch}
      >
        {terrenoDetalle && raw && (
          <TerrenoParcelaDetail
            terreno={terrenoDetalle}
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

{/* Tabla de terrenos */}
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
          onDetails={(t) => navigate(`/terrenos/${encodeURIComponent(String(t.id))}`)}
        />

{/* Paginación */}
        <ModuleTablePaginationBar
          perPage={perPage}
          onPerPageChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
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
