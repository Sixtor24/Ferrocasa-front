import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchParcelas } from '../api/services/parcelas.service';
import { useApiQuery } from '../hooks/useApiQuery';
import ApiState from '../components/ApiState';
import { ESTADOS_OCUPACION, ZONIFICACIONES, TIPOS_INMUEBLE } from '../types/inmueble';
import { formatArea, formatMoneda } from '../utils/formatters';
import DataTable, { type Column, type FilterOption } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import {
  ImportExcelModal,
  InmuebleDetallePanel,
  NuevoInmuebleModal,
  type NuevoInmueblePayload,
} from '../components/modals';
import type { Inmueble } from '../types/inmueble';
import {
  Building2, MapPin, AlertTriangle, Gavel,
  Plus, Upload,
} from 'lucide-react';

export default function Inmuebles() {
  const parcelasQuery = useApiQuery(() => fetchParcelas({ limit: 500 }), []);
  const listaFromApi = parcelasQuery.data?.inmuebles ?? [];
  const [localExtras, setLocalExtras] = useState<Inmueble[]>([]);
  const lista = [...localExtras, ...listaFromApi];
  const areaTotal = listaFromApi.reduce((total, item) => total + (item.areaSegunDocumento ?? 0), 0);
  const areaDisponible = listaFromApi.reduce((total, item) => total + (item.areaDisponible ?? 0), 0);
  const inmuebleStats = {
    totalRegistros: parcelasQuery.data?.meta?.total ?? lista.length,
    disponibles: listaFromApi.filter((i) => i.estadoOcupacion === 'Disponible').length,
    comprometidos: listaFromApi.filter((i) => i.estadoOcupacion === 'Comprometido').length,
    desincorporados: listaFromApi.filter((i) => i.estadoOcupacion === 'Desincorporado').length,
    ocupados: listaFromApi.filter((i) => i.estadoOcupacion === 'Ocupado').length,
    enLitigio: listaFromApi.filter((i) => i.estadoOcupacion === 'En litigio').length,
    areaTotal,
    areaDisponible,
  };
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [detalle, setDetalle] = useState<Inmueble | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleNuevoInmueble = (payload: NuevoInmueblePayload) => {
    const nuevo: Inmueble = {
      id: lista.length + 1,
      ...payload,
    };
    setLocalExtras([nuevo, ...localExtras]);
    setShowModal(false);
    setSuccessMsg('Inmueble registrado exitosamente');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const columns: Column<Inmueble>[] = [
    { key: 'identificacionParcela', label: 'Parcela', sortable: true, render: (i) => <span className="font-mono font-bold text-navy-900">{i.identificacionParcela}</span> },
    { key: 'ubicacion', label: 'Ubicación', sortable: true, render: (i) => (
      <div><p className="text-sm font-medium text-navy-900 truncate max-w-[220px]">{i.ubicacion}</p><p className="text-xs text-gray-500">{i.tipoInmueble} · {i.zonificacion}</p></div>
    )},
    { key: 'areaSegunDocumento', label: 'Área', align: 'right', sortable: true, render: (i) => <span className="text-sm">{formatArea(i.areaSegunDocumento)}</span> },
    { key: 'areaDisponible', label: 'Disponible', align: 'right', render: (i) => <span className="text-sm text-green-700 font-medium">{formatArea(i.areaDisponible)}</span> },
    { key: 'precio', label: 'Precio', align: 'right', sortable: true, render: (i) => <span className="text-sm font-medium">{formatMoneda(i.precio, 'USD')}</span> },
    { key: 'estadoOcupacion', label: 'Estado', render: (i) => <StatusBadge status={i.estadoOcupacion} showDot size="sm" /> },
  ];

  const filters: FilterOption[] = [
    { key: 'estadoOcupacion', label: 'Estado', options: ['Todos', ...ESTADOS_OCUPACION] },
    { key: 'zonificacion', label: 'Zonificación', options: ['Todas', ...ZONIFICACIONES] },
    { key: 'tipoInmueble', label: 'Tipo', options: ['Todos', ...TIPOS_INMUEBLE] },
  ];

  const dispPct = inmuebleStats.totalRegistros > 0
    ? Math.round((inmuebleStats.disponibles / inmuebleStats.totalRegistros) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-navy-800">Inmuebles</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Registro de Inmuebles</h1>
          <p className="text-sm text-gray-500 mt-1">Control patrimonial de parcelas y activos inmobiliarios ({inmuebleStats.totalRegistros} registros).</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {successMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{successMsg}</span>}
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            <Plus size={18} /> Nuevo Inmueble
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center"><Building2 size={22} className="text-navy-600" /></div>
          <div><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-bold text-navy-900">{inmuebleStats.totalRegistros}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center"><MapPin size={22} className="text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Disponibles</p><p className="text-2xl font-bold text-green-700">{inmuebleStats.disponibles}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center"><AlertTriangle size={22} className="text-amber-500" /></div>
          <div><p className="text-sm text-gray-500">Comprometidos</p><p className="text-2xl font-bold text-amber-700">{inmuebleStats.comprometidos}</p></div>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center"><Gavel size={22} className="text-purple-600" /></div>
          <div><p className="text-sm text-gray-500">En Litigio</p><p className="text-2xl font-bold text-purple-700">{inmuebleStats.enLitigio}</p></div>
        </div>
      </div>

      <ApiState
        loading={parcelasQuery.loading}
        error={parcelasQuery.error}
        onRetry={parcelasQuery.refetch}
        empty={!parcelasQuery.loading && lista.length === 0}
        emptyMessage="No hay parcelas/inmuebles en el sistema."
      >
        <DataTable
          data={lista}
          columns={columns}
          filters={filters}
          searchPlaceholder="Buscar por parcela, ubicación, proyecto..."
          searchKeys={['identificacionParcela', 'ubicacion', 'proyecto', 'tipoInmueble']}
          perPage={8}
          onRowClick={setDetalle}
        />
      </ApiState>

      {/* Summary bar */}
      <div className="bg-navy-900 rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">Disponibilidad Inmobiliaria</h3>
            <p className="text-sm text-white/70">{formatArea(inmuebleStats.areaDisponible)} disponibles de {formatArea(inmuebleStats.areaTotal)} totales</p>
          </div>
          <p className="text-3xl font-bold">{dispPct}%</p>
        </div>
        <div className="mt-4 w-full bg-white/20 rounded-full h-3">
          <div className="bg-white h-3 rounded-full transition-all" style={{ width: `${dispPct}%` }} />
        </div>
      </div>

      <InmuebleDetallePanel inmueble={detalle} onClose={() => setDetalle(null)} />

      <NuevoInmuebleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleNuevoInmueble}
      />

      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} tiposDisponibles={['Parcelas / Inmuebles']} />
    </div>
  );
}
