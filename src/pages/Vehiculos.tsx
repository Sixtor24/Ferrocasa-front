import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchVehiculos, fetchVehiculoById } from '../api/services/vehiculos.service';
import { useApiQuery } from '../hooks/useApiQuery';
import {
  CONDICIONES_VEHICULO,
  ESTADOS_USO_VEHICULO,
  ALMACENES_VEHICULO,
  DEPARTAMENTOS_VEHICULO,
} from '../types/vehiculo';
import type { Vehiculo } from '../types/vehiculo';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import AssetDetailView from '../components/module/AssetDetailView';
import ApiState from '../components/ApiState';
import StatusBadge from '../components/StatusBadge';
import { formatFecha, formatMoneda } from '../utils/formatters';
import type { Column } from '../components/DataTable';
import { ArrowLeft } from 'lucide-react';

const PER_PAGE = 5;

function formaAdquisicionVehiculo(v: Vehiculo) {
  if (v.numeroDocumento.startsWith('TR-')) return 'Transferencia';
  if (v.numeroDocumento.startsWith('OC-')) return 'Compra';
  return 'Compra';
}

function proveedorVehiculo(v: Vehiculo) {
  if (!v.numeroDocumento || v.numeroDocumento === '—') return '—';
  return '—';
}

function VehiculoDetail({ vehiculo, onVolver }: { vehiculo: Vehiculo; onVolver: () => void }) {
  const [estadoUso, setEstadoUso] = useState(vehiculo.estadoUso);
  const [condicionFisica, setCondicionFisica] = useState(vehiculo.condicionFisica);

  const placaDisplay = vehiculo.sinPlaca ? 'Sin placa' : vehiculo.placa;
  const serialMotorDisplay = vehiculo.sinSerialMotor ? 'Sin serial' : vehiculo.serialMotor;
  const serialCarroceriaDisplay = vehiculo.sinSerialCarroceria
    ? 'Sin serial'
    : (vehiculo.serialCarroceria || '—');

  return (
    <AssetDetailView
      title="Vehículos y Maquinaria"
      breadcrumb={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Vehículos', to: '/vehiculos' },
        { label: vehiculo.codigoInterno },
      ]}
      categoryFields={[
        { label: 'Categoría', value: vehiculo.categoriaGeneral },
        { label: 'Sub Categoría', value: vehiculo.subcategoria },
        { label: 'Categoría Específica', value: vehiculo.subcategoria },
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
                <select
                  value={estadoUso}
                  onChange={(e) => setEstadoUso(e.target.value as Vehiculo['estadoUso'])}
                  className="input-field max-w-xs"
                >
                  {ESTADOS_USO_VEHICULO.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ),
            },
            { label: 'Fecha de Ingreso', value: formatFecha(vehiculo.fechaAdquisicion) },
            { label: 'Placa', value: placaDisplay },
            {
              label: 'Condición Física',
              value: (
                <select
                  value={condicionFisica}
                  onChange={(e) => setCondicionFisica(e.target.value as Vehiculo['condicionFisica'])}
                  className="input-field max-w-xs"
                >
                  {CONDICIONES_VEHICULO.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ),
            },
            { label: 'Color', value: vehiculo.color },
            { label: 'Serial del motor', value: serialMotorDisplay },
            { label: 'Almacén', value: vehiculo.almacen },
            { label: 'Marca', value: vehiculo.marca },
            { label: 'Serial de carrocería', value: serialCarroceriaDisplay },
            { label: 'Departamento', value: vehiculo.departamento },
            { label: 'Modelo', value: vehiculo.modelo },
            { label: 'Responsable', value: vehiculo.departamento },
            { label: 'Sede', value: vehiculo.sede },
            { label: 'Año de fabricación', value: vehiculo.anioFabricacion?.toString() ?? '—' },
            { label: 'Unidad Administrativa', value: vehiculo.departamento },
            { label: 'Estado', value: <StatusBadge status={estadoUso} size="sm" /> },
            {
              label: 'Valor de Adquisición',
              value: vehiculo.valorAdquisicion ? formatMoneda(vehiculo.valorAdquisicion, 'USD') : '—',
            },
          ],
        },
        {
          title: 'Detalles del documento de Ingreso',
          fields: [
            { label: 'Nro de Documento', value: vehiculo.numeroDocumento || '—' },
            { label: 'Forma de Adquisición', value: formaAdquisicionVehiculo(vehiculo) },
            {
              label: 'Valor Total de Documento',
              value: vehiculo.valorAdquisicion ? formatMoneda(vehiculo.valorAdquisicion, 'USD') : '—',
            },
            { label: 'Fecha Adquisición', value: formatFecha(vehiculo.fechaAdquisicion) },
            { label: 'Nombre de Proveedor', value: proveedorVehiculo(vehiculo) },
          ],
        },
      ]}
      actions={
        <>
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </button>
          <button
            type="button"
            className="px-5 py-2.5 border border-navy-200 text-navy-800 rounded-lg text-sm font-semibold hover:bg-navy-50"
          >
            Transferir a otro almacén
          </button>
          <button
            type="button"
            className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50"
          >
            Retirar de Inventario
          </button>
        </>
      }
    />
  );
}

export default function Vehiculos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    codigo: '',
    descripcion: '',
    almacen: '',
    condicionFisica: '',
    departamento: '',
    numeroDocumento: '',
    estadoUso: '',
    buscar: '',
  });

  const listQuery = useApiQuery(
    () => fetchVehiculos({ page: 1, limit: 500, search: filtros.buscar || undefined }),
    [filtros.buscar],
  );

  const detailQuery = useApiQuery(
    () => fetchVehiculoById(Number(id)),
    [id],
    Boolean(id),
  );

  const vehiculos = listQuery.data?.data ?? [];
  const vehiculo = id ? detailQuery.data : null;

  const filtered = useMemo(() => {
    return vehiculos.filter((v) => {
      if (filtros.codigo && !v.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !v.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todos' && v.almacen !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && v.condicionFisica !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && v.departamento !== filtros.departamento) return false;
      if (filtros.numeroDocumento && !v.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.estadoUso && filtros.estadoUso !== 'Todos' && v.estadoUso !== filtros.estadoUso) return false;
      return true;
    });
  }, [vehiculos, filtros]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
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

  if (id) {
    return (
      <ApiState loading={detailQuery.loading} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {vehiculo && <VehiculoDetail vehiculo={vehiculo} onVolver={() => navigate('/vehiculos')} />}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Vehículos y Maquinaria"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Vehículos' }]}
        onCreate={() => {}}
      />

      <ModuleFilterBar
        fields={[
          { key: 'codigo', label: 'Código', type: 'text', value: filtros.codigo, onChange: (v) => setFiltro('codigo', v) },
          { key: 'descripcion', label: 'Descripción', type: 'text', value: filtros.descripcion, onChange: (v) => setFiltro('descripcion', v) },
          { key: 'almacen', label: 'Almacén', type: 'select', value: filtros.almacen, onChange: (v) => setFiltro('almacen', v), options: ['Todos', ...ALMACENES_VEHICULO] },
          { key: 'condicion', label: 'Condición Física', type: 'select', value: filtros.condicionFisica, onChange: (v) => setFiltro('condicionFisica', v), options: ['Todas', ...CONDICIONES_VEHICULO] },
          { key: 'departamento', label: 'Departamento', type: 'select', value: filtros.departamento, onChange: (v) => setFiltro('departamento', v), options: ['Todos', ...DEPARTAMENTOS_VEHICULO] },
          { key: 'documento', label: 'Número de documento', type: 'text', value: filtros.numeroDocumento, onChange: (v) => setFiltro('numeroDocumento', v) },
          { key: 'estado', label: 'Estado de uso', type: 'select', value: filtros.estadoUso, onChange: (v) => setFiltro('estadoUso', v), options: ['Todos', ...ESTADOS_USO_VEHICULO] },
          { key: 'buscar', label: 'Buscar', type: 'search', value: filtros.buscar, onChange: (v) => setFiltro('buscar', v), placeholder: 'Buscar...', className: 'lg:col-span-1' },
        ]}
      />

      <ApiState
        loading={listQuery.loading}
        error={listQuery.error}
        onRetry={listQuery.refetch}
        empty={!listQuery.loading && filtered.length === 0}
        emptyMessage="No hay vehículos registrados en el inventario."
      >
        <ModuleDataTable
          data={paginated}
          columns={columns}
          onDetails={(v) => navigate(`/vehiculos/${v.id}`)}
        />

        <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </ApiState>
    </div>
  );
}
