import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchCementerioParcelaById,
  fetchCementerioParcelas,
  fetchCementerioParcelasEstadisticas,
} from '../api/services/cementerio.service';
import { useApiQuery } from '../hooks/useApiQuery';
import { formatFecha } from '../utils/formatters';
import type { Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ApiState from '../components/ApiState';
import { ImportExcelModal } from '../components/modals';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleMetricCard from '../components/module/ModuleMetricCard';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import AssetDetailView from '../components/module/AssetDetailView';
import type { Terreno } from '../types/terreno';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowLeft,
  FileText,
  Map,
} from 'lucide-react';

const PER_PAGE = 10;

function getEstadoParcela(parcela: Terreno) {
  if (parcela.areaDesincorporada > 0) return 'Desincorporado';
  if (parcela.areaComprometida > 0) return 'Comprometido';
  return 'Disponible';
}

export default function Cementerio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [exportMsg, setExportMsg] = useState('');
  const itemId = id ? Number(id) : null;
  const parcelasQuery = useApiQuery(() => fetchCementerioParcelas({ page, limit: PER_PAGE }), [page]);
  const statsQuery = useApiQuery(() => fetchCementerioParcelasEstadisticas(), []);
  const detailQuery = useApiQuery(
    () => fetchCementerioParcelaById(itemId as number),
    [itemId],
    Boolean(itemId)
  );
  const [filtros, setFiltros] = useState({
    codigo: '',
    nombre: '',
    zona: '',
    estado: '',
    numeroDocumento: '',
    buscar: '',
  });
  const [showImport, setShowImport] = useState(false);

  const parcelas = parcelasQuery.data?.terrenos ?? [];
  const pagination = parcelasQuery.data?.meta;

  const parcelasStats = useMemo(() => ({
    total: statsQuery.data?.total ?? pagination?.total ?? 0,
    disponibles: statsQuery.data?.disponibles ?? parcelas.filter((p) => getEstadoParcela(p) === 'Disponible').length,
    comprometidas: statsQuery.data?.comprometidas ?? parcelas.filter((p) => getEstadoParcela(p) === 'Comprometido').length,
    desincorporadas: statsQuery.data?.desincorporadas ?? parcelas.filter((p) => getEstadoParcela(p) === 'Desincorporado').length,
  }), [pagination?.total, parcelas, statsQuery.data]);

  const zonaOptions = useMemo(() => {
    const names = [...new Set(parcelas.map((p) => p.zona).filter((zona) => zona && zona !== '—'))].sort();
    return ['Todas', ...names];
  }, [parcelas]);

  const filteredParcelas = useMemo(() => {
    const q = filtros.buscar.toLowerCase();
    return parcelas.filter((p) => {
      const estado = getEstadoParcela(p);
      if (filtros.codigo && !p.codigo.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (filtros.nombre && !p.identificacion.toLowerCase().includes(filtros.nombre.toLowerCase())) return false;
      if (filtros.zona && filtros.zona !== 'Todas' && p.zona !== filtros.zona) return false;
      if (filtros.numeroDocumento && !p.numeroDocumento.includes(filtros.numeroDocumento)) return false;
      if (filtros.estado && filtros.estado !== 'Todos' && estado !== filtros.estado) return false;
      if (q) {
        const hay =
          p.codigo.toLowerCase().includes(q) ||
          p.identificacion.toLowerCase().includes(q) ||
          p.ubicacion.toLowerCase().includes(q) ||
          p.responsable.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });
  }, [parcelas, filtros]);

  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(filteredParcelas.length / PER_PAGE));

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const simularExportPdf = () => {
    setExportMsg('Generando PDF...');
    setTimeout(() => setExportMsg('PDF generado'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const parcelaColumns: Column<Terreno>[] = [
    {
      key: 'codigo',
      label: 'Código',
      render: (p) => <span className="font-mono font-bold text-navy-900">{p.codigo}</span>,
    },
    {
      key: 'identificacion',
      label: 'Parcela',
      render: (p) => <span className="max-w-[220px] truncate block">{p.identificacion}</span>,
    },
    { key: 'zona', label: 'Zona' },
    {
      key: 'ubicacion',
      label: 'Ubicación',
      render: (p) => <span className="max-w-[260px] truncate block">{p.ubicacion}</span>,
    },
    { key: 'areaTotalM2', label: 'Área total', render: (p) => <span>{p.areaTotalM2.toLocaleString()} m²</span> },
    { key: 'areaDisponible', label: 'Disponible', render: (p) => <span>{p.areaDisponible.toLocaleString()} m²</span> },
    { key: 'zonificacion', label: 'Zonificación' },
    {
      key: 'observacion',
      label: 'Estado',
      render: (p) => <StatusBadge status={getEstadoParcela(p)} size="sm" />,
    },
  ];

  if (id) {
    const parcela = detailQuery.data?.terreno;
    if (detailQuery.loading) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-500">Cargando parcela...</p>
        </div>
      );
    }
    if (!parcela) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-500 mb-4">Parcela no encontrada.</p>
          <button type="button" onClick={() => navigate('/cementerio')} className="text-navy-700 font-medium">
            Volver al listado
          </button>
        </div>
      );
    }

    return (
      <AssetDetailView
        title="Parcela del Cementerio"
        breadcrumb={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Cementerio', to: '/cementerio' },
          { label: parcela.codigo },
        ]}
        categoryFields={[
          { label: 'Estado', value: getEstadoParcela(parcela) },
          { label: 'Zona', value: parcela.zona },
          { label: 'Zonificación', value: parcela.zonificacion },
        ]}
        sections={[
          {
            title: 'Detalles',
            fields: [
              { label: 'Código', value: parcela.codigo },
              { label: 'Identificación', value: parcela.identificacion },
              { label: 'Nombre', value: parcela.nombre },
              { label: 'Ubicación', value: parcela.ubicacion },
              { label: 'Ubicación adicional', value: parcela.ubicacionAdicional },
              { label: 'Responsable', value: parcela.responsable },
              { label: 'Levantamiento topográfico', value: parcela.levantamientoTopografico },
              { label: 'Acreditación ambiental', value: parcela.acreditacionTecnicaAmbiental },
              { label: 'Observaciones', value: parcela.observacion || '—' },
            ],
          },
          {
            title: 'Documento y áreas',
            fields: [
              { label: 'Nro de documento', value: parcela.numeroDocumento },
              { label: 'Nro de propiedad', value: parcela.nroPropiedad },
              { label: 'Fecha adquisición', value: formatFecha(parcela.fechaAdquisicion) },
              { label: 'Forma de adquisición', value: parcela.formaAdquisicion },
              { label: 'Área según documento', value: `${parcela.areaDocumento.toLocaleString()} m²` },
              { label: 'Área disponible', value: `${parcela.areaDisponible.toLocaleString()} m²` },
              { label: 'Área comprometida', value: `${parcela.areaComprometida.toLocaleString()} m²` },
              { label: 'Área desincorporada', value: `${parcela.areaDesincorporada.toLocaleString()} m²` },
            ],
          },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/cementerio')}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
            <button
              type="button"
              onClick={() => navigate('/terrenos')}
              className="px-5 py-2.5 border border-navy-200 text-navy-800 rounded-lg text-sm font-semibold hover:bg-navy-50"
            >
              Ver en terrenos
            </button>
          </>
        }
      />
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px]">
      <ModulePageHeader
        title="Parcelas del Cementerio"
        breadcrumb={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Cementerio' }]}
        extraActions={
          <>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Upload size={16} /> Importar Excel
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleMetricCard
          label="Total Parcelas"
          value={(parcelasStats.total ?? 0).toLocaleString()}
          icon={<Map size={22} className="text-navy-600" />}
          iconWrapClassName="bg-navy-100"
        />
        <ModuleMetricCard
          label="Parcelas disponibles"
          value={(parcelasStats.disponibles ?? 0).toLocaleString()}
          icon={<CheckCircle2 size={22} className="text-green-600" />}
          iconWrapClassName="bg-green-100"
          valueClassName="text-green-700"
        />
        <ModuleMetricCard
          label="Parcelas comprometidas"
          value={(parcelasStats.comprometidas ?? 0).toLocaleString()}
          icon={<AlertTriangle size={22} className="text-amber-500" />}
          iconWrapClassName="bg-amber-100"
          borderClassName="border-amber-200"
          valueClassName="text-amber-700"
        />
        <ModuleMetricCard
          label="Parcelas desincorporadas"
          value={(parcelasStats.desincorporadas ?? 0).toLocaleString()}
          icon={<AlertCircle size={22} className="text-red-500" />}
          iconWrapClassName="bg-red-100"
          borderClassName="border-red-200"
          valueClassName="text-red-700"
        />
      </div>

      <ModuleFilterBar
        fields={[
          { key: 'codigo', label: 'Código', type: 'text', value: filtros.codigo, onChange: (v) => setFiltro('codigo', v) },
          { key: 'nombre', label: 'Parcela', type: 'text', value: filtros.nombre, onChange: (v) => setFiltro('nombre', v) },
          {
            key: 'zona',
            label: 'Zona',
            type: 'select',
            value: filtros.zona,
            onChange: (v) => setFiltro('zona', v),
            options: zonaOptions,
          },
          {
            key: 'estado',
            label: 'Estado',
            type: 'select',
            value: filtros.estado,
            onChange: (v) => setFiltro('estado', v),
            options: ['Todos', 'Disponible', 'Comprometido', 'Desincorporado'],
          },
          {
            key: 'documento',
            label: 'Número de documento',
            type: 'text',
            value: filtros.numeroDocumento,
            onChange: (v) => setFiltro('numeroDocumento', v),
          },
          {
            key: 'buscar',
            label: 'Buscar',
            type: 'search',
            value: filtros.buscar,
            onChange: (v) => setFiltro('buscar', v),
            placeholder: 'Buscar por código, parcela, ubicación...',
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
        loading={parcelasQuery.loading && !parcelasQuery.data}
        error={parcelasQuery.error}
        onRetry={parcelasQuery.refetch}
        empty={!parcelasQuery.loading && filteredParcelas.length === 0}
        emptyMessage="No hay parcelas de cementerio registradas en el backend."
      >
        <ModuleDataTable
          data={filteredParcelas}
          columns={parcelaColumns}
          loading={parcelasQuery.loading && Boolean(parcelasQuery.data)}
          onDetails={(p) => navigate(`/cementerio/${p.id}`)}
          emptyMessage="No hay parcelas del cementerio."
        />
        <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </ApiState>

      <ImportExcelModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tiposDisponibles={['Parcelas Cementerio']}
      />
    </div>
  );
}
