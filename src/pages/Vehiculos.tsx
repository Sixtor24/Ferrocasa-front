import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchVehiculoByCodigo,
  fetchVehiculos,
  fetchVehiculosAll,
} from '../api/services/vehiculos.service';
import { fetchAllDepartamentos } from '../api/services/departamentos.service';
import { fetchAlmacenes } from '../api/services/almacenes.service';
import { fetchSedes } from '../api/services/sedes.service';
import { API_MAX_LIMIT } from '../api/pagination';
import { useApiQuery } from '../hooks/useApiQuery';
import { RegistroVehiculosModal } from '../components/modals';
import TransferirAlmacenModal from '../components/modals/TransferirAlmacenModal';
import UnsavedChangesModal from '../components/modals/UnsavedChangesModal';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import {
  useVehiculoInventarioActions,
  type InventarioVehiculoActionResult,
} from '../hooks/useVehiculoInventarioActions';
import type { ApiAlmacen } from '../api/types';
import { CONDICIONES_VEHICULO, ESTADOS_USO_VEHICULO } from '../types/vehiculo';
import type { Vehiculo } from '../types/vehiculo';
import ModulePageHeader from '../components/module/ModulePageHeader';
import { useRolePermissions } from '../hooks/useRolePermissions';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import ModuleMetricCard from '../components/module/ModuleMetricCard';
import SearchableSelect from '../components/forms/SearchableSelect';
import { FILTROS_INVENTARIO_VACIOS } from '../constants/moduleFilters';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModuleTablePaginationBar from '../components/module/ModuleTablePaginationBar';
import AssetDetailView from '../components/module/AssetDetailView';
import ApiState from '../components/ApiState';
import StatusBadge from '../components/StatusBadge';
import CurrencyAmountInput from '../components/forms/CurrencyAmountInput';
import FechaFilterInput from '../components/forms/FechaFilterInput';
import FlexibleIntegerInput from '../components/forms/FlexibleIntegerInput';
import DetailFieldInput, { DetailReadOnly } from '../components/module/DetailFieldInput';
import { formatFecha, formatMoneda, fechaCalendarioIso } from '../utils/formatters';
import {
  FORMAS_ADQUISICION_DOCUMENTO,
  formaAdquisicionToApi,
} from '../utils/formaAdquisicionMappers';
import { useVehiculoDetailEdit } from '../modules/vehiculos/useVehiculoDetailEdit';
import { aggregateVehiculosMetricsFromList } from '../utils/vehiculosStats';
import { filterAlmacenesVehiculos, nombresAlmacenesVehiculos } from '../utils/vehiculoAlmacenes';
import {
  INVENTARIO_VIEW_OPTIONS,
  isInventarioActivo,
  matchesInventarioView,
  resolveInventarioView,
} from '../utils/inventarioActivo';
import { useModuleUiState } from '../stores/moduleUiStore';
import type { Column } from '../components/DataTable';
import { AlertCircle, AlertTriangle, ArrowLeft, BarChart3, Car, Loader2 } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 50;

const ACTION_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed';

function catalogOptions(values: string[], allLabel: string) {
  const unique = Array.from(
    new Set(values.filter((value) => value && value !== '—')),
  ).sort((a, b) => a.localeCompare(b, 'es'));
  return [allLabel, ...unique];
}

function VehiculoDetail({
  vehiculo,
  almacenes,
  onVolver,
  onSaved,
  onInventarioAction,
}: {
  vehiculo: Vehiculo;
  almacenes: ApiAlmacen[];
  onVolver: () => void;
  onSaved?: () => void | Promise<void>;
  onInventarioAction?: (result: InventarioVehiculoActionResult) => void;
}) {
  const { canWriteAssets, canTransferBien } = useRolePermissions();
  const navigate = useNavigate();
  const inventario = useVehiculoInventarioActions({ vehiculo, almacenes, onActionSuccess: onInventarioAction });
  const fieldsDisabled = inventario.retirado || !canWriteAssets;
  const {
    draft,
    patchDraft,
    isDirty,
    saving,
    guardarCambio,
    almacenOptions,
    sede,
    unidadAdministrativa,
    responsableDisplay,
    valorTotalDocumento,
    valorTotalDocumentoLoading,
  } = useVehiculoDetailEdit({
    vehiculo,
    almacenes,
    disabled: fieldsDisabled,
    onSaved,
  });
  const unsaved = useUnsavedChangesGuard(isDirty);

  return (
    <>
      <AssetDetailView
        title="Vehículos y Maquinaria"
        onNavigateTo={(to) =>
          unsaved.requestLeave(() => (to === '/vehiculos' ? onVolver() : navigate(to)))
        }
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Vehículos', to: '/vehiculos' },
          { label: vehiculo.codigoInterno },
        ]}
        categoryFields={[
          { label: 'Categoría', value: vehiculo.categoriaGeneral },
          { label: 'Sub Categoría', value: vehiculo.subcategoria },
          { label: 'Categoría Específica', value: vehiculo.categoriaEspecifica },
        ]}
        sections={[
          {
            title: 'Detalles',
            fields: [
              {
                label: 'Descripción',
                value: (
                  <DetailFieldInput
                    value={draft.descripcion}
                    onChange={(value) => patchDraft({ descripcion: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Código',
                value: <DetailReadOnly>{vehiculo.codigoInterno}</DetailReadOnly>,
              },
              {
                label: 'Estado de uso',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.estadoUso}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={draft.estadoUso}
                    onChange={(value) =>
                      patchDraft({ estadoUso: value as Vehiculo['estadoUso'] })
                    }
                    options={ESTADOS_USO_VEHICULO}
                    className="max-w-xs"
                    disableSearch
                  />
                ),
              },
              {
                label: 'Fecha de Ingreso',
                value: (
                  <DetailReadOnly>
                    {formatFecha(vehiculo.fechaIngreso) || '—'}
                  </DetailReadOnly>
                ),
              },
              {
                label: 'Placa',
                value: (
                  <DetailFieldInput
                    value={draft.placa}
                    onChange={(value) => patchDraft({ placa: value })}
                    disabled={fieldsDisabled}
                    placeholder={vehiculo.sinPlaca ? 'Sin placa' : undefined}
                  />
                ),
              },
              {
                label: 'Condición Física',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.condicionFisica}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={draft.condicionFisica}
                    onChange={(value) =>
                      patchDraft({ condicionFisica: value as Vehiculo['condicionFisica'] })
                    }
                    options={CONDICIONES_VEHICULO}
                    className="max-w-xs"
                    disableSearch
                  />
                ),
              },
              {
                label: 'Color',
                value: (
                  <DetailFieldInput
                    value={draft.color}
                    onChange={(value) => patchDraft({ color: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Serial del motor',
                value: (
                  <DetailFieldInput
                    value={draft.serialMotor}
                    onChange={(value) => patchDraft({ serialMotor: value })}
                    disabled={fieldsDisabled}
                    placeholder={vehiculo.sinSerialMotor ? 'Sin serial' : undefined}
                  />
                ),
              },
              {
                label: 'Almacén',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.almacen || '—'}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={draft.almacen}
                    onChange={(value) => patchDraft({ almacen: value })}
                    options={almacenOptions}
                    className="max-w-xs"
                  />
                ),
              },
              {
                label: 'Marca',
                value: (
                  <DetailFieldInput
                    value={draft.marca}
                    onChange={(value) => patchDraft({ marca: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Serial de carrocería',
                value: (
                  <DetailFieldInput
                    value={draft.serialCarroceria}
                    onChange={(value) => patchDraft({ serialCarroceria: value })}
                    disabled={fieldsDisabled}
                    placeholder={vehiculo.sinSerialCarroceria ? 'Sin serial' : undefined}
                  />
                ),
              },
              {
                label: 'Unidad Administrativa',
                value: <DetailReadOnly>{unidadAdministrativa || '—'}</DetailReadOnly>,
              },
              {
                label: 'Modelo',
                value: (
                  <DetailFieldInput
                    value={draft.modelo}
                    onChange={(value) => patchDraft({ modelo: value })}
                    disabled={fieldsDisabled}
                  />
                ),
              },
              {
                label: 'Responsable',
                value: <DetailReadOnly>{responsableDisplay}</DetailReadOnly>,
              },
              {
                label: 'Sede',
                value: <DetailReadOnly>{sede || '—'}</DetailReadOnly>,
              },
              {
                label: 'Año de fabricación',
                value: fieldsDisabled ? (
                  <DetailReadOnly>
                    {draft.anioFabricacion > 0 ? String(draft.anioFabricacion) : '—'}
                  </DetailReadOnly>
                ) : (
                  <FlexibleIntegerInput
                    value={draft.anioFabricacion}
                    onChange={(value) => patchDraft({ anioFabricacion: value })}
                    placeholder="Año"
                    className="input-field max-w-xs"
                  />
                ),
              },
              {
                label: 'Valor de Adquisición',
                value: fieldsDisabled ? (
                  <DetailReadOnly>
                    {formatMoneda(draft.valorAdquisicion, vehiculo.moneda)}
                  </DetailReadOnly>
                ) : (
                  <CurrencyAmountInput
                    value={draft.valorAdquisicion}
                    onChange={(value) => patchDraft({ valorAdquisicion: value })}
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
                value: <DetailReadOnly>{vehiculo.numeroDocumento || '—'}</DetailReadOnly>,
              },
              {
                label: 'Forma de Adquisición',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{draft.formaAdquisicion}</DetailReadOnly>
                ) : (
                  <SearchableSelect
                    value={formaAdquisicionToApi(draft.formaAdquisicion)}
                    onChange={(value) => {
                      const forma = FORMAS_ADQUISICION_DOCUMENTO.find(
                        (item) => item.value === value,
                      );
                      if (forma) {
                        patchDraft({
                          formaAdquisicion: forma.label as Vehiculo['formaAdquisicion'],
                        });
                      }
                    }}
                    options={FORMAS_ADQUISICION_DOCUMENTO}
                    className="max-w-xs"
                    disableSearch
                  />
                ),
              },
              {
                label: 'Valor Total de Documento',
                loading: valorTotalDocumentoLoading,
                value: (
                  <DetailReadOnly>
                    {formatMoneda(valorTotalDocumento, vehiculo.moneda)}
                  </DetailReadOnly>
                ),
              },
              {
                label: 'Fecha Adquisición',
                value: fieldsDisabled ? (
                  <DetailReadOnly>{formatFecha(draft.fechaAdquisicion) || '—'}</DetailReadOnly>
                ) : (
                  <FechaFilterInput
                    value={draft.fechaAdquisicion}
                    onChange={(value) => patchDraft({ fechaAdquisicion: value })}
                  />
                ),
              },
              {
                label: 'Nombre de Proveedor',
                value: (
                  <DetailFieldInput
                    value={draft.nombreProveedor}
                    onChange={(value) => patchDraft({ nombreProveedor: value })}
                    disabled={fieldsDisabled}
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
                disabled={inventario.retirado || inventario.transferLoading}
                className={`${ACTION_BTN} px-5 py-2.5 border border-navy-200 text-navy-800 hover:bg-navy-50 disabled:opacity-50`}
              >
                Transferir a otro almacén
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
      <UnsavedChangesModal
        open={unsaved.modalOpen}
        onClose={unsaved.cancelLeave}
        onConfirm={unsaved.confirmLeave}
        subject="del vehículo"
      />
    </>
  );
}

export default function Vehiculos() {
  const { canWriteAssets, canExportInventory, canViewRetirados } = useRolePermissions();
  const { id: codigoParam } = useParams();
  const codigoVehiculo = codigoParam ? decodeURIComponent(codigoParam) : undefined;
  const navigate = useNavigate();
  const {
    page,
    filters: filtros,
    modals,
    setPage,
    setFilter: setModuleFilter,
    resetFilters,
    setModal,
  } = useModuleUiState('vehiculos', FILTROS_INVENTARIO_VACIOS);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

  const showRegistro = modals.registro ?? false;
  const apiSearch = useMemo(() => filtros.buscar.trim() || undefined, [filtros.buscar]);

  const listQuery = useApiQuery(
    () => fetchVehiculos({ page, limit: perPage, search: apiSearch }),
    [page, perPage, apiSearch],
  );
  const metricsQuery = useApiQuery(
    async () => {
      const { data } = await fetchVehiculosAll({ search: apiSearch });
      return aggregateVehiculosMetricsFromList(data.filter(isInventarioActivo));
    },
    [apiSearch],
  );
  const almacenesQuery = useApiQuery(
    () => fetchAlmacenes({ page: 1, limit: API_MAX_LIMIT }),
    [],
    showRegistro || Boolean(codigoVehiculo),
  );
  const sedesQuery = useApiQuery(
    () => fetchSedes({ page: 1, limit: API_MAX_LIMIT }),
    [],
  );
  const departamentosQuery = useApiQuery(() => fetchAllDepartamentos(), []);

  const detailQuery = useApiQuery(
    () => fetchVehiculoByCodigo(codigoVehiculo!),
    [codigoVehiculo],
    Boolean(codigoVehiculo),
  );

  const lista = listQuery.data?.data ?? [];
  const metricas = metricsQuery.data ?? {
    total: 0,
    valorTotal: 0,
    enUso: 0,
    enObsolescencia: 0,
    obsoletos: 0,
  };

  const almacenesCatalogo = almacenesQuery.data?.data ?? [];
  const sedesCatalogo = sedesQuery.data?.data ?? [];

  const almacenesVehiculos = useMemo(
    () => filterAlmacenesVehiculos(almacenesCatalogo, sedesCatalogo),
    [almacenesCatalogo, sedesCatalogo],
  );

  const almacenOptions = useMemo(
    () => ['Todos', ...nombresAlmacenesVehiculos(almacenesCatalogo, sedesCatalogo)],
    [almacenesCatalogo, sedesCatalogo],
  );

  const unidadAdministrativaOptions = useMemo(
    () => {
      const departamentos = departamentosQuery.data?.map((departamento) => departamento.nombre);
      return catalogOptions(
        departamentos && departamentos.length > 0
          ? departamentos
          : lista.map((v) => v.unidadAdministrativa),
        'Todos',
      );
    },
    [departamentosQuery.data, lista],
  );

  const inventarioView = resolveInventarioView(filtros.inventario, canViewRetirados);

  const filtered = useMemo(() => {
    const q = filtros.buscar.trim().toLowerCase();
    return lista.filter((v) => {
      if (!matchesInventarioView(v, inventarioView)) return false;
      if (filtros.codigo && !v.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !v.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todos' && v.almacen !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && v.condicionFisica !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && v.unidadAdministrativa !== filtros.departamento) return false;
      if (filtros.fecha && fechaCalendarioIso(v.fechaAdquisicion) !== filtros.fecha) return false;
      if (filtros.estadoUso && filtros.estadoUso !== 'Todos' && v.estadoUso !== filtros.estadoUso) return false;
      if (q) {
        const hay =
          v.codigoInterno.toLowerCase().includes(q) ||
          v.descripcion.toLowerCase().includes(q) ||
          v.marca.toLowerCase().includes(q) ||
          v.modelo.toLowerCase().includes(q) ||
          v.placa.toLowerCase().includes(q) ||
          v.almacen.toLowerCase().includes(q) ||
          v.sede.toLowerCase().includes(q) ||
          v.unidadAdministrativa.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [lista, filtros, inventarioView]);

  const totalPages = listQuery.data?.meta.totalPages ?? 1;
  const paginated = filtered;

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setModuleFilter(key, value);
    setPage(1);
  };

  const refreshVehiculos = () => {
    listQuery.refetch();
    metricsQuery.refetch();
    detailQuery.refetch();
  };

  const columns: Column<Vehiculo>[] = [
    { key: 'codigoInterno', label: 'Código', render: (v) => <span className="font-mono font-bold text-navy-900">{v.codigoInterno}</span> },
    { key: 'descripcion', label: 'Descripción', render: (v) => <span className="max-w-[200px] truncate block">{v.descripcion}</span> },
    { key: 'placa', label: 'Placa', render: (v) => (v.sinPlaca ? <span className="text-amber-600 text-xs font-semibold">S/P</span> : <span className="font-mono">{v.placa}</span>) },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'color', label: 'Color' },
    { key: 'almacen', label: 'Almacén' },
    { key: 'sede', label: 'Sede' },
    { key: 'fechaAdquisicion', label: 'Fecha de adquisición', render: (v) => formatFecha(v.fechaAdquisicion) },
    { key: 'estadoUso', label: 'Estado de uso', render: (v) => <StatusBadge status={v.estadoUso} size="sm" /> },
    { key: 'condicionFisica', label: 'Condición Física', render: (v) => <StatusBadge status={v.condicionFisica} showDot size="sm" /> },
  ];

  if (codigoVehiculo) {
    const vehiculoDetalle =
      detailQuery.data ??
      lista.find(
        (v) => v.codigoInterno === codigoVehiculo || String(v.id) === codigoVehiculo,
      ) ??
      null;

    return (
      <ApiState
        loading={detailQuery.loading && !vehiculoDetalle}
        error={detailQuery.error}
        onRetry={detailQuery.refetch}
      >
        {vehiculoDetalle && (
          <VehiculoDetail
            vehiculo={vehiculoDetalle}
            almacenes={almacenesVehiculos}
            onVolver={() => {
              refreshVehiculos();
              navigate('/vehiculos');
            }}
            onSaved={refreshVehiculos}
            onInventarioAction={() => {
              refreshVehiculos();
            }}
          />
        )}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Vehículos y Maquinaria"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Vehículos' }]}
        formatModule={canExportInventory ? 'vehiculos' : undefined}
        onCreate={canWriteAssets ? () => setModal('registro', true) : undefined}
        createLabel="Crear Registro"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleMetricCard
          label="Total vehículos"
          value={(metricas.total ?? 0).toLocaleString('es-VE')}
          icon={<Car size={22} className="text-navy-600" />}
          iconWrapClassName="bg-navy-100"
        />
        <ModuleMetricCard
          label="En Uso"
          value={(metricas.enUso ?? 0).toLocaleString('es-VE')}
          icon={<BarChart3 size={22} className="text-green-600" />}
          iconWrapClassName="bg-green-100"
          valueClassName="text-green-700"
        />
        <ModuleMetricCard
          label="En obsolescencia"
          value={(metricas.enObsolescencia ?? 0).toLocaleString('es-VE')}
          icon={<AlertTriangle size={22} className="text-amber-500" />}
          iconWrapClassName="bg-amber-100"
          borderClassName="border-amber-200"
          valueClassName="text-amber-700"
        />
        <ModuleMetricCard
          label="Obsoleto"
          value={(metricas.obsoletos ?? 0).toLocaleString('es-VE')}
          icon={<AlertCircle size={22} className="text-red-500" />}
          iconWrapClassName="bg-red-100"
          borderClassName="border-red-200"
          valueClassName="text-red-700"
        />
      </div>

      <ModuleFilterBar
        onClearFilters={() => {
          resetFilters();
        }}
        fields={[
          { key: 'codigo', label: 'Código', type: 'text', value: filtros.codigo, onChange: (v) => setFiltro('codigo', v) },
          { key: 'descripcion', label: 'Descripción', type: 'text', value: filtros.descripcion, onChange: (v) => setFiltro('descripcion', v) },
          { key: 'almacen', label: 'Almacén', type: 'select', value: filtros.almacen, onChange: (v) => setFiltro('almacen', v), options: almacenOptions },
          { key: 'condicion', label: 'Condición Física', type: 'select', value: filtros.condicionFisica, onChange: (v) => setFiltro('condicionFisica', v), options: ['Todas', ...CONDICIONES_VEHICULO] },
          { key: 'departamento', label: 'Unidad Administrativa', type: 'select', value: filtros.departamento, onChange: (v) => setFiltro('departamento', v), options: unidadAdministrativaOptions },
          { key: 'fecha', label: 'Fecha de adquisición', type: 'date', value: filtros.fecha, onChange: (v) => setFiltro('fecha', v) },
          { key: 'estado', label: 'Estado de uso', type: 'select', value: filtros.estadoUso, onChange: (v) => setFiltro('estadoUso', v), options: ['Todos', ...ESTADOS_USO_VEHICULO] },
          ...(canViewRetirados
            ? [{ key: 'inventario', label: 'Ver retirados', type: 'select' as const, value: inventarioView, onChange: (v: string) => setFiltro('inventario', v), options: [...INVENTARIO_VIEW_OPTIONS] }]
            : []),
          { key: 'buscar', label: 'Buscar', type: 'search', value: filtros.buscar, onChange: (v) => setFiltro('buscar', v), placeholder: 'Buscar...', className: 'lg:col-span-1' },
        ]}
      />

      <ApiState
        loading={listQuery.loading && !listQuery.data}
        error={listQuery.error}
        onRetry={listQuery.refetch}
        empty={!listQuery.loading && filtered.length === 0}
        emptyMessage="No hay vehículos registrados en el inventario."
      >
        <ModuleDataTable
          data={paginated}
          columns={columns}
          loading={listQuery.loading && Boolean(listQuery.data)}
          onDetails={(v) => navigate(`/vehiculos/${encodeURIComponent(String(v.codigoInterno))}`)}
        />

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

      <RegistroVehiculosModal
        open={showRegistro}
        onClose={() => setModal('registro', false)}
        onSuccess={() => {
          refreshVehiculos();
        }}
        onError={() => {}}
      />
    </div>
  );
}
