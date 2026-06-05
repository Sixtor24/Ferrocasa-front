import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { proyectos, proyectosStats } from '../data/proyectos';
import {
  Plus,
  Filter,
  Download,
  ChevronRight,
  MoreVertical,
  Building2,
  Tag,
  Package,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';

const estadoColor: Record<string, string> = {
  'EN CONSTRUCCIÓN': 'text-blue-600',
  'ENTREGA INMEDIATA': 'text-green-600',
  'PRE-VENTA': 'text-amber-600',
};

const estados = ['Todos los estados', 'EN CONSTRUCCIÓN', 'ENTREGA INMEDIATA', 'PRE-VENTA'];

export default function Proyectos() {
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState('Todos los tipos');
  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [busqueda, setBusqueda] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const filtrados = useMemo(() => {
    return proyectos.filter((p) => {
      if (filtroTipo !== 'Todos los tipos' && p.tipo !== filtroTipo) return false;
      if (filtroEstado !== 'Todos los estados' && p.estado !== filtroEstado) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.ubicacion.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filtroTipo, filtroEstado, busqueda]);

  const hayFiltros = filtroTipo !== 'Todos los tipos' || filtroEstado !== 'Todos los estados' || busqueda !== '';

  const simularExport = () => {
    setExportMsg('Generando archivo...');
    setTimeout(() => setExportMsg('Archivo exportado exitosamente'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Catálogo de Proyectos</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Gestión de Proyectos Habitacionales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Supervisión técnica y comercial de desarrollos inmobiliarios estatales.
          </p>
        </div>
        <Link
          to="/terrenos"
          className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800"
        >
          <Plus size={18} />
          Nuevo Proyecto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox
          icon={<Building2 size={20} className="text-navy-500" />}
          label="Total Proyectos"
          value={filtrados.length.toString()}
          extra={<span className="text-green-500 text-xs">📈 {proyectosStats.totalProyectos.cambio}</span>}
        />
        <StatBox
          icon={<Tag size={20} className="text-navy-500" />}
          label="Unidades Vendidas"
          value={filtrados.reduce((s, p) => s + p.vendidos, 0).toString()}
          extra={<span className="text-xs text-gray-500">{proyectosStats.unidadesVendidas.porcentaje}</span>}
        />
        <StatBox
          icon={<Package size={20} className="text-navy-500" />}
          label="Disponibilidad"
          value={filtrados.reduce((s, p) => s + p.disponibles, 0).toString()}
          extra={<span className="text-xs text-green-600">Entrega inmediata</span>}
        />
        <StatBox
          icon={<TrendingUp size={20} className="text-navy-500" />}
          label="Valorización Prom."
          value={proyectosStats.valorizacion.valor}
          extra={<span className="text-xs text-gray-500">{proyectosStats.valorizacion.nota}</span>}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              showFilters ? 'border-navy-500 text-navy-800 bg-navy-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtros Avanzados
          </button>
          <button
            onClick={simularExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download size={16} />
            Exportar PDF/Excel
          </button>
          {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse self-center">{exportMsg}</span>}
        </div>
        <div className="flex items-center gap-3 flex-1 sm:flex-initial">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
          >
            <option>Todos los tipos</option>
            <option>EDIFICIO</option>
            <option>URBANISMO</option>
            <option>TOWNHOUSES</option>
          </select>
        </div>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Estado del proyecto</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              {estados.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option>Todos los tipos</option>
              <option>EDIFICIO</option>
              <option>URBANISMO</option>
              <option>TOWNHOUSES</option>
            </select>
          </div>
          {hayFiltros && (
            <button
              onClick={() => { setFiltroTipo('Todos los tipos'); setFiltroEstado('Todos los estados'); setBusqueda(''); }}
              className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">ID</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Nombre del Proyecto</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Ubicación</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Tipo</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase px-6 py-3">Total Inmuebles</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase px-6 py-3">Vendidos</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase px-6 py-3">Disponibles</th>
              <th className="text-center text-xs font-semibold text-gray-500 uppercase px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No se encontraron proyectos con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filtrados.map((proyecto) => (
                <tr
                  key={proyecto.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate('/terrenos')}
                >
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">{proyecto.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-navy-900">{proyecto.nombre}</p>
                    <p className={`text-xs font-bold ${estadoColor[proyecto.estado] || 'text-gray-500'}`}>
                      {proyecto.estado}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{proyecto.ubicacion}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded ${proyecto.tipoColor}`}>
                      {proyecto.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-navy-900">{proyecto.totalInmuebles}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-navy-50 text-navy-800 text-sm font-medium px-2 py-0.5 rounded">
                      {proyecto.vendidos}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 text-sm font-bold">{proyecto.disponibles}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      className="text-gray-400 hover:text-navy-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative rounded-xl overflow-hidden h-56">
          <img
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
            alt="Residencias El Ávila"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded mb-2 inline-block">
              DESTACADO DEL MES
            </span>
            <p className="text-lg font-bold">Residencias El Ávila</p>
            <p className="text-sm text-white/80">Finalización estimada: Q4 2024. Avance de obra: 78%.</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
            <Building2 size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-navy-900 mb-2">¿Iniciando un nuevo desarrollo?</p>
          <p className="text-sm text-gray-500 text-center mb-4 max-w-xs">
            Complete la ficha técnica para registrar un nuevo proyecto en el sistema nacional de inventario de bienes habitacionales.
          </p>
          <button
            onClick={() => navigate('/terrenos')}
            className="flex items-center gap-2 px-6 py-2.5 border-2 border-navy-900 text-navy-900 rounded-lg text-sm font-bold hover:bg-navy-900 hover:text-white transition-colors"
          >
            Registrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-navy-900 mb-1">{value}</p>
      {extra}
    </div>
  );
}
