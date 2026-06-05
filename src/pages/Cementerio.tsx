import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchBienCementerioByCodigo,
  fetchBienesCementerio,
} from '../api/services/bienes-sedes.service';
import { cambiarEstadoBien } from '../api/services/bienes.service';
import { fetchAlmacenes } from '../api/services/almacenes.service';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatFecha, formatMoneda } from '../utils/formatters';
import { estadoUsoToApi } from '../utils/registroBienMappers';
import type { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ApiState from '../components/ApiState';
import { ImportExcelModal, RegistroBienesCementerioModal } from '../components/modals';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import { FILTROS_INVENTARIO_VACIOS } from '../constants/moduleFilters';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import AssetDetailView from '../components/module/AssetDetailView';
import { useModuleUiState } from '../stores/moduleUiStore';
import type { BienMueble } from '../types/bien';
import { ESTADOS_USO } from '../types/bien';
import {
  ALMACENES_CEMENTERIO,
  DEPARTAMENTOS_CEMENTERIO,
} from '../data/bienesCatalogos';
import {
  Upload,
  ArrowLeft,
  FileText,
  Landmark,
  Package,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

const PER_PAGE = 10;

function proveedorDesdeBien(bien: BienMueble) {
  if (!bien.marca || bien.marca === 'Desconocida' || bien.marca === '—') return '—';
  return `${bien.marca} C.A.`;
}

function CementerioBienDetail({
  bien,
  onVolver,
}: {
  bien: BienMueble;
  onVolver: () => void;
}) {
  const [estadoUso, setEstadoUso] = useState(bien.estadoUso);
  const [saving, setSaving] = useState(false);

  const guardarCambio = async () => {
    setSaving(true);
    try {
      await cambiarEstadoBien(bien.id, estadoUsoToApi(estadoUso));
      toast.success('Cambio guardado', {
        description: `${bien.codigoInterno}: estado ${estadoUso}.`,
      });
    } catch (err) {
      toast.error('No se pudo guardar el cambio', {
        description: err instanceof Error ? err.message : 'Intente nuevamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AssetDetailView
      title="Bienes e Inmuebles: Cementerio"
      breadcrumb={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Cementerio', to: '/cementerio' },
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
            { label: 'Fecha de Ingreso', value: formatFecha(bien.fechaAdquisicion) },
            { label: 'Color', value: bien.color || '—' },
            { label: 'Marca', value: bien.marca || '—' },
            { label: 'Modelo', value: bien.modelo || '—' },
            { label: 'Valor de Adquisición', value: formatMoneda(bien.valorAdquisicion, bien.moneda) },
            { label: 'Código', value: bien.sinCodigo ? 'Sin código' : bien.codigoInterno },
            { label: 'Serial', value: bien.sinSerial ? 'Sin serial' : (bien.serial || '—') },
            {
              label: 'Responsable',
              value: bien.responsable !== '—'
                ? bien.responsable
                : bien.ciResponsable
                  ? `CI ${bien.ciResponsable}`
                  : '—',
            },
            { label: 'Unidad Administrativa', value: bien.unidadAdministrativa },
            {
              label: 'Estado de uso',
              value: (
                <select
                  value={estadoUso}
                  onChange={(e) => setEstadoUso(e.target.value as BienMueble['estadoUso'])}
                  className="input-field max-w-xs"
                >
                  {ESTADOS_USO.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ),
            },
            { label: 'Almacén', value: bien.ubicacion },
            { label: 'Sede', value: bien.sede },
          ],
        },
        {
          title: 'Detalles del documento de Ingreso',
          fields: [
            { label: 'Nro de Documento', value: bien.numeroDocumento || '—' },
            { label: 'Fecha Adquisición', value: formatFecha(bien.fechaAdquisicion) },
            { label: 'Forma de Adquisición', value: bien.formaAdquisicion },
            { label: 'Nombre de Proveedor', value: proveedorDesdeBien(bien) },
            { label: 'Valor Total de Documento', value: formatMoneda(bien.valorAdquisicion, bien.moneda) },
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
            onClick={guardarCambio}
            disabled={saving}
            className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambio'}
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

export default function Cementerio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exportMsg, setExportMsg] = useState('');
  const {
    page,
    filters: filtros,
    modals,
    successMsg,
    errorMsg,
    setPage,
    setFilter: setModuleFilter,
    resetFilters,
    setModal,
    setSuccess: setSuccessMsg,
    setError: setErrorMsg,
  } = useModuleUiState('cementerio', FILTROS_INVENTARIO_VACIOS);
  const itemId = id ? Number(id) : null;
  const bienesQuery = useApiQuery(() => fetchBienesCementerio({ page: 1, limit: 5000 }), []);
  const almacenesQuery = useApiQuery(() => fetchAlmacenes({ page: 1, limit: 5000 }), []);
  const detailQuery = useApiQuery(
    () => fetchBienCementerioByCodigo(itemId as number),
    [itemId],
    Boolean(itemId)
  );
  const showImport = modals.import ?? false;
  const showRegistro = modals.registro ?? false;

  const bienes = bienesQuery.data?.all ?? bienesQuery.data?.data ?? [];

  const metricas = useMemo(() => {
    const fuente = bienes;
    const total = bienesQuery.data?.meta?.total ?? fuente.length;
    return {
      total,
      enUso: fuente.filter((b) => b.estadoUso === 'En uso').length,
      enObsolescencia: fuente.filter((b) => b.estadoUso === 'En obsolescencia').length,
      obsoletos: fuente.filter((b) => b.estadoUso === 'Obsoleto').length,
    };
  }, [bienes, bienesQuery.data?.meta?.total]);

  const almacenOptions = useMemo(() => ['Todas', ...ALMACENES_CEMENTERIO], []);
  const departamentoOptions = useMemo(() => ['Todos', ...DEPARTAMENTOS_CEMENTERIO], []);

  const filteredBienes = useMemo(() => {
    const q = filtros.buscar.toLowerCase();
    return bienes.filter((b) => {
      if (filtros.codigo && !b.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !b.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todas' && b.ubicacion !== filtros.almacen) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && b.unidadAdministrativa !== filtros.departamento) return false;
      if (filtros.numeroDocumento && !b.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.estadoUso && filtros.estadoUso !== 'Todos' && b.estadoUso !== filtros.estadoUso) return false;
      if (q) {
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
  }, [bienes, filtros]);

  const totalPages = Math.max(1, Math.ceil(filteredBienes.length / PER_PAGE));
  const paginatedBienes = filteredBienes.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setModuleFilter(key, value);
  };

  const simularExportPdf = () => {
    setExportMsg('Generando PDF...');
    setTimeout(() => setExportMsg('PDF generado'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const columns: Column<BienMueble>[] = [
    {
      key: 'codigoInterno',
      label: 'Código',
      render: (b) => <span className="font-mono font-bold text-navy-900">{b.codigoInterno}</span>,
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (b) => <span className="max-w-[220px] truncate block">{b.descripcion}</span>,
    },
    { key: 'marca', label: 'Marca', render: (b) => <span>{b.marca || '—'}</span> },
    { key: 'modelo', label: 'Modelo', render: (b) => <span>{b.modelo || '—'}</span> },
    { key: 'color', label: 'Color', render: (b) => <span>{b.color || '—'}</span> },
    { key: 'serial', label: 'Serial', render: (b) => <span className="font-mono text-sm">{b.serial || '—'}</span> },
    { key: 'sede', label: 'Sede' },
    { key: 'ubicacion', label: 'Almacén' },
    { key: 'estadoUso', label: 'Estado de uso', render: (b) => <StatusBadge status={b.estadoUso} size="sm" /> },
  ];

  if (id) {
    return (
      <ApiState loading={detailQuery.loading && !detailQuery.data} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {detailQuery.data && <CementerioBienDetail bien={detailQuery.data} onVolver={() => navigate('/cementerio')} />}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Bienes e Inmuebles: Cementerio"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Cementerio' }]}
        onCreate={() => setModal('registro', true)}
        createLabel="Crear Registro"
        extraActions={
          <>
            {successMsg && (
              <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>
            )}
            {errorMsg && <span className="text-sm text-red-600 font-medium self-center">{errorMsg}</span>}
            <button
              type="button"
              onClick={() => setModal('import', true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Upload size={16} /> Importar Excel
            </button>
          </>
        }
      />

      <section
        aria-label="Métricas del cementerio"
        className="rounded-xl border-2 border-navy-100 bg-linear-to-br from-slate-50 via-white to-slate-50 p-4 sm:p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base font-bold text-navy-900">Métricas</h2>
          {!bienesQuery.loading && (
            <p className="text-xs text-gray-500">
              {filteredBienes.length === metricas.total
                ? `${metricas.total} bienes en sede Cementerio`
                : `${filteredBienes.length} de ${metricas.total} bienes (filtros activos)`}
            </p>
          )}
        </div>

        {bienesQuery.loading && !bienesQuery.data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[92px] rounded-xl border border-gray-200 bg-white animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <CementerioMetricCard
                label="Total Bienes"
                value={metricas.total}
                icon={<Landmark size={22} className="text-blue-600" />}
                iconClassName="bg-blue-100"
                valueClassName="text-blue-700"
              />
              <CementerioMetricCard
                label="Bienes en uso"
                value={metricas.enUso}
                icon={<Package size={22} className="text-green-600" />}
                iconClassName="bg-green-100"
                valueClassName="text-green-700"
              />
              <CementerioMetricCard
                label="Bienes en obsolescencia"
                value={metricas.enObsolescencia}
                icon={<AlertTriangle size={22} className="text-amber-500" />}
                iconClassName="bg-amber-100"
                borderClassName="border-amber-200"
                valueClassName="text-amber-700"
              />
              <CementerioMetricCard
                label="Bienes obsoletos"
                value={metricas.obsoletos}
                icon={<AlertCircle size={22} className="text-red-500" />}
                iconClassName="bg-red-100"
                borderClassName="border-red-200"
                valueClassName="text-red-700"
              />
            </div>
            {metricas.total === 0 && (
              <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No hay bienes asociados a la sede Cementerio en el backend. Las métricas mostrarán valores cuando existan registros.
              </p>
            )}
          </>
        )}
      </section>

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
            key: 'departamento',
            label: 'Unidad Administrativa',
            type: 'select',
            value: filtros.departamento,
            onChange: (v) => setFiltro('departamento', v),
            options: departamentoOptions,
          },
          {
            key: 'documento',
            label: 'Número de documento',
            type: 'text',
            value: filtros.numeroDocumento,
            onChange: (v) => setFiltro('numeroDocumento', v),
          },
          {
            key: 'estadoUso',
            label: 'Estado de uso',
            type: 'select',
            value: filtros.estadoUso,
            onChange: (v) => setFiltro('estadoUso', v),
            options: ['Todos', ...ESTADOS_USO],
          },
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
        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          {exportMsg && <span className="text-sm text-green-600 font-medium">{exportMsg}</span>}
          <button
            type="button"
            onClick={simularExportPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <FileText size={14} />
            PDF
          </button>
        </div>
      </ModuleFilterBar>

      <ApiState
        loading={bienesQuery.loading && !bienesQuery.data}
        error={bienesQuery.error}
        onRetry={bienesQuery.refetch}
        empty={!bienesQuery.loading && filteredBienes.length === 0}
        emptyMessage="No hay bienes asociados a la sede Cementerio en el backend."
      >
        <ModuleDataTable
          data={paginatedBienes}
          columns={columns}
          loading={bienesQuery.loading && Boolean(bienesQuery.data)}
          onDetails={(b) => navigate(`/cementerio/${b.id}`)}
          emptyMessage="No hay registros del cementerio."
        />
        <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </ApiState>

      <RegistroBienesCementerioModal
        open={showRegistro}
        onClose={() => setModal('registro', false)}
        almacenes={almacenesQuery.data?.data ?? []}
        onSuccess={(message) => {
          bienesQuery.refetch();
          setSuccessMsg(message);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
        onError={setErrorMsg}
      />

      <ImportExcelModal
        open={showImport}
        onClose={() => setModal('import', false)}
        tiposDisponibles={['Bienes Cementerio']}
      />
    </div>
  );
}

function CementerioMetricCard({
  label,
  value,
  icon,
  iconClassName,
  borderClassName = 'border-gray-200',
  valueClassName = 'text-navy-900',
}: {
  label: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
  borderClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 flex items-center gap-4 shadow-sm ${borderClassName}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className={`text-3xl font-bold tabular-nums leading-tight ${valueClassName}`}>
          {value.toLocaleString('es-VE')}
        </p>
      </div>
    </div>
  );
}
