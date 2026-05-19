import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  inmuebles,
  resumenInventario,
  proyectosOrigen,
  tiposInmueble,
  type Inmueble,
} from '../data/inmuebles';
import {
  Search,
  Filter,
  Download,
  Home,
  Building2,
  Store,
  Mountain,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
} from 'lucide-react';

const estatusStyle: Record<string, string> = {
  DISPONIBLE: 'bg-green-100 text-green-700',
  'EN PROCESO': 'bg-amber-100 text-amber-700',
  VENDIDO: 'bg-red-100 text-red-700',
};

const tipoIcono: Record<string, React.ReactNode> = {
  Apartamento: <Home size={18} className="text-navy-500" />,
  'Casa Residencial': <Building2 size={18} className="text-navy-500" />,
  'Local Comercial': <Store size={18} className="text-navy-500" />,
  Terreno: <Mountain size={18} className="text-navy-500" />,
};

export default function Inmuebles() {
  const [listaInmuebles, setListaInmuebles] = useState<Inmueble[]>(inmuebles);
  const [filtroEstatus, setFiltroEstatus] = useState('Todos');
  const [proyecto, setProyecto] = useState(proyectosOrigen[0]);
  const [codigoCatastral, setCodigoCatastral] = useState('CAT-00-12345');
  const [tipo, setTipo] = useState('Apartamento');
  const [numero, setNumero] = useState('B-14');
  const [superficie, setSuperficie] = useState('0.00');
  const [precio, setPrecio] = useState('0.00');
  const [estatusInicial, setEstatusInicial] = useState<'Disponible' | 'Proceso'>('Disponible');
  const [pagina, setPagina] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const filtrados = useMemo(() => {
    let list = listaInmuebles;
    if (filtroEstatus !== 'Todos') {
      list = list.filter((i) => i.estatus === filtroEstatus.toUpperCase());
    }
    if (busqueda) {
      const q = busqueda.toLowerCase();
      list = list.filter((i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.codigo.toLowerCase().includes(q) ||
        i.zona.toLowerCase().includes(q) ||
        i.tipoInmueble.toLowerCase().includes(q)
      );
    }
    return list;
  }, [listaInmuebles, filtroEstatus, busqueda]);

  const PER_PAGE = 4;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaActual - 1) * PER_PAGE, paginaActual * PER_PAGE);

  const totalDisponibles = listaInmuebles.filter((i) => i.estatus === 'DISPONIBLE').length;
  const porcentajeDisp = listaInmuebles.length > 0 ? Math.round((totalDisponibles / listaInmuebles.length) * 100) : 0;

  const simularExport = () => {
    setExportMsg('Exportando...');
    setTimeout(() => setExportMsg('Exportado exitosamente'), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handleRegistrar = () => {
    const nuevo: Inmueble = {
      id: listaInmuebles.length + 1,
      nombre: `${tipo.charAt(0)}-${numero}`,
      zona: proyecto.split(' ').pop() || proyecto,
      tipoInmueble: tipo,
      codigo: `CT-2024-${String(listaInmuebles.length + 1).padStart(3, '0')}`,
      superficie: `${superficie} m²`,
      precio: `$${parseFloat(precio).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      estatus: estatusInicial === 'Disponible' ? 'DISPONIBLE' : 'EN PROCESO',
    };
    setListaInmuebles([nuevo, ...listaInmuebles]);
    setCodigoCatastral('CAT-00-12345');
    setNumero('B-14');
    setSuperficie('0.00');
    setPrecio('0.00');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs = ['Todos', 'Disponible', 'Vendido', 'En proceso'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/almacen" className="hover:text-navy-600">Almacén</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Registro de Inmuebles</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Registro de Inmuebles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administración centralizada de activos inmobiliarios y terrenos nacionales.
          </p>
        </div>
        {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-navy-700" />
              </div>
              <h2 className="text-lg font-bold text-navy-900">NUEVO INMUEBLE</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Proyecto de Origen</label>
                <select
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                >
                  {proyectosOrigen.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Código Catastral</label>
                <input
                  type="text"
                  value={codigoCatastral}
                  onChange={(e) => setCodigoCatastral(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                  >
                    {tiposInmueble.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Número</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Superficie (m²)</label>
                  <input
                    type="text"
                    value={superficie}
                    onChange={(e) => setSuperficie(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Precio ($)</label>
                  <input
                    type="text"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Estatus Inicial</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEstatusInicial('Disponible')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      estatusInicial === 'Disponible'
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Disponible
                  </button>
                  <button
                    onClick={() => setEstatusInicial('Proceso')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      estatusInicial === 'Proceso'
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Proceso
                  </button>
                </div>
              </div>

              <button
                onClick={handleRegistrar}
                className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Registrar Activo
              </button>
              {showSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2 text-center font-medium">
                  ✓ Inmueble registrado exitosamente
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-navy-900 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Resumen de Inventario</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                <span className="text-sm text-white/80">Total Inmuebles</span>
                <span className="text-xl font-bold">{listaInmuebles.length.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3">
                <span className="text-sm text-white/80">Disponibilidad</span>
                <span className="text-xl font-bold">{porcentajeDisp}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar inmueble por nombre, código o zona..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tabs & tools */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 pt-4 gap-3">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setFiltroEstatus(tab); setPagina(1); }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      filtroEstatus === tab
                        ? 'bg-navy-900 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {tab}
                    <span className="ml-1.5 text-xs opacity-70">
                      ({tab === 'Todos'
                        ? listaInmuebles.length
                        : listaInmuebles.filter((i) => i.estatus === tab.toUpperCase()).length})
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Filter size={14} />
                  Filtrar
                </button>
                <button
                  onClick={simularExport}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Download size={14} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full mt-4 min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Inmueble</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Código</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Superficie</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Precio</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Estatus</th>
                </tr>
              </thead>
              <tbody>
                {paginados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                      No se encontraron inmuebles.
                    </td>
                  </tr>
                ) : paginados.map((inmueble) => (
                  <tr key={inmueble.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {tipoIcono[inmueble.tipoInmueble] || <Home size={18} className="text-gray-400" />}
                        <div>
                          <p className="text-sm font-semibold text-navy-900">{inmueble.nombre}</p>
                          <p className="text-xs text-gray-500">{inmueble.tipoInmueble}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{inmueble.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inmueble.superficie}</td>
                    <td className="px-6 py-4 text-sm font-medium text-navy-900">{inmueble.precio}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded ${estatusStyle[inmueble.estatus] || 'bg-gray-100 text-gray-600'}`}>
                        {inmueble.estatus}
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
                {filtrados.length === 0
                  ? 'Sin resultados'
                  : `Mostrando ${(paginaActual - 1) * PER_PAGE + 1}-${Math.min(paginaActual * PER_PAGE, filtrados.length)} de ${filtrados.length} activos`}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(Math.max(1, paginaActual - 1))}
                  disabled={paginaActual <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: Math.min(totalPaginas, 3) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium ${
                      paginaActual === p ? 'bg-navy-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
                  disabled={paginaActual >= totalPaginas}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
