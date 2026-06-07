import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { fetchAlmacenes } from '../api/services/almacenes.service';
import { fetchBienesEstadisticas } from '../api/services/bienes.service';
import { API_MAX_LIMIT } from '../api/pagination';
import { parseBienesEstadisticas } from '../utils/bienesStats';
import { fetchApiBienByCodigo, updateBien } from '../api/services/bienes.service';
import {
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
import {
  CONDICIONES_FISICAS,
  ESTADOS_USO,
} from '../types/bien';
import {
  ALMACENES_BIENES_ADMINISTRATIVOS,
  DEPARTAMENTOS_BIENES_ADMINISTRATIVOS,
} from '../data/bienesCatalogos';
import { formatFecha, formatMoneda } from '../utils/formatters';
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
import {
  Package,
  AlertTriangle,
  BarChart3,
  AlertCircle,
  ArrowLeft,
  FileText,
} from 'lucide-react';

const PER_PAGE = 10;

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
                  disabled={inventario.retirado}
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
                  disabled={inventario.retirado}
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
            onClick={() => inventario.setTransferOpen(true)}
            disabled={inventario.retirado || inventario.transferLoading || inventario.retireLoading}
            className="px-5 py-2.5 border border-navy-200 text-navy-800 rounded-lg text-sm font-semibold hover:bg-navy-50 disabled:opacity-50"
          >
            Transferir a otro almacén
          </button>
          <button
            type="button"
            onClick={() => inventario.setRetireOpen(true)}
            disabled={inventario.retirado || inventario.transferLoading || inventario.retireLoading}
            className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
          >
            Retirar de Inventario
          </button>
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
  const { id } = useParams();
  const navigate = useNavigate();
  const [exportMsg, setExportMsg] = useState('');
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

  const apiSearch = useMemo(() => filtros.buscar.trim() || undefined, [filtros.buscar]);

  const bienesQuery = useApiQuery(
    () => fetchBienesAdministrativos({ page, limit: PER_PAGE, search: apiSearch }),
    [page, apiSearch],
  );
  const statsQuery = useApiQuery(() => fetchBienesEstadisticas(), []);
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
  const bienesStats = useMemo(
    () => parseBienesEstadisticas(statsQuery.data),
    [statsQuery.data],
  );
  const totalPages = bienesQuery.data?.meta.totalPages ?? 1;

  const almacenOptions = useMemo(() => ['Todas', ...ALMACENES_BIENES_ADMINISTRATIVOS], []);

  const filtered = useMemo(() => {
    return lista.filter((b) => {
      if (filtros.codigo && !b.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !b.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todas' && b.ubicacion !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && b.condicionFisica !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && b.unidadAdministrativa !== filtros.departamento) return false;
      if (filtros.numeroDocumento && !b.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.fecha && b.fechaAdquisicion !== filtros.fecha) return false;
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
  }, [lista, filtros]);

  const paginated = filtered;

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setModuleFilter(key, value);
    setPage(1);
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
      render: (b) => <span className="max-w-[200px] truncate block">{b.descripcion}</span>,
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
              void bienesQuery.refetch();
              void statsQuery.refetch();
              navigate('/almacen');
            }}
            onSaved={async () => {
              await Promise.all([bienesQuery.refetch(), detailQuery.refetch(), statsQuery.refetch()]);
            }}
            onInventarioAction={async (result) => {
              if (result.type === 'transfer') {
                void bienesQuery.refetch();
                void statsQuery.refetch();
                setModuleFilter('almacen', result.almacenDestino);
                try {
                  await fetchBienAdministrativoByCodigo(id);
                  await detailQuery.refetch();
                } catch {
                  navigate('/almacen');
                }
                return;
              }
              void bienesQuery.refetch();
              await detailQuery.refetch();
            }}
          />
        )}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Bienes e Inmuebles Administrativos"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Bienes en Edificio Administrativo' }]}
        formatModule="almacen"
        onCreate={() => setModal('registro', true)}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center"><Package size={22} className="text-navy-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Bienes</p>
            <p className="text-2xl font-bold text-navy-900">{(bienesStats.total ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center"><BarChart3 size={22} className="text-green-600" /></div>
          <div>
            <p className="text-sm text-gray-500">Bienes en uso</p>
            <p className="text-2xl font-bold text-green-700">{(bienesStats.enUso ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-500" /></div>
          <div>
            <p className="text-sm text-gray-500">Bienes en obsolescencia</p>
            <p className="text-2xl font-bold text-amber-700">{(bienesStats.enObsolescencia ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center"><AlertCircle size={22} className="text-red-500" /></div>
          <div>
            <p className="text-sm text-gray-500">Bienes Obsoletos</p>
            <p className="text-2xl font-bold text-red-700">{(bienesStats.obsoletos ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

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
        empty={!bienesQuery.loading && filtered.length === 0}
        emptyMessage="No hay bienes registrados. Los registros nuevos requieren almacén y categoría en la base de datos."
      >
        <ModuleDataTable
          data={paginated}
          columns={columns}
          loading={bienesQuery.loading && Boolean(bienesQuery.data)}
          onDetails={(b) => navigate(`/almacen/${encodeURIComponent(b.codigoInterno)}`)}
        />
        <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </ApiState>

      <RegistroBienesAdministrativosModal
        open={showModal}
        onClose={() => setModal('registro', false)}
        almacenes={almacenesQuery.data?.data ?? []}
        onSuccess={() => {
          bienesQuery.refetch();
          statsQuery.refetch();
        }}
        onError={() => {}}
      />

    </div>
  );
}
