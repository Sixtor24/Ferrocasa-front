import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  fetchAuditoria,
  fetchAuditoriaById,
  type AuditoriaQuery,
} from '../api/services/auditoria.service';
import { fetchAllUsuarios } from '../api/services/usuarios.service';
import { fetchAllPages, MODULE_PAGE_SIZE } from '../api/pagination';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../context/AuthContext';
import { hasAdminAccess } from '../constants/adminAccess';
import SearchableSelect from '../components/forms/SearchableSelect';
import type { AuditoriaAccion, AuditoriaRegistroApi, AuditoriaRegistroView } from '../types/auditoria';
import {
  accionAuditoriaColor,
  accionAuditoriaLabel,
  AUDITORIA_ACCIONES,
  buildTablasAuditoriaOptions,
  describirCambioAuditoria,
  formatFechaAuditoria,
  inicialesUsuario,
  labelTablaAuditoria,
  toIsoFinDia,
  toIsoInicioDia,
} from '../utils/auditoriaFormat';
import { exportAuditoriaExcel } from '../utils/exportAuditoriaExcel';
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Filter,
  ShieldAlert,
  X,
} from 'lucide-react';

function mapRegistroView(registro: AuditoriaRegistroApi): AuditoriaRegistroView {
  const usuario = registro.usuario?.nombre_usuario ?? `Usuario #${registro.id_usuario}`;
  return {
    id: registro.id_auditoria,
    fecha: formatFechaAuditoria(registro.fecha_cambio),
    usuario,
    iniciales: inicialesUsuario(usuario),
    tabla: registro.nombre_tabla,
    tablaLabel: labelTablaAuditoria(registro.nombre_tabla),
    idRegistro: registro.id_registro,
    accion: registro.accion,
    descripcion: describirCambioAuditoria(registro),
    ip: registro.ip_origen ?? '—',
    raw: registro,
  };
}

function parseIdRegistro(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return undefined;
  return Number(trimmed);
}

function buildAuditoriaQuery(input: {
  pagina: number;
  tabla: string;
  usuarioId: string;
  accion: string;
  fechaDesde: string;
  fechaHasta: string;
  idRegistro: string;
}): AuditoriaQuery {
  const query: AuditoriaQuery = {
    page: input.pagina,
    limit: MODULE_PAGE_SIZE,
  };

  if (input.tabla !== 'Todas las tablas') query.nombre_tabla = input.tabla;
  if (input.usuarioId !== 'Todos los usuarios') query.id_usuario = Number(input.usuarioId);
  if (input.accion !== 'Todas las acciones') query.accion = input.accion as AuditoriaAccion;
  if (input.fechaDesde) query.fecha_desde = toIsoInicioDia(input.fechaDesde);
  if (input.fechaHasta) query.fecha_hasta = toIsoFinDia(input.fechaHasta);

  const idRegistro = parseIdRegistro(input.idRegistro);
  if (idRegistro) query.id_registro = idRegistro;

  return query;
}

export default function Auditoria() {
  const { usuario } = useAuth();
  const canAccess = hasAdminAccess(usuario?.rol.nombre_rol);

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [idRegistro, setIdRegistro] = useState('');
  const [usuarioId, setUsuarioId] = useState('Todos los usuarios');
  const [tabla, setTabla] = useState('Todas las tablas');
  const [accion, setAccion] = useState('Todas las acciones');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [detalleId, setDetalleId] = useState<number | string | null>(null);
  const [exportando, setExportando] = useState(false);

  const filtrosQuery = useMemo(
    () => buildAuditoriaQuery({
      pagina,
      tabla,
      usuarioId,
      accion,
      fechaDesde,
      fechaHasta,
      idRegistro,
    }),
    [pagina, tabla, usuarioId, accion, fechaDesde, fechaHasta, idRegistro],
  );

  const auditoriaQuery = useApiQuery(
    () => fetchAuditoria(filtrosQuery),
    [filtrosQuery],
    canAccess,
  );

  const usuariosQuery = useApiQuery(() => fetchAllUsuarios(), [], canAccess);

  const detalleQuery = useApiQuery(
    () => fetchAuditoriaById(detalleId as number | string),
    [detalleId],
    canAccess && detalleId !== null,
  );

  const registros = useMemo(() => {
    const rows = auditoriaQuery.data?.data ?? [];
    const mapped = rows.map(mapRegistroView);
    const q = busqueda.trim().toLowerCase();
    if (!q) return mapped;

    return mapped.filter((reg) =>
      reg.usuario.toLowerCase().includes(q) ||
      reg.descripcion.toLowerCase().includes(q) ||
      reg.tablaLabel.toLowerCase().includes(q) ||
      reg.ip.toLowerCase().includes(q) ||
      String(reg.idRegistro).includes(q),
    );
  }, [auditoriaQuery.data?.data, busqueda]);

  const meta = auditoriaQuery.data?.meta;
  const totalPaginas = meta?.totalPages ?? 1;
  const totalRegistros = meta?.total ?? 0;
  const paginaActual = Math.min(pagina, Math.max(1, totalPaginas));

  const usuariosOptions = useMemo(() => {
    const items = usuariosQuery.data ?? [];
    return [
      { value: 'Todos los usuarios', label: 'Todos los usuarios' },
      ...items.map((item) => ({
        value: String(item.id_usuario),
        label: `${item.nombre_usuario} (${item.rol.nombre_rol})`,
      })),
    ];
  }, [usuariosQuery.data]);

  const tablaOptions = useMemo(() => {
    const fromRows = [...new Set((auditoriaQuery.data?.data ?? []).map((row) => row.nombre_tabla))];
    const nombres = buildTablasAuditoriaOptions(
      fromRows.map((nombre_tabla) => ({ nombre_tabla, total: 0 })),
    );
    return [
      { value: 'Todas las tablas', label: 'Todas las tablas' },
      ...nombres.map((nombre) => ({
        value: nombre,
        label: labelTablaAuditoria(nombre),
      })),
    ];
  }, [auditoriaQuery.data?.data]);

  const accionOptions = useMemo(
    () => [
      { value: 'Todas las acciones', label: 'Todas las acciones' },
      ...AUDITORIA_ACCIONES.map((value) => ({
        value,
        label: accionAuditoriaLabel(value),
      })),
    ],
    [],
  );

  const hayFiltros =
    usuarioId !== 'Todos los usuarios' ||
    tabla !== 'Todas las tablas' ||
    accion !== 'Todas las acciones' ||
    fechaDesde !== '' ||
    fechaHasta !== '' ||
    idRegistro.trim() !== '' ||
    busqueda !== '';

  const limpiarFiltros = () => {
    setBusqueda('');
    setIdRegistro('');
    setUsuarioId('Todos los usuarios');
    setTabla('Todas las tablas');
    setAccion('Todas las acciones');
    setFechaDesde('');
    setFechaHasta('');
    setPagina(1);
  };

  const verHistorialRegistro = (nombreTabla: string, idReg: number | string) => {
    setTabla(nombreTabla);
    setIdRegistro(String(idReg));
    setDetalleId(null);
    setPagina(1);
  };

  const exportarExcel = async () => {
    setExportando(true);
    try {
      const query = buildAuditoriaQuery({
        pagina: 1,
        tabla,
        usuarioId,
        accion,
        fechaDesde,
        fechaHasta,
        idRegistro,
      });

      const rows = await fetchAllPages(
        (page, limit) => fetchAuditoria({ ...query, page, limit }),
        100,
      );

      const exportRows = rows.map(mapRegistroView);
      await exportAuditoriaExcel(exportRows);
      toast.success('Exportación completada', { description: `${exportRows.length} registros descargados` });
    } catch (err) {
      toast.error('No se pudo exportar', {
        description: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setExportando(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-xl border border-amber-200 p-8 text-center max-w-lg mx-auto">
          <ShieldAlert size={40} className="mx-auto text-amber-600 mb-3" />
          <h1 className="text-lg font-bold text-navy-900">Acceso restringido</h1>
          <p className="text-sm text-gray-500 mt-2">
            La auditoría del sistema está disponible solo para perfiles Super Administrador y Administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <span>Sistema</span>
            <ChevronRight size={14} />
            <span className="font-medium text-navy-800">Trazabilidad</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Registro de Auditoría y Trazabilidad</h1>
          <p className="text-sm text-gray-500 mt-1">
            Historial de cambios registrados en el sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={exportarExcel}
          disabled={exportando}
          className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-60 shrink-0"
        >
          <FileSpreadsheet size={16} />
          {exportando ? 'Exportando…' : 'Exportar Excel'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/60">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold text-navy-900 uppercase tracking-wide flex items-center gap-2">
              <Filter size={14} />
              Filtros
            </h2>
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={!hayFiltros}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="sm:col-span-2 xl:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Buscar en página actual</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Usuario, descripción, IP o ID…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500 pr-8"
                />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Usuario</label>
              <SearchableSelect
                value={usuarioId}
                onChange={(value) => { setUsuarioId(value); setPagina(1); }}
                options={usuariosOptions}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tabla</label>
              <SearchableSelect
                value={tabla}
                onChange={(value) => { setTabla(value); setPagina(1); }}
                options={tablaOptions}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Acción</label>
              <SearchableSelect
                value={accion}
                onChange={(value) => { setAccion(value); setPagina(1); }}
                options={accionOptions}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ID registro</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej. 42"
                value={idRegistro}
                onChange={(e) => { setIdRegistro(e.target.value); setPagina(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => { setFechaDesde(e.target.value); setPagina(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => { setFechaHasta(e.target.value); setPagina(1); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              />
            </div>
          </div>

          {hayFiltros && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">Activos:</span>
              {busqueda && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  Búsqueda: {busqueda}
                </span>
              )}
              {usuarioId !== 'Todos los usuarios' && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {usuariosOptions.find((o) => o.value === usuarioId)?.label ?? usuarioId}
                </span>
              )}
              {tabla !== 'Todas las tablas' && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {labelTablaAuditoria(tabla)}
                </span>
              )}
              {accion !== 'Todas las acciones' && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {accionAuditoriaLabel(accion as AuditoriaAccion)}
                </span>
              )}
              {idRegistro && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  ID #{idRegistro}
                </span>
              )}
              {(fechaDesde || fechaHasta) && (
                <span className="bg-navy-100 text-navy-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {fechaDesde || '…'} — {fechaHasta || '…'}
                </span>
              )}
            </div>
          )}
        </div>

        {auditoriaQuery.error && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {auditoriaQuery.error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Fecha / Hora</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Usuario</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Tabla</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Acción</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Descripción</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {auditoriaQuery.loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Cargando registros de auditoría…
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDetalleId(reg.id)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{reg.fecha}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-navy-100 text-navy-800 text-xs font-bold flex items-center justify-center">
                          {reg.iniciales}
                        </span>
                        <span className="text-sm font-medium text-navy-900">{reg.usuario}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                        {reg.tablaLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">#{reg.idRegistro}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${accionAuditoriaColor(reg.accion)}`}>
                        {accionAuditoriaLabel(reg.accion)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={reg.descripcion}>
                      {reg.descripcion}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 text-right font-mono">{reg.ip}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 border-t border-gray-200 gap-2">
          <p className="text-sm text-gray-500">
            {totalRegistros === 0
              ? 'Sin resultados'
              : `Página ${paginaActual} de ${totalPaginas} · ${totalRegistros} registros`}
            {busqueda && ' · búsqueda local en página actual'}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina(Math.max(1, paginaActual - 1))}
              disabled={paginaActual <= 1 || auditoriaQuery.loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600 px-2">{paginaActual}</span>
            <button
              type="button"
              onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
              disabled={paginaActual >= totalPaginas || auditoriaQuery.loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {detalleId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetalleId(null)}>
          <div
            className="bg-white rounded-xl border border-gray-200 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-navy-900">Detalle de auditoría #{detalleId}</h2>
              <button type="button" onClick={() => setDetalleId(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {detalleQuery.loading && <p className="text-gray-500">Cargando detalle…</p>}
              {detalleQuery.error && <p className="text-red-600">{detalleQuery.error}</p>}
              {detalleQuery.data && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <p><span className="text-gray-500">Fecha:</span> {formatFechaAuditoria(detalleQuery.data.fecha_cambio)}</p>
                    <p><span className="text-gray-500">Usuario:</span> {detalleQuery.data.usuario?.nombre_usuario ?? detalleQuery.data.id_usuario}</p>
                    <p><span className="text-gray-500">Tabla:</span> {labelTablaAuditoria(detalleQuery.data.nombre_tabla)}</p>
                    <p><span className="text-gray-500">Registro:</span> #{detalleQuery.data.id_registro}</p>
                    <p><span className="text-gray-500">Acción:</span> {accionAuditoriaLabel(detalleQuery.data.accion)}</p>
                    <p><span className="text-gray-500">IP:</span> {detalleQuery.data.ip_origen ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">User-Agent</p>
                    <p className="bg-gray-50 rounded-lg p-3 text-xs break-all text-gray-700">
                      {detalleQuery.data.user_agent ?? '—'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => verHistorialRegistro(detalleQuery.data!.nombre_tabla, detalleQuery.data!.id_registro)}
                    className="text-sm font-medium text-navy-700 hover:text-navy-900 underline"
                  >
                    Ver historial completo de este registro
                  </button>
                  <div>
                    <p className="text-gray-500 mb-1">Datos previos</p>
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">
                      {JSON.stringify(detalleQuery.data.datos_previos ?? {}, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Datos nuevos</p>
                    <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">
                      {JSON.stringify(detalleQuery.data.datos_nuevos ?? {}, null, 2)}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
