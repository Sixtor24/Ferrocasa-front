import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  reporteStats,
  materialesReporte,
  categoriasMaterial,
  tiposMovimiento,
} from '../data/reportes';
import {
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Eye,
  ChevronRight,
  Search,
  BarChart3,
  PieChart,
  Filter,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

const tendenciaIcon: Record<string, React.ReactNode> = {
  up: <TrendingUp size={16} className="text-green-500" />,
  down: <TrendingDown size={16} className="text-red-500" />,
  stable: <Minus size={16} className="text-gray-400" />,
};
const tendenciaLabel: Record<string, string> = { up: 'Alza', down: 'Baja', stable: 'Estable' };

export default function Reportes() {
  const [fechaDesde, setFechaDesde] = useState('2024-01-01');
  const [fechaHasta, setFechaHasta] = useState('2024-12-31');
  const [tipoMovimiento, setTipoMovimiento] = useState(tiposMovimiento[0]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([
    'Construcción', 'Maquinaria Pesada', 'Mobiliario', 'Vehículos',
  ]);
  const [formato, setFormato] = useState<'Resumido' | 'Detallado'>('Resumido');
  const [generado, setGenerado] = useState(true);
  const [exportMsg, setExportMsg] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const toggleCategoria = (cat: string) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredMateriales = useMemo(() => {
    let list = materialesReporte;
    if (categoriasSeleccionadas.length > 0 && categoriasSeleccionadas.length < categoriasMaterial.length) {
      list = list.filter((m) => categoriasSeleccionadas.includes(m.categoria));
    }
    if (tipoMovimiento !== 'Todos los movimientos') {
      list = list.filter((m) => m.tipoMov === tipoMovimiento);
    }
    if (busqueda) {
      const q = busqueda.toLowerCase();
      list = list.filter((m) =>
        m.codigo.toLowerCase().includes(q) ||
        m.descripcion.toLowerCase().includes(q) ||
        m.categoria.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoriasSeleccionadas, tipoMovimiento, busqueda]);

  const handleGenerar = () => {
    setGenerado(false);
    setTimeout(() => setGenerado(true), 900);
  };

  const simularExport = (tipo: string) => {
    setExportMsg(`Generando ${tipo}...`);
    setTimeout(() => setExportMsg(`${tipo} descargado exitosamente`), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const activeFilterCount = (categoriasSeleccionadas.length < categoriasMaterial.length ? 1 : 0) +
    (tipoMovimiento !== 'Todos los movimientos' ? 1 : 0) +
    (busqueda ? 1 : 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Reportes</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Centro de Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Generación, análisis y exportación de reportes operativos.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>}
          <button
            onClick={() => simularExport('Excel')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => simularExport('PDF')}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800"
          >
            <FileText size={16} />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Total Ventas</p>
            <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900">{reporteStats.totalVentas}</p>
          <p className="text-sm text-green-500 font-medium mt-1 flex items-center gap-1">
            <TrendingUp size={14} />
            {reporteStats.cambioVentas} vs Mes Anterior
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Activos en Stock</p>
            <div className="w-9 h-9 bg-navy-100 rounded-lg flex items-center justify-center">
              <Package size={18} className="text-navy-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900">{reporteStats.activosStock}</p>
          <p className="text-xs text-gray-500 mt-1">{reporteStats.capacidadAlmacen} Capacidad Almacén</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Items Filtrados</p>
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <PieChart size={18} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy-900">{filteredMateriales.length}</p>
          <p className="text-xs text-gray-500 mt-1">de {materialesReporte.length} activos totales</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">Estado de Auditoría</p>
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={18} className="text-blue-600" />
            </div>
          </div>
          <p className="text-lg font-bold text-navy-900">{reporteStats.estadoAuditoria}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-navy-600 h-2 rounded-full transition-all" style={{ width: `${reporteStats.porcentajeRevisado}%` }} />
            </div>
            <p className="text-xs text-navy-600 font-medium mt-1 text-right">{reporteStats.porcentajeRevisado}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide flex items-center gap-2">
                <Filter size={14} />
                Filtros
              </h2>
              {activeFilterCount > 0 && (
                <span className="bg-navy-100 text-navy-800 text-xs font-bold px-2 py-0.5 rounded-full">{activeFilterCount}</span>
              )}
            </div>

            {/* Date range */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Rango de Fechas</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
                <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              </div>
            </div>

            {/* Tipo movimiento */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1.5 block">Movimiento</label>
              <select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
                {tiposMovimiento.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Categorías */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Categoría</label>
              <div className="space-y-2">
                {categoriasMaterial.map((cat) => (
                  <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={categoriasSeleccionadas.includes(cat)} onChange={() => toggleCategoria(cat)}
                      className="w-4 h-4 rounded border-gray-300 text-navy-900 focus:ring-navy-500" />
                    <span className="text-sm text-gray-700 group-hover:text-navy-900">{cat}</span>
                    <span className="text-xs text-gray-400 ml-auto">{materialesReporte.filter((m) => m.categoria === cat).length}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Formato */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Formato</label>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setFormato('Resumido')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${formato === 'Resumido' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Resumido
                </button>
                <button onClick={() => setFormato('Detallado')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${formato === 'Detallado' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  Detallado
                </button>
              </div>
            </div>

            <button onClick={handleGenerar}
              className="w-full bg-navy-900 text-white py-2.5 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2 text-sm">
              <RefreshCw size={15} />
              Generar Reporte
            </button>
          </div>
        </div>

        {/* Right: Report preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search + filter chips */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar en el reporte..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500" />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Active filters display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Filtros:</span>
              {tipoMovimiento !== 'Todos los movimientos' && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                  {tipoMovimiento} <X size={12} className="cursor-pointer" onClick={() => setTipoMovimiento('Todos los movimientos')} />
                </span>
              )}
              {categoriasSeleccionadas.length < categoriasMaterial.length && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {categoriasSeleccionadas.length} categorías
                </span>
              )}
              {busqueda && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                  "{busqueda}" <X size={12} className="cursor-pointer" onClick={() => setBusqueda('')} />
                </span>
              )}
            </div>
          )}

          {/* Table */}
          {generado ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200">
                <h3 className="text-base font-semibold text-navy-900">
                  {formato === 'Detallado' ? 'Vista Detallada' : 'Vista Resumida'}
                </h3>
                <span className="text-xs text-gray-500">
                  {filteredMateriales.length} {filteredMateriales.length === 1 ? 'resultado' : 'resultados'} · {fechaDesde} — {fechaHasta}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Código</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Material</th>
                      {formato === 'Detallado' && (
                        <>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Categoría</th>
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Movimiento</th>
                        </>
                      )}
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Stock</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Ventas Q4</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 sm:px-6 py-3">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMateriales.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">Sin resultados para los filtros aplicados.</td></tr>
                    ) : filteredMateriales.map((mat) => (
                      <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 text-sm font-mono font-medium text-navy-900">{mat.codigo}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">{mat.descripcion}</td>
                        {formato === 'Detallado' && (
                          <>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{mat.categoria}</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-xs font-medium text-navy-700">{mat.tipoMov}</span>
                            </td>
                          </>
                        )}
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium text-navy-900">{mat.stockActual}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-600">{mat.ventasQ4}</td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="flex items-center gap-1.5 text-xs font-medium">
                            {tendenciaIcon[mat.tendencia]} {tendenciaLabel[mat.tendencia]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>{filteredMateriales.length} registros</span>
                <span>Formato: {formato}</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-16 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500 font-medium">Generando reporte...</p>
                <p className="text-xs text-gray-400 mt-1">Procesando {materialesReporte.length} activos</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
