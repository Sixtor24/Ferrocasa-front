import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  materiales as materialesInit,
  materialesStats,
  unidadesMaterial,
  type Material,
} from '../data/materiales';
import {
  Plus,
  Download,
  Printer,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Search,
} from 'lucide-react';

const estadoStyle: Record<string, { bg: string; dot: string }> = {
  OK: { bg: 'text-green-700', dot: 'bg-green-500' },
  BAJO: { bg: 'text-amber-700', dot: 'bg-amber-500' },
  'CRÍTICO': { bg: 'text-red-700', dot: 'bg-red-500' },
};

export default function Materiales() {
  const [materialesList, setMaterialesList] = useState<Material[]>(materialesInit);
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  // Form state for new material
  const [newCodigo, setNewCodigo] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newUnidad, setNewUnidad] = useState(unidadesMaterial[0]);
  const [newStockActual, setNewStockActual] = useState('');
  const [newStockMinimo, setNewStockMinimo] = useState('');

  const filtrados = useMemo(() => {
    let list = materialesList;
    if (filtroStockBajo) {
      list = list.filter((m) => m.estado === 'BAJO' || m.estado === 'CRÍTICO');
    }
    if (busqueda) {
      const q = busqueda.toLowerCase();
      list = list.filter((m) =>
        m.codigo.toLowerCase().includes(q) ||
        m.nombre.toLowerCase().includes(q) ||
        m.unidad.toLowerCase().includes(q)
      );
    }
    return list;
  }, [materialesList, filtroStockBajo, busqueda]);

  const totalMateriales = materialesList.length;
  const alertas = materialesList.filter((m) => m.estado !== 'OK').length;

  const simularExport = (tipo: string) => {
    setExportMsg(`Generando ${tipo}...`);
    setTimeout(() => setExportMsg(`${tipo} exportado`), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  const handleAddMaterial = () => {
    if (!newCodigo || !newNombre || !newStockActual || !newStockMinimo) return;

    const stockActual = parseInt(newStockActual);
    const stockMinimo = parseInt(newStockMinimo);
    let estado: Material['estado'] = 'OK';
    if (stockActual < stockMinimo * 0.5) estado = 'CRÍTICO';
    else if (stockActual < stockMinimo) estado = 'BAJO';

    const nuevoMaterial: Material = {
      id: materialesList.length + 1,
      codigo: newCodigo,
      nombre: newNombre,
      unidad: newUnidad,
      stockActual,
      stockMinimo,
      estado,
    };

    setMaterialesList([nuevoMaterial, ...materialesList]);
    setShowModal(false);
    setNewCodigo('');
    setNewNombre('');
    setNewUnidad(unidadesMaterial[0]);
    setNewStockActual('');
    setNewStockMinimo('');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/dashboard" className="hover:text-navy-600">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Catálogo de Materiales</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Catálogo de Materiales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Almacén Central - Gestión de inventario técnico
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            Stock Bajo
            <button
              onClick={() => setFiltroStockBajo(!filtroStockBajo)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                filtroStockBajo ? 'bg-navy-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  filtroStockBajo ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </label>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800"
          >
            <Plus size={18} />
            Nuevo Material
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center">
            <Package size={24} className="text-navy-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Materiales</p>
            <p className="text-2xl font-bold text-navy-900">{totalMateriales.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={24} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Stock Bajo/Crítico</p>
            <p className="text-2xl font-bold text-navy-900">{alertas}</p>
            <p className="text-xs text-red-500 font-medium">alertas</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <ArrowDownToLine size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Entradas (24h)</p>
            <p className="text-2xl font-bold text-navy-900">{materialesStats.entradas24h}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar material por código o nombre..."
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Código</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Nombre</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Unidad</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Stock Actual</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Stock Mínimo</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Estado</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((mat) => {
              const estilo = estadoStyle[mat.estado] || estadoStyle['OK'];
              const isLow = mat.stockActual < mat.stockMinimo;
              return (
                <tr key={mat.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-navy-900">{mat.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{mat.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mat.unidad}</td>
                  <td className={`px-6 py-4 text-sm font-bold ${isLow ? 'text-red-500' : 'text-navy-900'}`}>
                    {mat.stockActual.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mat.stockMinimo.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${estilo.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${estilo.dot}`} />
                      {mat.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-navy-900">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 gap-2">
          <div className="flex gap-3 items-center">
            <button
              onClick={() => simularExport('CSV')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Download size={14} />
              Exportar CSV
            </button>
            <button
              onClick={() => simularExport('PDF')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <Printer size={14} />
              Imprimir
            </button>
            {exportMsg && <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Mostrando 1-{filtrados.length} de {totalMateriales.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 ml-3">
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <ChevronLeft size={18} />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    pagina === p ? 'bg-navy-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="relative rounded-xl overflow-hidden h-48">
        <img
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80"
          alt="Almacén"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy-950/70" />
        <div className="absolute bottom-6 left-6 text-white">
          <h3 className="text-xl font-bold">Auditoría de Activos 2024</h3>
          <p className="text-sm text-white/80">
            Gestión centralizada para la eficiencia en la infraestructura nacional.
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy-900">Nuevo Material</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Código</label>
                <input
                  type="text"
                  placeholder="Ej: TUB-007"
                  value={newCodigo}
                  onChange={(e) => setNewCodigo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Tubería PVC 4 pulgadas"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Unidad</label>
                <select
                  value={newUnidad}
                  onChange={(e) => setNewUnidad(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                >
                  {unidadesMaterial.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Stock Actual</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newStockActual}
                    onChange={(e) => setNewStockActual(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Stock Mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newStockMinimo}
                    onChange={(e) => setNewStockMinimo(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>
              <button
                onClick={handleAddMaterial}
                className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Registrar Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
