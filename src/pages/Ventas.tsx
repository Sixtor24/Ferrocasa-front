import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ventas,
  ventasStats,
  proyectosVenta,
  estatusVenta,
  metodosPago,
} from '../data/ventas';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  FileSpreadsheet,
  FileText,
  Plus,
  X,
  Filter,
  Eye,
} from 'lucide-react';

const estatusStyle: Record<string, string> = {
  COMPLETADA: 'bg-green-100 text-green-700',
  PENDIENTE: 'bg-amber-100 text-amber-700',
  'EN PROCESO': 'bg-blue-100 text-blue-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

const PER_PAGE = 5;

export default function Ventas() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');
  const [filtroProyecto, setFiltroProyecto] = useState('Todos los proyectos');
  const [filtroPago, setFiltroPago] = useState('Todos');
  const [pagina, setPagina] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [detalle, setDetalle] = useState<number | null>(null);

  const filtrados = useMemo(() => {
    return ventas.filter((v) => {
      if (filtroEstatus !== 'Todos' && v.estatus !== filtroEstatus) return false;
      if (filtroProyecto !== 'Todos los proyectos' && v.proyecto !== filtroProyecto) return false;
      if (filtroPago !== 'Todos' && v.metodoPago !== filtroPago) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return (
          v.codigo.toLowerCase().includes(q) ||
          v.cliente.toLowerCase().includes(q) ||
          v.inmueble.toLowerCase().includes(q) ||
          v.proyecto.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [busqueda, filtroEstatus, filtroProyecto, filtroPago]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaActual - 1) * PER_PAGE, paginaActual * PER_PAGE);

  const hayFiltros = filtroEstatus !== 'Todos' || filtroProyecto !== 'Todos los proyectos' || filtroPago !== 'Todos' || busqueda !== '';

  const limpiar = () => {
    setFiltroEstatus('Todos');
    setFiltroProyecto('Todos los proyectos');
    setFiltroPago('Todos');
    setBusqueda('');
    setPagina(1);
  };

  const simularExport = (tipo: string) => {
    setExportMsg(`Generando ${tipo}...`);
    setTimeout(() => setExportMsg(`${tipo} generado exitosamente`), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const montoFiltrado = filtrados.reduce((s, v) => s + v.montoNum, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Ventas</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Gestión de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Control de transacciones inmobiliarias y seguimiento comercial.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>}
          <button onClick={() => simularExport('Excel')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={() => simularExport('PDF')}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800">
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign size={18} className="text-green-600" />} iconBg="bg-green-100"
          label="Monto Total" value={`$${montoFiltrado.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} extra={`${filtrados.length} transacciones`} />
        <StatCard icon={<CheckCircle2 size={18} className="text-navy-600" />} iconBg="bg-navy-100"
          label="Completadas" value={ventasStats.completadas.toString()} extra={`Tasa cierre: ${ventasStats.tasaCierre}`} />
        <StatCard icon={<Clock size={18} className="text-amber-600" />} iconBg="bg-amber-100"
          label="Pendientes" value={(ventasStats.pendientes + ventasStats.enProceso).toString()} extra="Requieren seguimiento" />
        <StatCard icon={<TrendingUp size={18} className="text-blue-600" />} iconBg="bg-blue-100"
          label="Promedio Venta" value={ventasStats.promedioVenta} extra="Por transacción" />
      </div>

      {/* Search + Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por código, cliente, inmueble..."
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
          <Filter size={16} />
          Filtros
          {hayFiltros && <span className="bg-navy-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">!</span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Estatus</label>
            <select value={filtroEstatus} onChange={(e) => { setFiltroEstatus(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {estatusVenta.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Proyecto</label>
            <select value={filtroProyecto} onChange={(e) => { setFiltroProyecto(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {proyectosVenta.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Método Pago</label>
            <select value={filtroPago} onChange={(e) => { setFiltroPago(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {metodosPago.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="button"
              onClick={limpiar}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Active filters */}
      {hayFiltros && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Filtros activos:</span>
          {filtroEstatus !== 'Todos' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {filtroEstatus} <X size={12} className="cursor-pointer" onClick={() => setFiltroEstatus('Todos')} />
            </span>
          )}
          {filtroProyecto !== 'Todos los proyectos' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {filtroProyecto} <X size={12} className="cursor-pointer" onClick={() => setFiltroProyecto('Todos los proyectos')} />
            </span>
          )}
          {filtroPago !== 'Todos' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {filtroPago} <X size={12} className="cursor-pointer" onClick={() => setFiltroPago('Todos')} />
            </span>
          )}
          {busqueda && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              "{busqueda}" <X size={12} className="cursor-pointer" onClick={() => setBusqueda('')} />
            </span>
          )}
          <button type="button" onClick={limpiar} className="text-xs text-red-600 hover:underline ml-1">
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Código</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Inmueble</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Monto</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Estatus</th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginados.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No se encontraron ventas.</td></tr>
              ) : paginados.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 text-sm font-mono font-medium text-navy-900">{v.codigo}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <p className="text-sm font-medium text-navy-900">{v.cliente}</p>
                    <p className="text-xs text-gray-500">{v.metodoPago}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <p className="text-sm text-gray-700">{v.inmueble}</p>
                    <p className="text-xs text-gray-400">{v.proyecto}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm font-bold text-navy-900">{v.monto}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{v.fecha}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded ${estatusStyle[v.estatus] || 'bg-gray-100 text-gray-600'}`}>
                      {v.estatus}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    <button onClick={() => setDetalle(detalle === v.id ? null : v.id)}
                      className="text-gray-400 hover:text-navy-900">
                      <Eye size={16} />
                    </button>
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

      {/* Detail panel */}
      {detalle && (() => {
        const v = ventas.find((x) => x.id === detalle);
        if (!v) return null;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Detalle de Venta {v.codigo}</h3>
                <p className="text-sm text-gray-500">Información completa de la transacción</p>
              </div>
              <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs mb-1">Cliente</p><p className="font-medium text-navy-900">{v.cliente}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Inmueble</p><p className="font-medium text-navy-900">{v.inmueble}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Proyecto</p><p className="font-medium text-navy-900">{v.proyecto}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Monto</p><p className="font-bold text-navy-900 text-lg">{v.monto}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Fecha</p><p className="font-medium text-navy-900">{v.fecha}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Método de Pago</p><p className="font-medium text-navy-900">{v.metodoPago}</p></div>
              <div><p className="text-gray-500 text-xs mb-1">Estatus</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded ${estatusStyle[v.estatus]}`}>{v.estatus}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, extra }: {
  icon: React.ReactNode; iconBg: string; label: string; value: string; extra: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{extra}</p>
    </div>
  );
}
