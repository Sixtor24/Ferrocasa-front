import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchAlmacenes } from '../api/services/almacenes.service';
import { API_MAX_LIMIT } from '../api/pagination';
import { aggregateBienesMetricsFromList } from '../utils/bienesStats';
import {
  INVENTARIO_VIEW_OPTIONS,
  isInventarioActivo,
  matchesInventarioView,
  resolveInventarioView,
} from '../utils/inventarioActivo';
import { fetchApiBienByCodigo, updateBien } from '../api/services/bienes.service';
import {
  fetchAllBienesAdministrativos,
  fetchBienAdministrativoByCodigo,
  fetchBienesAdministrativos,
} from '../api/services/bienes-sedes.service';
import { useApiQuery } from '../hooks/useApiQuery';
import ApiState from '../components/ApiState';
import AssetDetailView from '../components/module/AssetDetailView';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import SearchableSelect from '../components/forms/SearchableSelect';
import { FILTROS_INVENTARIO_VACIOS } from '../constants/moduleFilters';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import ModuleMetricCard from '../components/module/ModuleMetricCard';
import {
  CONDICIONES_FISICAS,
  ESTADOS_USO,
} from '../types/bien';
import {
  ALMACENES_BIENES_ADMINISTRATIVOS,
  DEPARTAMENTOS_BIENES_ADMINISTRATIVOS,
} from '../data/bienesCatalogos';
import { formatFecha, formatMoneda, fechaCalendarioIso } from '../utils/formatters';
import { notifyBienActualizado } from '../utils/assetNotify';
import { apiBienToUpdatePayload } from '../utils/assetUpdateMappers';
import { bienCodigoPk } from '../utils/bienCodigo';
import { condicionFisicaToApi, estadoUsoToApi } from '../utils/registroBienMappers';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import UnsavedChangesModal from '../components/modals/UnsavedChangesModal';
import { useModuleUiState } from '../stores/moduleUiStore';
import type { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { RegistroBienesAdministrativosModal } from '../components/modals';
import RetirarInventarioModal from '../components/modals/RetirarInventarioModal';
import TransferirAlmacenModal from '../components/modals/TransferirAlmacenModal';
import {
  useBienInventarioActions,
  type InventarioBienActionResult,
} from '../hooks/useBienInventarioActions';
import type { ApiAlmacen } from '../api/types';
import type { BienMueble } from '../types/bien';
import ModulePageHeader from '../components/module/ModulePageHeader';
import { useRolePermissions } from '../hooks/useRolePermissions';
import {
  Package,
  AlertTriangle,
  BarChart3,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const ACTION_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed';

const ALMACEN_COLUMNS: Column<BienMueble>[] = [
  {
    key: 'codigoInterno',
    label: 'Código',
    render: (b) => (
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-navy-900">{b.codigoInterno}</span>
        {b.sinCodigo && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">S/C</span>
        )}
      </div>
    ),
  },
  {
    key: 'descripcion',
    label: 'Descripción',
    render: (b) => (
      <span className="max-w-[200px] truncate block" title={b.descripcion}>
        {b.descripcion}
      </span>
    ),
  },
  { key: 'marca', label: 'Marca', render: (b) => <span>{b.marca || '—'}</span> },
  { key: 'modelo', label: 'Modelo', render: (b) => <span>{b.modelo || '—'}</span> },
  { key: 'color', label: 'Color', render: (b) => <span>{b.color || '—'}</span> },
  {
    key: 'serial',
    label: 'Serial',
    render: (b) =>
      b.sinSerial ? (
        <span className="text-amber-600 text-xs font-semibold">S/S</span>
      ) : (
        <span className="font-mono text-sm">{b.serial || '—'}</span>
      ),
  },
  { key: 'sede', label: 'Sede' },
  { key: 'ubicacion', label: 'Almacén' },
  { key: 'estadoUso', label: 'Estado de uso', render: (b) => <StatusBadge status={b.estadoUso} size="sm" /> },
  {
    key: 'condicionFisica',
    label: 'Condición Física',
    render: (b) => <StatusBadge status={b.condicionFisica} showDot size="sm" />,
  },
];

function hasActiveInventoryFilters(filtros: typeof FILTROS_INVENTARIO_VACIOS) {
  return Object.entries(filtros).some(([key, value]) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (key === 'almacen' && trimmed === 'Todas') return false;
    if (key === 'departamento' && trimmed === 'Todos') return false;
    if (key === 'condicionFisica' && trimmed === 'Todas') return false;
    if (key === 'estadoUso' && trimmed === 'Todos') return false;
    if (key === 'inventario' && trimmed === 'Activos') return false;
    return true;
  });
}

function AlmacenBienDetail({
  bien,
  almacenes,
  onVolver,
  onSaved,
  onInventarioAction,
}: {
  bien: BienMueble;
  almacenes: ApiAlmacen[];
  onVolver: () => void;
  onSaved?: () => void | Promise<void>;
  onInventarioAction?: (result: InventarioBienActionResult) => void;
}) {
  const { canWriteAssets, canTransferBien, canRetireBien } = useRolePermissions();
  const navigate = useNavigate();
  const [estadoUso, setEstadoUso] = useState(bien.estadoUso);
  const [condicionFisica, setCondicionFisica] = useState(bien.condicionFisica);
  const [saving, setSaving] = useState(false);
  const inventario = useBienInventarioActions({ bien, almacenes, onActionSuccess: onInventarioAction });

  useEffect(() => {
    setEstadoUso(bien.estadoUso);
    setCondicionFisica(bien.condicionFisica);
  }, [bien.estadoUso, bien.condicionFisica]);

  const isDirty =
    estadoUso !== bien.estadoUso || condicionFisica !== bien.condicionFisica;
  const unsaved = useUnsavedChangesGuard(isDirty);

  const guardarCambio = async () => {
    if (!isDirty || saving) return;

    setSaving(true);
    try {
      const codigo = bienCodigoPk(bien);
      const apiBien = await fetchApiBienByCodigo(codigo);
      const payload = apiBienToUpdatePayload(apiBien, {
        estado_uso: estadoUsoToApi(estadoUso),
        condicion_fisica: condicionFisicaToApi(condicionFisica),
      });
      await updateBien(codigo, payload);
      notifyBienActualizado(bien, { estadoUso, condicionFisica });
      await onSaved?.();
    } catch (err) {
      toast.error('No se pudo guardar el cambio', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <AssetDetailView
      title="Bienes e Inmuebles: Edificio Administrativo"
      onNavigateTo={(to) =>
        unsaved.requestLeave(() => (to === '/almacen' ? onVolver() : navigate(to)))
      }
      breadcrumb={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Bienes en Edificio Administrativo', to: '/almacen' },
        { label: bien.sinCodigo ? 'Sin código' : bien.codigoInterno },
      ]}
      categoryFields={[
        { label: 'Categoría', value: bien.categoriaGeneral },
        { label: 'Sub Categoría', value: bien.subcategoria },
        { label: 'Categoría Específica', value: bien.categoriaEspecifica },
      ]}
      sections={[
        {
          title: 'Detalles',
          fields: [
            { label: 'Descripción', value: bien.descripcion },
            { label: 'Código', value: bien.sinCodigo ? 'Sin código' : bien.codigoInterno },
            {
              label: 'Estado de uso',
              value: (
                <SearchableSelect
                  value={estadoUso}
                  onChange={(value) => setEstadoUso(value as BienMueble['estadoUso'])}
                  options={ESTADOS_USO}
                  className="max-w-xs"
                  disabled={inventario.retirado || !canWriteAssets}
                  disableSearch
                />
              ),
            },
            { label: 'Fecha de Ingreso', value: formatFecha(bien.fechaAdquisicion) || '—' },
            { label: 'Serial', value: bien.sinSerial ? 'Sin serial' : (bien.serial || '—') },
            {
              label: 'Condición Física',
              value: (
                <SearchableSelect
                  value={condicionFisica}
                  onChange={(value) => setCondicionFisica(value as BienMueble['condicionFisica'])}
                  options={CONDICIONES_FISICAS}
                  className="max-w-xs"
                  disabled={inventario.retirado || !canWriteAssets}
                  disableSearch
                />
              ),
            },
            { label: 'Color', value: bien.color || '—' },
            {
              label: 'Responsable',
              value: bien.responsable !== '—'
                ? bien.responsable
                : bien.ciResponsable
                  ? `CI ${bien.ciResponsable}`
                  : '—',
            },
            { label: 'Almacén', value: bien.ubicacion },
            { label: 'Marca', value: bien.marca },
            { label: 'Unidad Administrativa', value: bien.unidadAdministrativa },
            { label: 'Modelo', value: bien.modelo || '—' },
            { label: 'Sede', value: bien.sede },
            { label: 'Valor de Adquisición', value: formatMoneda(bien.valorAdquisicion, bien.moneda) },
          ],
        },
        {
          title: 'Detalles del documento de Ingreso',
          fields: [
            { label: 'Nro de Documento', value: bien.numeroDocumento || '—' },
            { label: 'Forma de Adquisición', value: bien.formaAdquisicion },
            { label: 'Valor Total de Documento', value: formatMoneda(bien.valorAdquisicion, bien.moneda) },
            { label: 'Fecha Adquisición', value: formatFecha(bien.fechaAdquisicion) || '—' },
            { label: 'Nombre de Proveedor', value: bien.nombreProveedor },
          ],
        },
      ]}
      actions={
        <>
          <button
            type="button"
            onClick={() => unsaved.requestLeave(onVolver)}
            className={`${ACTION_BTN} px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50`}
          >
            <ArrowLeft size={16} aria-hidden />
            Volver al listado
          </button>
          {canWriteAssets && (
            <button
              type="button"
              onClick={guardarCambio}
              disabled={saving || !isDirty || inventario.retirado}
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
          {canTransferBien && (
            <button
              type="button"
              onClick={() => inventario.setTransferOpen(true)}
              disabled={inventario.retirado || inventario.transferLoading || inventario.retireLoading}
              className={`${ACTION_BTN} px-5 py-2.5 border border-navy-200 text-navy-800 hover:bg-navy-50 disabled:opacity-50`}
            >
              Transferir a otro almacén
            </button>
          )}
          {canRetireBien && (
            <button
              type="button"
              onClick={() => inventario.setRetireOpen(true)}
              disabled={inventario.retirado || inventario.transferLoading || inventario.retireLoading}
              className={`${ACTION_BTN} px-5 py-2.5 border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50`}
            >
              Retirar de Inventario
            </button>
          )}
        </>
      }
    />
    <TransferirAlmacenModal
      open={inventario.transferOpen}
      onClose={() => inventario.setTransferOpen(false)}
      assetLabel={inventario.assetLabel}
      sedeActual={inventario.sedeActual}
      almacenActual={inventario.almacenActual}
      almacenes={inventario.almacenes}
      onConfirm={inventario.handleTransfer}
      loading={inventario.transferLoading}
    />
    <RetirarInventarioModal
      open={inventario.retireOpen}
      onClose={() => inventario.setRetireOpen(false)}
      assetLabel={inventario.assetLabel}
      onConfirm={inventario.handleRetire}
      loading={inventario.retireLoading}
    />
    <UnsavedChangesModal
      open={unsaved.modalOpen}
      onClose={unsaved.cancelLeave}
      onConfirm={unsaved.confirmLeave}
      subject="del bien"
    />
    </>
  );
}

export default function Almacen() {
  const { canWriteAssets, canExportInventory, canViewRetirados } = useRolePermissions();
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
  } = useModuleUiState('almacen', FILTROS_INVENTARIO_VACIOS);
  const showModal = modals.registro ?? false;
  const [perPage, setPerPage] = useState(50);

  const apiSearch = useMemo(() => filtros.buscar.trim() || undefined, [filtros.buscar]);

  const bienesQuery = useApiQuery(
    () => fetchBienesAdministrativos({ page, limit: perPage, search: apiSearch }),
    [page, perPage, apiSearch],
  );
  const metricsQuery = useApiQuery(
    async () => {
      const bienes = await fetchAllBienesAdministrativos({ search: apiSearch });
      return aggregateBienesMetricsFromList(bienes.filter(isInventarioActivo));
    },
    [apiSearch],
  );
  const almacenesQuery = useApiQuery(
    () => fetchAlmacenes({ page: 1, limit: API_MAX_LIMIT }),
    [],
    showModal || Boolean(id),
  );
  const detailQuery = useApiQuery(
    () => fetchBienAdministrativoByCodigo(id as string),
    [id],
    Boolean(id),
  );

  const lista = bienesQuery.data?.data ?? [];
  const bienesStats = metricsQuery.data ?? {
    total: 0,
    enUso: 0,
    enObsolescencia: 0,
    obsoletos: 0,
  };
  const totalPages = bienesQuery.data?.meta.totalPages ?? 1;
  const metricsLoading = metricsQuery.loading && !metricsQuery.data;
  const filtersActive = useMemo(() => hasActiveInventoryFilters(filtros), [filtros]);
  const inventarioView = resolveInventarioView(filtros.inventario, canViewRetirados);

  const almacenOptions = useMemo(() => ['Todas', ...ALMACENES_BIENES_ADMINISTRATIVOS], []);

  const filtered = useMemo(() => {
    return lista.filter((b) => {
      if (!matchesInventarioView(b, inventarioView)) return false;
      if (filtros.codigo && !b.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !b.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todas' && b.ubicacion !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && b.condicionFisica !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && b.unidadAdministrativa !== filtros.departamento) return false;
      if (filtros.numeroDocumento && !b.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.fecha && fechaCalendarioIso(b.fechaAdquisicion) !== filtros.fecha) return false;
      if (filtros.estadoUso && filtros.estadoUso !== 'Todos' && b.estadoUso !== filtros.estadoUso) return false;
      if (filtros.buscar) {
        const q = filtros.buscar.toLowerCase();
        const hay =
          b.codigoInterno.toLowerCase().includes(q) ||
          b.descripcion.toLowerCase().includes(q) ||
          b.marca.toLowerCase().includes(q) ||
          b.serial.toLowerCase().includes(q) ||
          b.ubicacion.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [lista, filtros, inventarioView]);

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setModuleFilter(key, value);
    setPage(1);
  };

  const refreshBienes = () => {
    void bienesQuery.refetch();
    void metricsQuery.refetch();
    if (id) void detailQuery.refetch();
  };

  const emptyMessage = filtersActive
    ? 'No hay bienes que coincidan con los filtros aplicados. Ajuste los criterios o limpie los filtros.'
    : 'No hay bienes registrados. Los registros nuevos requieren almacén y categoría en la base de datos.';

  if (id) {
    const bien =
      detailQuery.data ??
      lista.find((b) => b.codigoInterno === id || String(b.id) === id) ??
      null;

    return (
      <ApiState loading={detailQuery.loading && !bien} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {bien && (
          <AlmacenBienDetail
            bien={bien}
            almacenes={almacenesQuery.data?.data ?? []}
            onVolver={() => {
              refreshBienes();
              navigate('/almacen');
            }}
            onSaved={refreshBienes}
            onInventarioAction={async (result) => {
              if (result.type === 'transfer') {
                setModuleFilter('almacen', result.almacenDestino);
                try {
                  await fetchBienAdministrativoByCodigo(id);
                  refreshBienes();
                } catch {
                  navigate('/almacen');
                }
                return;
              }
              refreshBienes();
            }}
          />
        )}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <ModulePageHeader
        title="Bienes e Inmuebles Administrativos"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Bienes en Edificio Administrativo' }]}
        formatModule={canExportInventory ? 'almacen' : undefined}
        onCreate={canWriteAssets ? () => setModal('registro', true) : undefined}
        createLabel="Crear Registro"
      />

      {/* Resumen de inventario */}
      <section aria-label="Resumen de inventario" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleMetricCard
          label="Total Bienes"
          value={(bienesStats.total ?? 0).toLocaleString('es-VE')}
          icon={<Package size={22} className="text-navy-600" />}
          iconWrapClassName="bg-navy-100"
          loading={metricsLoading}
        />
        <ModuleMetricCard
          label="Bienes en uso"
          value={(bienesStats.enUso ?? 0).toLocaleString('es-VE')}
          icon={<BarChart3 size={22} className="text-green-600" />}
          iconWrapClassName="bg-green-100"
          valueClassName="text-green-700"
          loading={metricsLoading}
        />
        <ModuleMetricCard
          label="Bienes en obsolescencia"
          value={(bienesStats.enObsolescencia ?? 0).toLocaleString('es-VE')}
          icon={<AlertTriangle size={22} className="text-amber-500" />}
          iconWrapClassName="bg-amber-100"
          borderClassName="border-amber-200"
          valueClassName="text-amber-700"
          loading={metricsLoading}
        />
        <ModuleMetricCard
          label="Bienes Obsoletos"
          value={(bienesStats.obsoletos ?? 0).toLocaleString('es-VE')}
          icon={<AlertCircle size={22} className="text-red-500" />}
          iconWrapClassName="bg-red-100"
          borderClassName="border-red-200"
          valueClassName="text-red-700"
          loading={metricsLoading}
        />
      </section>

      {/* Filtros */}
      <ModuleFilterBar
        onClearFilters={() => {
          resetFilters();
        }}
        fields={[
          { key: 'codigo', label: 'Código', type: 'text', value: filtros.codigo, onChange: (v) => setFiltro('codigo', v) },
          { key: 'descripcion', label: 'Descripción', type: 'text', value: filtros.descripcion, onChange: (v) => setFiltro('descripcion', v) },
          {
            key: 'almacen',
            label: 'Almacén',
            type: 'select',
            value: filtros.almacen,
            onChange: (v) => setFiltro('almacen', v),
            options: almacenOptions,
          },
          {
            key: 'condicion',
            label: 'Condición Física',
            type: 'select',
            value: filtros.condicionFisica,
            onChange: (v) => setFiltro('condicionFisica', v),
            options: ['Todas', ...CONDICIONES_FISICAS],
          },
          {
            key: 'departamento',
            label: 'Unidad Administrativa',
            type: 'select',
            value: filtros.departamento,
            onChange: (v) => setFiltro('departamento', v),
            options: ['Todos', ...DEPARTAMENTOS_BIENES_ADMINISTRATIVOS],
          },
          {
            key: 'documento',
            label: 'Número de documento',
            type: 'text',
            value: filtros.numeroDocumento,
            onChange: (v) => setFiltro('numeroDocumento', v),
          },
          {
            key: 'fecha',
            label: 'Fecha',
            type: 'date',
            value: filtros.fecha,
            onChange: (v) => setFiltro('fecha', v),
          },
          {
            key: 'estado',
            label: 'Estado de uso',
            type: 'select',
            value: filtros.estadoUso,
            onChange: (v) => setFiltro('estadoUso', v),
            options: [...ESTADOS_USO],
          },
          ...(canViewRetirados
            ? [
                {
                  key: 'inventario',
                  label: 'Ver retirados',
                  type: 'select' as const,
                  value: inventarioView,
                  onChange: (v: string) => setFiltro('inventario', v),
                  options: [...INVENTARIO_VIEW_OPTIONS],
                },
              ]
            : []),
          {
            key: 'buscar',
            label: 'Buscar',
            type: 'search',
            value: filtros.buscar,
            onChange: (v) => setFiltro('buscar', v),
            placeholder: 'Buscar por código, descripción, marca, serial...',
            className: 'sm:col-span-2 lg:col-span-1',
          },
        ]}
      >
        <p className="text-sm text-gray-500 tabular-nums" aria-live="polite">
          {filtered.length === lista.length
            ? `${lista.length} registro${lista.length === 1 ? '' : 's'} en esta página`
            : `${filtered.length} de ${lista.length} en esta página`}
          {filtersActive ? ' · filtros activos' : ''}
        </p>
      </ModuleFilterBar>

      {/* Tabla de bienes */}
      <ApiState
        loading={bienesQuery.loading && !bienesQuery.data}
        error={bienesQuery.error}
        onRetry={bienesQuery.refetch}
        empty={!bienesQuery.loading && filtered.length === 0}
        emptyMessage={emptyMessage}
      >
        <ModuleDataTable
          data={filtered}
          columns={ALMACEN_COLUMNS}
          loading={bienesQuery.loading && Boolean(bienesQuery.data)}
          onDetails={(b) => navigate(`/almacen/${encodeURIComponent(b.codigoInterno)}`)}
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

      {/* Modal de registro de bienes */}
      <RegistroBienesAdministrativosModal
        open={showModal}
        onClose={() => setModal('registro', false)}
        onSuccess={refreshBienes}
        onError={() => {}}
      />
    </div>
  );
}
