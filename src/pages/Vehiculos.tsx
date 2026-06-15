import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchApiVehiculoByCodigo,
  fetchVehiculoByCodigo,
  fetchVehiculos,
  fetchVehiculosAll,
  updateVehiculo,
} from '../api/services/vehiculos.service';
import { fetchAllDepartamentos } from '../api/services/departamentos.service';
import { fetchAlmacenes } from '../api/services/almacenes.service';
import { API_MAX_LIMIT } from '../api/pagination';
import { useApiQuery } from '../hooks/useApiQuery';
import { RegistroVehiculosModal } from '../components/modals';
import RetirarInventarioModal from '../components/modals/RetirarInventarioModal';
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
import { formatFecha, formatMoneda } from '../utils/formatters';
import { notifyVehiculoActualizado } from '../utils/assetNotify';
import { apiVehiculoToUpdatePayload } from '../utils/assetUpdateMappers';
import {
  condicionVehiculoToApi,
  estadoUsoVehiculoToApi,
} from '../utils/registroVehiculoMappers';
import { aggregateVehiculosMetricsFromList } from '../utils/vehiculosStats';
import { useModuleUiState } from '../stores/moduleUiStore';
import type { Column } from '../components/DataTable';
import { AlertCircle, AlertTriangle, ArrowLeft, BarChart3, Car } from 'lucide-react';

const DEFAULT_PAGE_SIZE = 50;

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
  const { canWriteAssets, canTransferBien, canRetireBien } = useRolePermissions();
  const navigate = useNavigate();
  const [estadoUso, setEstadoUso] = useState(vehiculo.estadoUso);
  const [condicionFisica, setCondicionFisica] = useState(vehiculo.condicionFisica);
  const [saving, setSaving] = useState(false);
  const inventario = useVehiculoInventarioActions({ vehiculo, almacenes, onActionSuccess: onInventarioAction });

  useEffect(() => {
    setEstadoUso(vehiculo.estadoUso);
    setCondicionFisica(vehiculo.condicionFisica);
  }, [vehiculo.estadoUso, vehiculo.condicionFisica]);

  const isDirty =
    estadoUso !== vehiculo.estadoUso || condicionFisica !== vehiculo.condicionFisica;
  const unsaved = useUnsavedChangesGuard(isDirty);

  const guardarCambio = async () => {
    setSaving(true);
    try {
      const apiVehiculo = await fetchApiVehiculoByCodigo(vehiculo.id);
      const payload = apiVehiculoToUpdatePayload(apiVehiculo, {
        estado_uso: estadoUsoVehiculoToApi(estadoUso),
        condicion_fisica: condicionVehiculoToApi(condicionFisica),
      });
      await updateVehiculo(vehiculo.id, payload);
      notifyVehiculoActualizado(vehiculo, estadoUso);
      await onSaved?.();
    } catch (err) {
      toast.error('No se pudo guardar el cambio', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const placaDisplay = vehiculo.sinPlaca ? 'Sin placa' : vehiculo.placa;
  const serialMotorDisplay = vehiculo.sinSerialMotor ? 'Sin serial' : vehiculo.serialMotor;
  const serialCarroceriaDisplay = vehiculo.sinSerialCarroceria
    ? 'Sin serial'
    : (vehiculo.serialCarroceria || '—');

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
              { label: 'Descripción', value: vehiculo.descripcion },
              { label: 'Código', value: vehiculo.codigoInterno },
              {
                label: 'Estado de uso',
                value: (
                  <SearchableSelect
                    value={estadoUso}
                    onChange={(value) => setEstadoUso(value as Vehiculo['estadoUso'])}
                    options={ESTADOS_USO_VEHICULO}
                    className="max-w-xs"
                    disabled={inventario.retirado || !canWriteAssets}
                    disableSearch
                  />
                ),
              },
              { label: 'Fecha de Ingreso', value: formatFecha(vehiculo.fechaIngreso) },
              { label: 'Placa', value: placaDisplay },
              {
                label: 'Condición Física',
                value: (
                  <SearchableSelect
                    value={condicionFisica}
                    onChange={(value) => setCondicionFisica(value as Vehiculo['condicionFisica'])}
                    options={CONDICIONES_VEHICULO}
                    className="max-w-xs"
                    disabled={inventario.retirado || !canWriteAssets}
                    disableSearch
                  />
                ),
              },
              { label: 'Color', value: vehiculo.color },
              { label: 'Serial del motor', value: serialMotorDisplay },
              { label: 'Almacén', value: vehiculo.almacen },
              { label: 'Marca', value: vehiculo.marca },
              { label: 'Serial de carrocería', value: serialCarroceriaDisplay },
              { label: 'Unidad Administrativa', value: vehiculo.unidadAdministrativa },
              { label: 'Modelo', value: vehiculo.modelo },
              {
                label: 'Responsable',
                value: vehiculo.responsable !== '—'
                  ? vehiculo.responsable
                  : vehiculo.ciResponsable
                    ? `CI ${vehiculo.ciResponsable}`
                    : '—',
              },
              { label: 'Sede', value: vehiculo.sede },
              { label: 'Año de fabricación', value: vehiculo.anioFabricacion?.toString() ?? '—' },
              { label: 'Estado', value: <StatusBadge status={estadoUso} size="sm" /> },
              {
                label: 'Valor de Adquisición',
                value: formatMoneda(vehiculo.valorAdquisicion, vehiculo.moneda),
              },
            ],
          },
          {
            title: 'Detalles del documento de Ingreso',
            fields: [
              { label: 'Forma de Adquisición', value: vehiculo.formaAdquisicion },
              {
                label: 'Valor Total de Documento',
                value: formatMoneda(vehiculo.valorAdquisicion, vehiculo.moneda),
              },
              { label: 'Fecha Adquisición', value: formatFecha(vehiculo.fechaAdquisicion) },
              { label: 'Nombre de Proveedor', value: vehiculo.proveedor || '—' },
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
                onClick={guardarCambio}
                disabled={saving || inventario.retirado}
                className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar cambio'}
              </button>
            )}
            {canTransferBien && (
              <button
                type="button"
                onClick={() => inventario.setTransferOpen(true)}
                disabled={inventario.retirado || inventario.transferLoading || inventario.retireLoading}
                className="px-5 py-2.5 border border-navy-200 text-navy-800 rounded-lg text-sm font-semibold hover:bg-navy-50 disabled:opacity-50"
              >
                Transferir a otro almacén
              </button>
            )}
            {canRetireBien && (
              <button
                type="button"
                onClick={() => inventario.setRetireOpen(true)}
                disabled={inventario.retirado || inventario.transferLoading || inventario.retireLoading}
                className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
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
        subject="del vehículo"
      />
    </>
  );
}

export default function Vehiculos() {
  const { canWriteAssets, canExportInventory } = useRolePermissions();
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
      return aggregateVehiculosMetricsFromList(data);
    },
    [apiSearch],
  );
  const almacenesQuery = useApiQuery(
    () => fetchAlmacenes({ page: 1, limit: API_MAX_LIMIT }),
    [],
    showRegistro || Boolean(codigoVehiculo),
  );
  const departamentosQuery = useApiQuery(() => fetchAllDepartamentos(), []);

  const detailQuery = useApiQuery(
    () => fetchVehiculoByCodigo(codigoVehiculo!),
    [codigoVehiculo],
    Boolean(codigoVehiculo),
  );

  const lista = listQuery.data?.data ?? [];
  const vehiculo = codigoVehiculo ? detailQuery.data : null;
  const metricas = metricsQuery.data ?? {
    total: 0,
    valorTotal: 0,
    enUso: 0,
    enObsolescencia: 0,
    obsoletos: 0,
  };

  const almacenOptions = useMemo(
    () => catalogOptions(lista.map((v) => v.almacen), 'Todos'),
    [lista],
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

  const filtered = useMemo(() => {
    const q = filtros.buscar.trim().toLowerCase();
    return lista.filter((v) => {
      if (filtros.codigo && !v.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !v.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todos' && v.almacen !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && v.condicionFisica !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && v.unidadAdministrativa !== filtros.departamento) return false;
      if (filtros.fecha && v.fechaAdquisicion !== filtros.fecha) return false;
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
  }, [lista, filtros]);

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
    return (
      <ApiState loading={detailQuery.loading} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {vehiculo && (
          <VehiculoDetail
            vehiculo={vehiculo}
            almacenes={almacenesQuery.data?.data ?? []}
            onVolver={() => {
              refreshVehiculos();
              navigate('/vehiculos');
            }}
            onSaved={refreshVehiculos}
            onInventarioAction={async (result) => {
              if (result.type === 'transfer') {
                setModuleFilter('almacen', result.almacenDestino);
              }
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
