import { useState, useMemo } from 'react';
import { registrosAuditoria } from '../data/auditoria';
import { MODULO_MENU_COLORS, MODULOS_AUDITORIA_FILTRO } from '../data/modulosMenu';
import {
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const accionColor: Record<string, string> = {
  Entrada: 'text-green-600',
  Transferencia: 'text-blue-600',
  Salida: 'text-red-600',
  Modificó: 'text-blue-600',
  Creó: 'text-green-600',
  Acceso: 'text-gray-600',
  Eliminó: 'text-red-600',
};

const PER_PAGE = 4;

export default function Auditoria() {
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState('Todos los usuarios');
  const [modulo, setModulo] = useState('Todos los módulos');
  const [accion, setAccion] = useState('Todas las acciones');
  const [pagina, setPagina] = useState(1);
  const [exportMsg, setExportMsg] = useState('');

  const filtrados = useMemo(() => {
    return registrosAuditoria.filter((r) => {
      if (usuario !== 'Todos los usuarios' && r.usuario !== usuario) return false;
      if (modulo !== 'Todos los módulos' && r.modulo !== modulo) return false;
      if (accion !== 'Todas las acciones' && r.accion !== accion) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return (
          r.usuario.toLowerCase().includes(q) ||
          r.descripcion.toLowerCase().includes(q) ||
          r.modulo.toLowerCase().includes(q) ||
          r.ip.includes(q)
        );
      }
      return true;
    });
  }, [usuario, modulo, accion, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaActual - 1) * PER_PAGE, paginaActual * PER_PAGE);

  const limpiarFiltros = () => {
    setBusqueda('');
    setUsuario('Todos los usuarios');
    setModulo('Todos los módulos');
    setAccion('Todas las acciones');
    setPagina(1);
  };

  const hayFiltros = usuario !== 'Todos los usuarios' || modulo !== 'Todos los módulos' || accion !== 'Todas las acciones' || busqueda !== '';

  const simularExport = (tipo: string) => {
    setExportMsg(`Generando ${tipo}...`);
    setTimeout(() => setExportMsg(`${tipo} generado exitosamente`), 1500);
    setTimeout(() => setExportMsg(''), 4000);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Sistema</span>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Trazabilidad</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Registro de Auditoría y Trazabilidad</h1>
          <p className="text-sm text-gray-500 mt-1">
            Supervisión de operaciones de activos nacionales y control administrativo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {exportMsg && (
            <span className="text-sm text-green-600 font-medium animate-pulse">{exportMsg}</span>
          )}
          <button
            onClick={() => simularExport('PDF')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-navy-800 hover:bg-gray-50"
          >
            <FileText size={16} />
            Exportar a PDF
          </button>
          <button
            onClick={() => simularExport('Excel')}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800"
          >
            <FileSpreadsheet size={16} />
            Exportar a Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">🔍 Buscar</label>
            <div className="relative">
              <input
                type="text"
                placeholder="usuario, descripción, IP..."
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 pr-8"
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">👤 Usuario</label>
            <select
              value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option>Todos los usuarios</option>
              <option>jperez</option>
              <option>mrodriguez</option>
              <option>admin_sys</option>
              <option>lgarcia</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">📦 Módulo</label>
            <select
              value={modulo}
              onChange={(e) => { setModulo(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option>Todos los módulos</option>
              {MODULOS_AUDITORIA_FILTRO.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">⚡ Acción</label>
            <select
              value={accion}
              onChange={(e) => { setAccion(e.target.value); setPagina(1); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option>Todas las acciones</option>
              <option>Entrada</option>
              <option>Transferencia</option>
              <option>Salida</option>
              <option>Acceso</option>
            </select>
          </div>
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
            className="flex items-center gap-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={14} />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {hayFiltros && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Filtros activos:</span>
          {busqueda && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              "{busqueda}" <X size={12} className="cursor-pointer" onClick={() => setBusqueda('')} />
            </span>
          )}
          {usuario !== 'Todos los usuarios' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {usuario} <X size={12} className="cursor-pointer" onClick={() => setUsuario('Todos los usuarios')} />
            </span>
          )}
          {modulo !== 'Todos los módulos' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {modulo} <X size={12} className="cursor-pointer" onClick={() => setModulo('Todos los módulos')} />
            </span>
          )}
          {accion !== 'Todas las acciones' && (
            <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              {accion} <X size={12} className="cursor-pointer" onClick={() => setAccion('Todas las acciones')} />
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Fecha / Hora</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Usuario</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Módulo</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Acción</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Descripción</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-3">Dirección IP</th>
            </tr>
          </thead>
          <tbody>
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                  No se encontraron registros con los filtros aplicados.
                </td>
              </tr>
            ) : (
              paginados.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{reg.fecha}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-navy-100 text-navy-800 text-xs font-bold flex items-center justify-center">
                        {reg.iniciales}
                      </span>
                      <span className="text-sm font-medium text-navy-900">{reg.usuario}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${MODULO_MENU_COLORS[reg.modulo] || 'bg-gray-100 text-gray-800'}`}>
                      {reg.modulo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${accionColor[reg.accion] || 'text-gray-600'}`}>
                      {reg.accion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{reg.descripcion}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 text-right font-mono">{reg.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 gap-2">
          <p className="text-sm text-gray-500">
            {filtrados.length === 0
              ? 'Sin resultados'
              : `Mostrando ${(paginaActual - 1) * PER_PAGE + 1}-${Math.min(paginaActual * PER_PAGE, filtrados.length)} de ${filtrados.length} registros`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(Math.max(1, paginaActual - 1))}
              disabled={paginaActual <= 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => i + 1).map((p) => (
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
            {totalPaginas > 5 && <span className="text-gray-400 px-1">...</span>}
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
  );
}
