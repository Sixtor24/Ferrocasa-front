import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pathToModule } from '../constants/rolePermissions';
import { useRolePermissions } from '../hooks/useRolePermissions';
import {
  fetchDashboardActividadReciente,
  fetchDashboardAlertas,
  fetchDashboardGraficos,
  fetchDashboardStats,
} from '../api/services/dashboard.service';
import { fetchParcelasEstadisticas } from '../api/services/parcelas.service';
import { useApiQuery } from '../hooks/useApiQuery';
import SearchableSelect from '../components/forms/SearchableSelect';
import { dashboardStats } from '../data/dashboard';
import {
  buildMovimientosFromGraficos,
  findAlertaCantidad,
  findSerieValor,
  formatActividadHora,
  formatActividadMensaje,
  repartirParcelasEstado,
} from '../utils/dashboardFormat';
import {
  Package, Building2, Landmark, Truck, Map, FileText, Shield,
  RefreshCw, Clock, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import {
  MESES_CALENDARIO,
  febreroEnBisiesto,
  getSemanasDelMes,
} from '../utils/calendar';

const periodos = [
  { key: 'semanal', label: 'Semanal' },
  { key: 'mensual', label: 'Mensual' },
  { key: 'anual', label: 'Anual' },
] as const;

type PeriodoMovimiento = (typeof periodos)[number]['key'];

export default function Dashboard() {
  const { user } = useAuth();
  const { canAccessModule, canAccessAuditoria } = useRolePermissions();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [periodo, setPeriodo] = useState<PeriodoMovimiento>('semanal');
  const [year, setYear] = useState(currentYear);
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [semanaMes, setSemanaMes] = useState(0);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | undefined>(undefined);
  const yearOptions = useMemo(() => Array.from({ length: 6 }, (_, index) => currentYear - index), [currentYear]);

  const semanasDelMes = useMemo(() => getSemanasDelMes(year, mes), [year, mes]);

  useEffect(() => {
    setSemanaMes(0);
  }, [mes, year, periodo]);

  useEffect(() => {
    if (semanaMes >= semanasDelMes.length) {
      setSemanaMes(0);
    }
  }, [semanaMes, semanasDelMes.length]);

  const statsQuery = useApiQuery(() => fetchDashboardStats(), []);
  const parcelasStatsQuery = useApiQuery(() => fetchParcelasEstadisticas(), []);
  const actividadQuery = useApiQuery(() => fetchDashboardActividadReciente(1), []);
  const alertasQuery = useApiQuery(() => fetchDashboardAlertas(), []);
  const graficosQuery = useApiQuery(() => fetchDashboardGraficos(year), [year]);

  const stats = statsQuery.data;
  const inventario = stats?.inventario;
  const indicadores = stats?.indicadores;
  const alertas = alertasQuery.data?.data ?? [];
  const ultimaActividad = actividadQuery.data?.data[0];
  const graficos = graficosQuery.data;

  const totalBienes = inventario?.bienes ?? 0;
  const totalVehiculos = inventario?.vehiculos ?? 0;
  const totalParcelas = parcelasStatsQuery.data?.total ?? inventario?.parcelas ?? 0;
  const totalCementerio = findSerieValor(graficos?.bienes_por_almacen, 'cementerio');

  const parcelasEstado = useMemo(() => {
    const parcelasApi = parcelasStatsQuery.data;
    if (parcelasApi) {
      return repartirParcelasEstado({
        total: parcelasApi.total,
        disponibles: parcelasApi.disponibles,
        comprometidas: parcelasApi.comprometidas,
        desincorporadas: parcelasApi.desincorporadas,
      });
    }
    return repartirParcelasEstado({
      total: totalParcelas,
      disponibles: indicadores?.parcelas_disponibles ?? 0,
      comprometidas: findAlertaCantidad(alertas, 'PARCELAS_COMPROMETIDAS', 'COMPROMETID'),
      desincorporadas: findAlertaCantidad(alertas, 'PARCELAS_DESINCORPORADAS', 'DESINCORPORAD'),
    });
  }, [parcelasStatsQuery.data, totalParcelas, indicadores?.parcelas_disponibles, alertas]);

  const parcelasDisponibles = parcelasEstado.disponibles;
  const parcelasComprometidas = parcelasEstado.comprometidas;
  const parcelasDesincorporadas = parcelasEstado.desincorporadas;

  const bienesEnUso = indicadores?.bienes_almacenados ?? 0;
  const bienesEnObsolescencia = 0;
  const bienesObsoletos = findAlertaCantidad(alertas, 'BIENES_DADOS_DE_BAJA', 'BIENES_DADOS_BAJA', 'DADOS_BAJA', 'OBSOLETO');

  const loadingKpis = statsQuery.loading;

  const now = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });

  const accionesRapidas = useMemo(() => {
    const items = [
      { nombre: 'Bienes Admin.', icon: Package, ruta: '/almacen' },
      { nombre: 'Bienes en Cementerio', icon: Landmark, ruta: '/cementerio' },
      { nombre: 'Terrenos', icon: Map, ruta: '/terrenos' },
      { nombre: 'Vehículos y Maquinarias', icon: Truck, ruta: '/vehiculos' },
      { nombre: 'Reportes', icon: FileText, ruta: '/reportes' },
      { nombre: 'Auditoría', icon: Shield, ruta: '/auditoria' },
    ];
    return items.filter((item) => {
      const module = pathToModule(item.ruta);
      return module ? canAccessModule(module) : true;
    });
  }, [canAccessModule]);

  const chartData = useMemo(
    () => buildMovimientosFromGraficos({
      periodo,
      year,
      mes,
      semanaMes,
      semanasDelMes,
      graficos,
    }),
    [periodo, year, mes, semanaMes, semanasDelMes, graficos],
  );

  const movimientoTotales = useMemo(() => ({
    cambios: chartData.reduce((sum, item) => sum + item.altas, 0),
    diasActivos: chartData.filter((item) => item.altas > 0).length,
  }), [chartData]);

  const periodoLabel = periodos.find((item) => item.key === periodo)?.label ?? 'Semanal';
  const periodoDescripcion = useMemo(() => {
    if (periodo === 'semanal') {
      return `${periodoLabel} ${year} · Lunes a domingo (7 días)`;
    }
    if (periodo === 'mensual') {
      const semana = semanasDelMes[semanaMes] ?? semanasDelMes[0];
      const bisiesto = febreroEnBisiesto(year, mes) ? ' · año bisiesto' : '';
      const rango = semana ? ` · ${semana.label}` : '';
      const bloque = semana ? ` · ${semana.dias.length} días (de 7 en 7)` : '';
      return `${MESES_CALENDARIO[mes]} ${year}${rango}${bloque}${bisiesto}`;
    }
    return `${periodoLabel} ${year}`;
  }, [periodo, periodoLabel, year, mes, semanasDelMes, semanaMes]);

  const donutData = [
    { name: 'Áreas disponibles', value: parcelasDisponibles },
    { name: 'Áreas comprometidas', value: parcelasComprometidas },
    { name: 'Áreas desincorporadas', value: parcelasDesincorporadas },
  ];

  const donutDataConPorcentaje = useMemo(() => {
    const total = totalParcelas > 0 ? totalParcelas : donutData.reduce((sum, item) => sum + item.value, 0);
    return donutData.map((item) => ({
      ...item,
      porcentaje: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [parcelasDisponibles, parcelasComprometidas, parcelasDesincorporadas, totalParcelas]);

  const porcentajeDisponible = totalParcelas > 0
    ? Math.round((parcelasDisponibles / totalParcelas) * 100)
    : 0;

  const distribucionActivosLive = [
    { name: dashboardStats.totalBienesMuebles.label, value: totalBienes, color: '#102a43' },
    { name: dashboardStats.inventarioCementerio.label, value: totalCementerio, color: '#334e68' },
    { name: dashboardStats.totalInmuebles.label, value: totalParcelas, color: '#627d98' },
    { name: dashboardStats.totalVehiculos.label, value: totalVehiculos, color: '#9fb3c8' },
  ];

  const DONUT_COLORS = ['#22c55e', '#102a43', '#f59e0b', '#ef4444', '#8b5cf6'];

  const tickerMensaje = useMemo(() => {
    if (actividadQuery.loading) return 'Cargando…';
    if (ultimaActividad) {
      return (
        <>
          {formatActividadMensaje(ultimaActividad)} - <strong>{formatActividadHora(ultimaActividad.fecha_cambio)}</strong>
        </>
      );
    }
    const alertaCritica = alertas.find((item) => item.tipo === 'danger') ?? alertas[0];
    if (alertaCritica) {
      return (
        <>
          {alertaCritica.titulo}: {alertaCritica.mensaje}
          {alertaCritica.cantidad > 0 ? ` (${alertaCritica.cantidad})` : ''}
        </>
      );
    }
    return 'Sin cambios recientes registrados';
  }, [actividadQuery.loading, ultimaActividad, alertas]);

  const chartLoading = graficosQuery.loading;
  const donutVacio = totalParcelas === 0;

  return (
    <div className="p-4 md:p-6 space-y-6 min-w-0 overflow-x-hidden">
      <div className="bg-navy-900 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-full h-full bg-linear-to-l from-white/20 to-transparent" />
        </div>
        <h2 className="text-lg font-semibold">Bienvenido, {user?.nombre}</h2>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="bg-white/20 border border-white/30 text-sm px-3 py-1 rounded-full">Rol: {user?.rol}</span>
          <span className="flex items-center gap-1 text-sm text-white/70"><Clock size={14} />{now}</span>
        </div>
        <p className="text-sm text-white/60 mt-3">Sistema integral de gestión patrimonial — Ferrocasa</p>
      </div>

      {canAccessAuditoria && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <RefreshCw size={18} className="text-navy-600 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
            <span className="text-sm font-medium text-navy-900 shrink-0">Auditoría:</span>
            <span className="text-sm text-gray-600 truncate">{tickerMensaje}</span>
          </div>
          <button onClick={() => navigate('/auditoria')} className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800 shrink-0">
            Ver registro <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package size={22} className="text-navy-600" />} label={dashboardStats.totalBienesMuebles.label}
          value={totalBienes.toLocaleString()}
          badge={loadingKpis ? <span className="text-gray-400 text-xs">...</span> : undefined}
          onClick={() => navigate('/almacen')} />
        <StatCard icon={<Landmark size={22} className="text-blue-600" />} label={dashboardStats.inventarioCementerio.label}
          value={totalCementerio.toLocaleString()}
          badge={loadingKpis ? <span className="text-gray-400 text-xs">...</span> : undefined}
          onClick={() => navigate('/cementerio')} />
        <StatCard icon={<Building2 size={22} className="text-navy-600" />} label={dashboardStats.totalInmuebles.label}
          value={totalParcelas.toString()}
          badge={loadingKpis ? <span className="text-gray-400 text-xs">...</span> : undefined}
          onClick={() => navigate('/terrenos')} />
        <StatCard icon={<Truck size={22} className="text-amber-600" />} label={dashboardStats.totalVehiculos.label}
          value={totalVehiculos.toString()}
          badge={loadingKpis ? <span className="text-gray-400 text-xs">...</span> : undefined}
          onClick={() => navigate('/vehiculos')} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Bienes en uso', value: bienesEnUso, color: 'text-green-700' },
          { label: 'Bienes en obsolescencia', value: bienesEnObsolescencia, color: 'text-amber-700' },
          { label: 'Bienes obsoletos', value: bienesObsoletos, color: 'text-red-600' },
          { label: 'Parcelas libres', value: parcelasDisponibles, color: 'text-green-700' },
          { label: 'Parcelas parcialmente ocupadas', value: parcelasComprometidas, color: 'text-navy-800' },
          { label: 'Parcelas ocupadas', value: parcelasDesincorporadas, color: 'text-amber-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-xl font-bold ${item.color}`}>{loadingKpis && alertasQuery.loading ? '…' : item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-navy-900">Movimientos Patrimoniales</h3>
              <p className="text-sm text-gray-500">Altas y bajas de activos — {periodoDescripcion}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SearchableSelect
                value={periodo}
                onChange={(value) => setPeriodo(value as PeriodoMovimiento)}
                options={periodos.map((p) => ({ value: p.key, label: p.label }))}
                className="w-36"
              />
              <SearchableSelect
                value={String(year)}
                onChange={(value) => setYear(Number(value))}
                options={yearOptions.map(String)}
                className="w-28"
              />
              {periodo === 'mensual' && (
                <>
                  <SearchableSelect
                    value={String(mes)}
                    onChange={(value) => setMes(Number(value))}
                    options={MESES_CALENDARIO.map((nombre, index) => ({
                      value: String(index),
                      label: `${nombre}${index === 1 && febreroEnBisiesto(year, index) ? ' (29 días)' : ''}`,
                    }))}
                    className="w-44"
                    aria-label="Mes"
                  />
                  <SearchableSelect
                    value={String(semanaMes)}
                    onChange={(value) => setSemanaMes(Number(value))}
                    options={semanasDelMes.map((semana) => ({
                      value: String(semana.index),
                      label: semana.label,
                    }))}
                    className="w-44"
                    aria-label="Semana del mes"
                  />
                </>
              )}
            </div>
          </div>
          <div className="h-[250px] w-full min-w-0 relative overflow-hidden">
            {chartLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Cargando gráfico…</div>
            ) : chartData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Sin datos para el periodo seleccionado</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodo" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                  <Tooltip
                    cursor={{ fill: 'rgba(16, 42, 67, 0.06)' }}
                    wrapperStyle={{ zIndex: 20, maxWidth: 240 }}
                    formatter={(value, name) => [`${value ?? 0}`, String(name ?? '')]}
                    labelFormatter={(_label, payload) => {
                      const detalle = payload?.[0]?.payload?.detalle;
                      return detalle ? `${_label} · ${detalle}` : String(_label);
                    }}
                  />
                  <Bar dataKey="altas" fill="#102a43" radius={[4, 4, 0, 0]} name={periodo === 'anual' ? 'Protocolos' : 'Cambios'}>
                    <LabelList dataKey="altas" position="top" className="text-[10px] fill-navy-700" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-navy-50 px-3 py-2">
              <p className="text-gray-500">{periodo === 'anual' ? 'Protocolos del año' : 'Cambios del periodo'}</p>
              <p className="text-lg font-bold text-navy-900">{movimientoTotales.cambios}</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-gray-500">Días con actividad</p>
              <p className="text-lg font-bold text-gray-700">{movimientoTotales.diasActivos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 min-w-0 overflow-hidden hover:shadow-md transition-shadow">
          <button
            type="button"
            onClick={() => navigate('/terrenos')}
            className="text-left w-full group"
          >
            <h3 className="text-lg font-semibold text-navy-900 group-hover:text-navy-700">Inmuebles por Estado</h3>
            <p className="text-sm text-gray-500 mb-4">Distribución de {totalParcelas} parcelas</p>
          </button>
          <div
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-full max-w-[200px]">
              <div className="relative mx-auto h-[180px] w-[180px]">
                {donutVacio ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 text-center px-4">Sin datos de estado</div>
                ) : (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                        <p className="text-2xl font-bold leading-none text-navy-900">{porcentajeDisponible}%</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 text-center leading-tight px-1">Disponible</p>
                      </div>
                    </div>
                    {activeDonutIndex !== undefined && donutDataConPorcentaje[activeDonutIndex] && (
                      <div
                        className="pointer-events-none absolute left-1/2 top-1 z-30 w-[calc(100%-8px)] max-w-[168px] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs shadow-md"
                        role="tooltip"
                      >
                        <p className="font-semibold text-navy-900 truncate">
                          {donutDataConPorcentaje[activeDonutIndex].name}
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          {donutDataConPorcentaje[activeDonutIndex].porcentaje}%
                          {' '}
                          ({donutDataConPorcentaje[activeDonutIndex].value} parcelas)
                        </p>
                      </div>
                    )}
                    <div className="relative z-10 h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={54}
                            outerRadius={72}
                            dataKey="value"
                            nameKey="name"
                            startAngle={90}
                            endAngle={-270}
                            stroke="#fff"
                            strokeWidth={2}
                            activeIndex={activeDonutIndex}
                            onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                            onMouseLeave={() => setActiveDonutIndex(undefined)}
                          >
                            {donutData.map((_entry, index) => (
                              <Cell
                                key={index}
                                fill={DONUT_COLORS[index]}
                                opacity={activeDonutIndex === undefined || activeDonutIndex === index ? 1 : 0.5}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {donutDataConPorcentaje.map((d, i) => (
                <div
                  key={d.name}
                  className={`flex items-center justify-between text-sm rounded-lg px-2 py-1.5 transition-colors ${
                    activeDonutIndex === i ? 'bg-gray-50' : ''
                  }`}
                  onMouseEnter={() => setActiveDonutIndex(i)}
                  onMouseLeave={() => setActiveDonutIndex(undefined)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i] }} />
                    <span className="truncate">{d.name}</span>
                  </div>
                  <span className="font-semibold text-navy-900 tabular-nums shrink-0 ml-2">
                    {d.porcentaje}%
                    <span className="ml-1 text-xs font-normal text-gray-400">({d.value})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/terrenos')}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800"
          >
            Ver terrenos <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Distribución de Activos</h3>
          <div className="space-y-3">
            {distribucionActivosLive.map((item) => {
              const total = distribucionActivosLive.reduce((s, d) => s + d.value, 0);
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{item.name}</span>
                    <span className="text-navy-900 font-bold">{item.value.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Acceso Rápido</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {accionesRapidas.map((accion) => (
              <button key={accion.nombre} onClick={() => navigate(accion.ruta)}
                className="border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-navy-300 transition-all">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center"><accion.icon size={20} className="text-navy-700" /></div>
                <span className="text-xs font-medium text-navy-900 text-center">{accion.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, badge, borderColor = 'border-gray-200', onClick }: {
  icon: React.ReactNode; label: string; value: string; badge?: React.ReactNode; borderColor?: string; onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border ${borderColor} p-5 cursor-pointer shadow-sm hover:shadow-md hover:border-navy-200 hover:-translate-y-0.5 transition-all duration-200`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center">{icon}</div>
        {badge}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
