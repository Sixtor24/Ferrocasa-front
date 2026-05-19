import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  parcelas,
  sectores,
  tiposParcela,
  estatusParcela,
  cementerioStats,
} from '../data/cementerio';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Users,
  AlertTriangle,
  Wrench,
  X,
  Filter,
  FileSpreadsheet,
  Plus,
  Eye,
  Landmark,
} from 'lucide-react';

const estatusStyle: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-700',
  OCUPADA: 'bg-navy-100 text-navy-800',
  RESERVADA: 'bg-amber-100 text-amber-700',
  MANTENIMIENTO: 'bg-red-100 text-red-700',
};

const tipoStyle: Record<string, string> = {
  Individual: 'bg-blue-50 text-blue-700',
  Familiar: 'bg-purple-50 text-purple-700',
  Nicho: 'bg-gray-100 text-gray-700',
  Osario: 'bg-orange-50 text-orange-700',
};

const PER_PAGE = 6;

export default function Cementerio() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroSector, setFiltroSector] = useState('Todos los sectores');
  const [filtroTipo, setFiltroTipo] = useState('Todos los tipos');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  // Form
  const [fSector, setFSector] = useState(sectores[1]);
  const [fTipo, setFTipo] = useState<'Individual' | 'Familiar' | 'Nicho' | 'Osario'>('Individual');
  const [fTitular, setFTitular] = useState('');

  const filtrados = useMemo(() => {
    return parcelas.filter((p) => {
      if (filtroSector !== 'Todos los sectores' && p.sector !== filtroSector) return false;
      if (filtroTipo !== 'Todos los tipos' && p.tipo !== filtroTipo) return false;
      if (filtroEstatus !== 'Todos' && p.estatus !== filtroEstatus) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return (
          p.codigo.toLowerCase().includes(q) ||
          p.titular.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [busqueda, filtroSector, filtroTipo, filtroEstatus]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaActual - 1) * PER_PAGE, paginaActual * PER_PAGE);

  const hayFiltros = filtroSector !== 'Todos los sectores' || filtroTipo !== 'Todos los tipos' || filtroEstatus !== 'Todos' || busqueda !== '';

  const limpiar = () => {
    setFiltroSector('Todos los sectores');
    setFiltroTipo('Todos los tipos');
    setFiltroEstatus('Todos');
    setBusqueda('');
    setPagina(1);
  };

  const simularExport = () => {
    setExportMsg('Generando reporte...');
    setTimeout(() => setExportMsg('Reporte exportado'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handleReservar = () => {
    if (!fTitular.trim()) return;
    setFormMsg('Reserva registrada exitosamente');
    setFTitular('');
    setTimeout(() => setFormMsg(''), 3000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Cementerio</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Gestión de Cementerio Municipal</h1>
          <p className="text-sm text-gray-500 mt-1">Administración de parcelas, nichos y servicios funerarios.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>}
          <button onClick={simularExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            <Plus size={16} />
            <span className="hidden sm:inline">Reservar Parcela</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<Landmark size={18} className="text-navy-600" />} iconBg="bg-navy-100"
          label="Total Parcelas" value={cementerioStats.totalParcelas.toString()} />
        <StatCard icon={<MapPin size={18} className="text-green-600" />} iconBg="bg-green-100"
          label="Disponibles" value={cementerioStats.disponibles.toString()} />
        <StatCard icon={<Users size={18} className="text-blue-600" />} iconBg="bg-blue-100"
          label="Ocupadas" value={cementerioStats.ocupadas.toString()} />
        <StatCard icon={<AlertTriangle size={18} className="text-amber-600" />} iconBg="bg-amber-100"
          label="Reservadas" value={cementerioStats.reservadas.toString()} />
        <StatCard icon={<Wrench size={18} className="text-red-600" />} iconBg="bg-red-100"
          label="Mantenimiento" value={cementerioStats.mantenimiento.toString()} />
      </div>

      {/* Reservation form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wide mb-4">Nueva Reserva de Parcela</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Sector</label>
              <select value={fSector} onChange={(e) => setFSector(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
                {sectores.filter((s) => s !== 'Todos los sectores').map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Tipo</label>
              <select value={fTipo} onChange={(e) => setFTipo(e.target.value as typeof fTipo)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
                <option>Individual</option><option>Familiar</option><option>Nicho</option><option>Osario</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Titular</label>
              <input type="text" placeholder="Nombre del titular" value={fTitular} onChange={(e) => setFTitular(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
            </div>
            <div className="flex items-end">
              <button onClick={handleReservar}
                className="w-full bg-navy-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-navy-800 transition-colors">
                Registrar Reserva
              </button>
            </div>
          </div>
          {formMsg && (
            <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 text-center font-medium">
              ✓ {formMsg}
            </div>
          )}
        </div>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar parcela, titular, sector..."
            value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
            showFilters ? 'border-navy-500 text-navy-800 bg-navy-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          <Filter size={16} /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Sector</label>
            <select value={filtroSector} onChange={(e) => { setFiltroSector(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {sectores.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Tipo</label>
            <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {tiposParcela.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Estatus</label>
            <select value={filtroEstatus} onChange={(e) => { setFiltroEstatus(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {estatusParcela.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
      )}

      {hayFiltros && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Filtros:</span>
          {filtroSector !== 'Todos los sectores' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {filtroSector} <X size={12} className="cursor-pointer" onClick={() => setFiltroSector('Todos los sectores')} />
            </span>
          )}
          {filtroTipo !== 'Todos los tipos' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {filtroTipo} <X size={12} className="cursor-pointer" onClick={() => setFiltroTipo('Todos los tipos')} />
            </span>
          )}
          {filtroEstatus !== 'Todos' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {filtroEstatus} <X size={12} className="cursor-pointer" onClick={() => setFiltroEstatus('Todos')} />
            </span>
          )}
          <button onClick={limpiar} className="text-xs text-red-600 hover:underline ml-1">Limpiar</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Código</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Sector / Fila</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Titular</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Fecha Asignación</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">No se encontraron parcelas.</td></tr>
              ) : paginados.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 text-sm font-mono font-medium text-navy-900">{p.codigo}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <p className="text-sm text-gray-700">{p.sector}</p>
                    <p className="text-xs text-gray-400">{p.fila} · Nro. {p.numero}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${tipoStyle[p.tipo] || 'bg-gray-100 text-gray-700'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">{p.titular}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-500">{p.fechaAsignacion}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${estatusStyle[p.estatus] || 'bg-gray-100 text-gray-600'}`}>
                      {p.estatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 gap-2">
          <p className="text-sm text-gray-500">
            {filtrados.length === 0 ? 'Sin resultados' : `Mostrando ${(paginaActual - 1) * PER_PAGE + 1}-${Math.min(paginaActual * PER_PAGE, filtrados.length)} de ${filtrados.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(Math.max(1, paginaActual - 1))} disabled={paginaActual <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30">
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPagina(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${paginaActual === p ? 'bg-navy-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))} disabled={paginaActual >= totalPaginas}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="bg-navy-900 rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg">Capacidad General</h3>
            <p className="text-sm text-white/70">Ocupación actual del cementerio municipal</p>
          </div>
          <p className="text-3xl font-bold">{cementerioStats.capacidad}</p>
        </div>
        <div className="mt-4 w-full bg-white/20 rounded-full h-3">
          <div className="bg-white h-3 rounded-full transition-all" style={{ width: cementerioStats.capacidad }} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs sm:text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 sm:w-9 sm:h-9 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
