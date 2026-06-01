import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchParcelas, fetchParcelaById, fetchParcelasEstadisticas } from '../api/services/parcelas.service';
import { useApiQuery } from '../hooks/useApiQuery';
import ModuleMetricCard, { formatAreaM2 } from '../components/module/ModuleMetricCard';
import { ESTADOS_TRAMITE } from '../types/terreno';
import type { ProtocolizacionTerreno, Terreno } from '../types/terreno';
import ModulePageHeader from '../components/module/ModulePageHeader';
import ModuleFilterBar from '../components/module/ModuleFilterBar';
import ModuleDataTable from '../components/module/ModuleDataTable';
import ModulePagination from '../components/module/ModulePagination';
import AssetDetailView from '../components/module/AssetDetailView';
import ApiState from '../components/ApiState';
import { formatFecha, formatMoneda } from '../utils/formatters';
import type { Column } from '../components/DataTable';
import { ArrowLeft, Map, MapPin, Layers, MinusCircle } from 'lucide-react';

const PER_PAGE = 5;
const ESTADOS_PARCELA = ['disponible', 'comprometida', 'desincorporada'] as const;

function formatAreaM2Detail(value: number) {
  return `${value.toLocaleString('es-VE')} m²`;
}

function TerrenoParcelaDetail({
  terreno,
  protocolos,
  onVolver,
}: {
  terreno: Terreno;
  protocolos: ProtocolizacionTerreno[];
  onVolver: () => void;
}) {
  const [acreditacion, setAcreditacion] = useState(terreno.acreditacionTecnicaAmbiental);
  const [levantamiento, setLevantamiento] = useState(terreno.levantamientoTopografico);

  return (
    <>
      <AssetDetailView
        title="Terrenos: Control de Parcelas"
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
                value: (
                  <select
                    value={acreditacion}
                    onChange={(e) => setAcreditacion(e.target.value as Terreno['acreditacionTecnicaAmbiental'])}
                    className="input-field max-w-xs"
                  >
                    {ESTADOS_TRAMITE.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ),
              },
              { label: 'Fecha de Ingreso', value: formatFecha(terreno.fechaIngreso) },
              { label: 'Ubicación Adicional', value: terreno.ubicacionAdicional || '—' },
              {
                label: 'Levantamiento topográfico',
                value: (
                  <select
                    value={levantamiento}
                    onChange={(e) => setLevantamiento(e.target.value as Terreno['levantamientoTopografico'])}
                    className="input-field max-w-xs"
                  >
                    {ESTADOS_TRAMITE.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
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
              onClick={onVolver}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver al listado
            </button>
            <button type="button" className="px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-semibold hover:bg-navy-800">
              Agregar Protocolización
            </button>
            <button type="button" className="px-5 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-50">
              Retirar de Inventario
            </button>
          </>
        }
      />

      {protocolos.length > 0 && (
        <div className="px-4 md:px-6 pb-8 max-w-7xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-navy-900 font-display">Detalles de área</h2>
          {protocolos.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Tipo de Protocolización</p>
                  <p className="text-sm font-medium text-navy-900">{p.tipoProtocolizacion}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Motivo</p>
                  <p className="text-sm font-medium text-navy-900">{p.motivo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Beneficiario</p>
                  <p className="text-sm font-medium text-navy-900">{p.beneficiario}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="text-sm font-medium text-navy-900">{formatFecha(p.fecha)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Cantidad de Área Comprometida o desincorporada M²</p>
                  <p className="text-sm font-medium text-navy-900">{formatAreaM2Detail(p.areaComprometidaM2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function Terrenos() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    codigo: '',
    identificacion: '',
    estado: '',
    zonificacion: '',
    nroPropiedad: '',
    levantamiento: '',
    acreditacion: '',
    buscar: '',
  });

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
      limit: PER_PAGE,
      search: apiSearch,
      estado: filtros.estado && filtros.estado !== 'Todos'
        ? (filtros.estado as (typeof ESTADOS_PARCELA)[number])
        : undefined,
    }),
    [page, apiSearch, filtros.estado],
  );

  const statsQuery = useApiQuery(() => fetchParcelasEstadisticas(), []);
  const allParcelasQuery = useApiQuery(() => fetchParcelas({ page: 1, limit: 5000 }), []);

  const terrenos = listQuery.data?.terrenos ?? [];
  const todasLasParcelas = allParcelasQuery.data?.terrenos ?? terrenos;

  const metricas = useMemo(() => {
    const totalParcelas = statsQuery.data?.total ?? listQuery.data?.meta.total ?? todasLasParcelas.length;
    const areaDisponible = todasLasParcelas.reduce((s, t) => s + (t.areaDisponible ?? 0), 0);
    const areaDesincorporada = todasLasParcelas.reduce((s, t) => s + (t.areaDesincorporada ?? 0), 0);
    const areaComprometida = todasLasParcelas.reduce((s, t) => s + (t.areaComprometida ?? 0), 0);
    const areaDocumento = todasLasParcelas.reduce((s, t) => s + (t.areaDocumento ?? 0), 0);
    return { totalParcelas, areaDisponible, areaDesincorporada, areaComprometida, areaDocumento };
  }, [todasLasParcelas, statsQuery.data?.total, listQuery.data?.meta.total]);

  const filtered = useMemo(() => {
    return terrenos.filter((t) => {
      if (filtros.codigo && !t.codigo.toLowerCase().includes(filtros.codigo.toLowerCase())) return false;
      if (
        filtros.identificacion &&
        !t.identificacion.toLowerCase().includes(filtros.identificacion.toLowerCase())
      ) {
        return false;
      }
      if (filtros.nroPropiedad && !t.nroPropiedad.includes(filtros.nroPropiedad)) return false;
      if (filtros.levantamiento && filtros.levantamiento !== 'Todos' && t.levantamientoTopografico !== filtros.levantamiento) return false;
      if (filtros.acreditacion && filtros.acreditacion !== 'Todos' && t.acreditacionTecnicaAmbiental !== filtros.acreditacion) return false;
      return true;
    });
  }, [terrenos, filtros]);

  const totalPages = Math.max(1, listQuery.data?.meta.totalPages ?? 1);
  const paginated = filtered;

  const setFiltro = (key: keyof typeof filtros, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const columns: Column<Terreno>[] = [
    { key: 'codigo', label: 'Código', render: (t) => <span className="font-mono font-bold text-navy-900">{t.codigo}</span> },
    { key: 'identificacion', label: 'Identificación' },
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
    const protos = detailQuery.data?.protocolos ?? [];

    return (
      <ApiState loading={detailQuery.loading} error={detailQuery.error} onRetry={detailQuery.refetch}>
        {terreno && (
          <TerrenoParcelaDetail
            terreno={terreno}
            protocolos={protos}
            onVolver={() => navigate('/terrenos')}
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
        onCreate={() => {}}
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
          { key: 'levantamiento', label: 'Levantamiento Topográfico', type: 'select', value: filtros.levantamiento, onChange: (v) => setFiltro('levantamiento', v), options: ['Todos', ...ESTADOS_TRAMITE] },
          { key: 'acreditacion', label: 'Acreditación Técnica Ambiental', type: 'select', value: filtros.acreditacion, onChange: (v) => setFiltro('acreditacion', v), options: ['Todos', ...ESTADOS_TRAMITE] },
          { key: 'buscar', label: 'Buscar', type: 'search', value: filtros.buscar, onChange: (v) => setFiltro('buscar', v), placeholder: 'Buscar en registros...', className: 'sm:col-span-2 lg:col-span-1' },
        ]}
      />

      <ApiState
        loading={listQuery.loading && !listQuery.data}
        error={listQuery.error}
        onRetry={listQuery.refetch}
        empty={!listQuery.loading && filtered.length === 0}
        emptyMessage="No hay parcelas registradas. Crea una propiedad y documento en el backend, luego registra parcelas."
      >
        <ModuleDataTable
          data={paginated}
          columns={columns}
          loading={listQuery.loading && Boolean(listQuery.data)}
          onDetails={(t) => navigate(`/terrenos/${t.id}`)}
        />

        <ModulePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </ApiState>
    </div>
  );
}
