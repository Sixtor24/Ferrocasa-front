import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchBienes, fetchBienesEstadisticas, fetchBienByCodigo } from '../api/services/bienes.service';
import { useApiQuery } from '../hooks/useApiQuery';
import ApiState from '../components/ApiState';
import AssetDetailView from '../components/module/AssetDetailView';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import {
  SEDES,
  CONDICIONES_FISICAS,
  ESTADOS_USO,
  UNIDADES_ADMINISTRATIVAS,
} from '../types/bien';
import { formatFecha, formatMoneda } from '../utils/formatters';
import type { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { ImportExcelModal, NuevoBienMuebleModal, type NuevoBienMueblePayload } from '../components/modals';
import type { BienMueble } from '../types/bien';
import ModulePageHeader from '../components/module/ModulePageHeader';
import {
  Package,
  AlertTriangle,
  Upload,
  BarChart3,
  AlertCircle,
  ArrowLeft,
  FileText,
} from 'lucide-react';

const PER_PAGE = 10;

function proveedorDesdeBien(bien: BienMueble) {
  if (!bien.marca || bien.marca === 'Desconocida') return '—';
  return `${bien.marca} C.A.`;
}

function AlmacenBienDetail({ bien, onVolver }: { bien: BienMueble; onVolver: () => void }) {
  const [estadoUso, setEstadoUso] = useState(bien.estadoUso);
  const [condicionFisica, setCondicionFisica] = useState(bien.condicionFisica);

  return (
    <AssetDetailView
      title="Bienes e Inmuebles: Edificio Administrativo"
      breadcrumb={[
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Bienes Administrativos', to: '/almacen' },
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
            { label: 'Fecha de Ingreso', value: formatFecha(bien.fechaAdquisicion) || '—' },
            { label: 'Serial', value: bien.sinSerial ? 'Sin serial' : (bien.serial || '—') },
            {
              label: 'Condición Física',
              value: (
                <select
                  value={condicionFisica}
                  onChange={(e) => setCondicionFisica(e.target.value as BienMueble['condicionFisica'])}
                  className="input-field max-w-xs"
                >
                  {CONDICIONES_FISICAS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ),
            },
            { label: 'Color', value: bien.color || '—' },
            { label: 'Responsable', value: bien.unidadAdministrativa },
            { label: 'Almacén', value: bien.ubicacion },
            { label: 'Marca', value: bien.marca },
            { label: 'Unidad Administrativa', value: bien.unidadAdministrativa },
            { label: 'Departamento', value: bien.unidadAdministrativa },
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
            { label: 'Nombre de Proveedor', value: proveedorDesdeBien(bien) },
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

export default function Almacen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [exportMsg, setExportMsg] = useState('');
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

  const bienesQuery = useApiQuery(
    () => fetchBienes({ limit: 500, search: filtros.buscar || undefined }),
    [filtros.buscar],
  );
  const statsQuery = useApiQuery(() => fetchBienesEstadisticas(), []);
  const detailQuery = useApiQuery(
    () => fetchBienByCodigo(Number(id)),
    [id],
    Boolean(id),
  );
  const lista = bienesQuery.data?.data ?? [];
  const [localExtras, setLocalExtras] = useState<BienMueble[]>([]);
  const displayList = [...localExtras, ...lista];
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const bienesStats = useMemo(() => ({
    total: statsQuery.data?.total ?? displayList.length,
    enUso: displayList.filter((b) => b.estadoUso === 'En uso').length,
    regulares: displayList.filter((b) => b.condicionFisica === 'Regular').length,
    danados: displayList.filter((b) =>
      ['Dañado', 'Averiado', 'Inservible'].includes(b.condicionFisica)
    ).length,
  }), [displayList, statsQuery.data?.total]);

  const almacenOptions = useMemo(() => {
    const names = [...new Set(displayList.map((b) => b.ubicacion).filter(Boolean))].sort();
    return ['Todas', ...names];
  }, [displayList]);

  const filtered = useMemo(() => {
    return displayList.filter((b) => {
      if (filtros.codigo && !b.codigoInterno.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.descripcion && !b.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())) return false;
      if (filtros.almacen && filtros.almacen !== 'Todas' && b.ubicacion !== filtros.almacen) return false;
      if (filtros.condicionFisica && filtros.condicionFisica !== 'Todas' && b.condicionFisica !== filtros.condicionFisica) return false;
      if (filtros.departamento && filtros.departamento !== 'Todos' && b.unidadAdministrativa !== filtros.departamento) return false;
      if (filtros.numeroDocumento && !b.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.estadoUso && filtros.estadoUso !== 'Todos' && b.estadoUso !== filtros.estadoUso) return false;
      return true;
    });
  }, [displayList, filtros]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const simularExportPdf = () => {
    setExportMsg('Generando PDF...');
    setTimeout(() => setExportMsg('PDF generado'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handleNuevoBien = (payload: NuevoBienMueblePayload) => {
    const nuevo: BienMueble = {
      id: displayList.length + 1,
      ...payload,
      fuenteRegistro: 'Manual',
      estatusCarga: 'Completo',
      creadoEn: new Date().toISOString().split('T')[0],
      actualizadoEn: new Date().toISOString().split('T')[0],
    };
    setLocalExtras([nuevo, ...localExtras]);
    setShowModal(false);
    setSuccessMsg('Bien mueble registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
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
    const bienId = Number(id);
    const bien =
      detailQuery.data ??
      displayList.find((b) => b.id === bienId) ??
      null;

    return (
      <ApiState loading={detailQuery.loading && !bien} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {bien && <AlmacenBienDetail bien={bien} onVolver={() => navigate('/almacen')} />}
      </ApiState>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Bienes e Inmuebles Administrativos"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Bienes Administrativos' }]}
        onCreate={() => setShowModal(true)}
        extraActions={
          <>
            {successMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>}
            <button type="button" onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Upload size={16} /> Importar Excel
            </button>
          </>
        }
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
            <p className="text-sm text-gray-500">Bienes Regulares</p>
            <p className="text-2xl font-bold text-amber-700">{(bienesStats.regulares ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center"><AlertCircle size={22} className="text-red-500" /></div>
          <div>
            <p className="text-sm text-gray-500">Bienes dañados</p>
            <p className="text-2xl font-bold text-red-700">{(bienesStats.danados ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <ModuleFilterBar
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
            label: 'Departamento',
            type: 'select',
            value: filtros.departamento,
            onChange: (v) => setFiltro('departamento', v),
            options: ['Todos', ...UNIDADES_ADMINISTRATIVAS],
          },
          {
            key: 'documento',
            label: 'Número de documento',
            type: 'text',
            value: filtros.numeroDocumento,
            onChange: (v) => setFiltro('numeroDocumento', v),
          },
          {
            key: 'estado',
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
        loading={bienesQuery.loading}
        error={bienesQuery.error}
        onRetry={bienesQuery.refetch}
        empty={!bienesQuery.loading && filtered.length === 0}
        emptyMessage="No hay bienes registrados. Los registros nuevos requieren almacén y categoría en la base de datos."
      >
        <ModuleDataTable
          data={paginated}
          columns={columns}
          onDetails={(b) => navigate(`/almacen/${b.id}`)}
        />
        <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </ApiState>

      <NuevoBienMuebleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleNuevoBien}
      />

      <ImportExcelModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tiposDisponibles={['Bienes Muebles SUDEBIP', 'Inventario por Área']}
      />
    </div>
  );
}
