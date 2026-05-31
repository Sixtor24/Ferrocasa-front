import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchBienesAdministrativos, fetchBienesCementerio } from '../api/services/bienes-sedes.service';
import { fetchVehiculosEstadisticas } from '../api/services/vehiculos.service';
import { fetchParcelasEstadisticas } from '../api/services/parcelas.service';
import { useApiQuery } from '../hooks/useApiQuery';
import {
  dashboardStats,
  ultimaAuditoria,
} from '../data/dashboard';
import {
  Package, Building2, Landmark, Truck, Map, FileText, Shield,
  RefreshCw, Clock, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import {
  DIAS_SEMANA,
  MESES_CALENDARIO,
  MESES_CORTOS,
  febreroEnBisiesto,
  getSemanasDelMes,
} from '../utils/calendar';

const periodos = [
  { key: 'semanal', label: 'Semanal' },
  { key: 'mensual', label: 'Mensual' },
  { key: 'anual', label: 'Anual' },
] as const;

type PeriodoMovimiento = (typeof periodos)[number]['key'];

type MovimientoChartPoint = {
  periodo: string;
  altas: number;
  bajas: number;
  detalle?: string;
};

function buildPuntosSemana(
  dias: { dia: number; etiqueta: string }[],
  year: number,
  baseSeed: number,
): MovimientoChartPoint[] {
  return dias.map((item, index) => {
    const seed = year % 100 + baseSeed + item.dia + index;
    const altas = 35 + ((seed * 11) % 55);
    return {
      periodo: item.etiqueta,
      altas,
      bajas: 100 - altas,
      detalle: `Día ${item.dia}`,
    };
  });
}

function buildMovimientosPatrimoniales(
  periodo: PeriodoMovimiento,
  year: number,
  monthIndex: number,
  semanaMes: number,
): MovimientoChartPoint[] {
  if (periodo === 'semanal') {
    return buildPuntosSemana(
      DIAS_SEMANA.map((etiqueta, index) => ({ dia: index + 1, etiqueta })),
      year,
      0,
    );
  }

  if (periodo === 'mensual') {
    const semanas = getSemanasDelMes(year, monthIndex);
    const semana = semanas[semanaMes] ?? semanas[0];
    if (!semana) return [];
    return buildPuntosSemana(semana.dias, year, monthIndex * 10 + semana.index);
  }

  return MESES_CORTOS.map((label, index) => {
    const seed = year % 100 + index + 7;
    const altas = 35 + ((seed * 11) % 55);
    return {
      periodo: label,
      altas,
      bajas: 100 - altas,
    };
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [periodo, setPeriodo] = useState<PeriodoMovimiento>('semanal');
  const [year, setYear] = useState(currentYear);
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [semanaMes, setSemanaMes] = useState(0);
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

  const statsQuery = useApiQuery(
    async () => {
      const [bienesResult, cementerioResult, vehiculosResult, parcelasResult] = await Promise.allSettled([
        fetchBienesAdministrativos({ page: 1, limit: 5000 }),
        fetchBienesCementerio({ page: 1, limit: 5000 }),
        fetchVehiculosEstadisticas(),
        fetchParcelasEstadisticas(),
      ]);
      return {
        bienes: bienesResult.status === 'fulfilled' ? bienesResult.value : null,
        cementerio: cementerioResult.status === 'fulfilled' ? cementerioResult.value : null,
        vehiculos: vehiculosResult.status === 'fulfilled' ? vehiculosResult.value : null,
        parcelas: parcelasResult.status === 'fulfilled' ? parcelasResult.value : null,
      };
    },
    [],
  );

  const liveStats = statsQuery.data;
  const bienesAdministrativos = liveStats?.bienes?.all ?? [];
  const bienesCementerio = liveStats?.cementerio?.all ?? [];
  const totalBienes = liveStats?.bienes?.meta.total ?? bienesAdministrativos.length;
  const totalVehiculos = liveStats?.vehiculos?.total ?? 0;
  const totalParcelas = liveStats?.parcelas?.total ?? 0;
  const totalCementerio = liveStats?.cementerio?.meta.total ?? bienesCementerio.length;
  const parcelasDisponibles = liveStats?.parcelas?.disponibles ?? 0;
  const parcelasComprometidas = liveStats?.parcelas?.comprometidas ?? 0;
  const parcelasDesincorporadas = liveStats?.parcelas?.desincorporadas ?? 0;
  const bienesEnUso = bienesAdministrativos.filter((bien) => bien.estadoUso === 'En uso').length;
  const bienesRegulares = bienesAdministrativos.filter((bien) => bien.condicionFisica === 'Regular').length;
  const bienesDanados = bienesAdministrativos.filter((bien) =>
    ['Dañado', 'Averiado', 'Inservible'].includes(bien.condicionFisica)
  ).length;
  const vehiculosActivos = liveStats?.vehiculos?.disponibles ?? liveStats?.vehiculos?.asignados ?? 0;

  const now = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });

  const accionesRapidas = [
    { nombre: 'Bienes Admin.', icon: Package, ruta: '/almacen' },
    { nombre: 'Inmuebles', icon: Building2, ruta: '/almacen/inmuebles' },
    { nombre: 'Cementerio', icon: Landmark, ruta: '/cementerio' },
    { nombre: 'Terrenos', icon: Map, ruta: '/terrenos' },
    { nombre: 'Vehículos', icon: Truck, ruta: '/vehiculos' },
    { nombre: 'Reportes', icon: FileText, ruta: '/reportes' },
    { nombre: 'Auditoría', icon: Shield, ruta: '/auditoria' },
  ];

  const chartData = useMemo(
    () => buildMovimientosPatrimoniales(periodo, year, mes, semanaMes),
    [periodo, year, mes, semanaMes],
  );
  const movimientoPromedios = useMemo(() => {
    const totalAltas = chartData.reduce((sum, item) => sum + item.altas, 0);
    const totalBajas = chartData.reduce((sum, item) => sum + item.bajas, 0);
    const total = totalAltas + totalBajas;
    return {
      altas: total > 0 ? Math.round((totalAltas / total) * 100) : 0,
      bajas: total > 0 ? Math.round((totalBajas / total) * 100) : 0,
    };
  }, [chartData]);
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
    const total = donutData.reduce((sum, item) => sum + item.value, 0);
    return donutData.map((item) => ({
      ...item,
      porcentaje: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [parcelasDisponibles, parcelasComprometidas, parcelasDesincorporadas]);
  const porcentajeDisponible = donutDataConPorcentaje[0]?.porcentaje ?? 0;
  const distribucionActivosLive = [
    { name: 'Bienes en Edificio Administrativo', value: totalBienes, color: '#102a43' },
    { name: 'Cementerio', value: totalCementerio, color: '#334e68' },
    { name: 'Parcelas', value: totalParcelas, color: '#627d98' },
    { name: 'Vehículos', value: totalVehiculos, color: '#9fb3c8' },
  ];
  const DONUT_COLORS = ['#22c55e', '#102a43', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome */}
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

      {/* Audit ticker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RefreshCw size={18} className="text-navy-600 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
          <span className="text-sm font-medium text-navy-900 shrink-0">Auditoría:</span>
          <span className="text-sm text-gray-600 truncate">{ultimaAuditoria.mensaje} - <strong>{ultimaAuditoria.hora}</strong></span>
        </div>
        <button onClick={() => navigate('/auditoria')} className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800 shrink-0">
          Ver registro <ChevronRight size={16} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package size={22} className="text-navy-600" />} label={dashboardStats.totalBienesMuebles.label}
          value={totalBienes.toLocaleString()}
          badge={statsQuery.loading ? <span className="text-gray-400 text-xs">...</span> : undefined}
          onClick={() => navigate('/almacen')} />
        <StatCard icon={<Landmark size={22} className="text-blue-600" />} label="Cementerio"
          value={totalCementerio.toLocaleString()}
          badge={statsQuery.loading ? <span className="text-gray-400 text-xs">...</span> : undefined}
          onClick={() => navigate('/cementerio')} />
        <StatCard icon={<Building2 size={22} className="text-navy-600" />} label={dashboardStats.totalInmuebles.label}
          value={totalParcelas.toString()}
          badge={<span className="text-navy-500 text-xs font-medium">{parcelasDisponibles} disponibles</span>}
          onClick={() => navigate('/almacen/inmuebles')} />
        <StatCard icon={<Truck size={22} className="text-amber-600" />} label={dashboardStats.totalVehiculos.label}
          value={totalVehiculos.toString()}
          badge={<span className="text-green-500 text-xs font-medium">{vehiculosActivos} activos</span>}
          onClick={() => navigate('/vehiculos')} />
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Bienes en uso', value: bienesEnUso, color: 'text-green-700' },
          { label: 'Bienes regulares', value: bienesRegulares, color: 'text-amber-700' },
          { label: 'Bienes dañados', value: bienesDanados, color: 'text-red-600' },
          { label: 'Parcelas libres', value: parcelasDisponibles, color: 'text-green-700' },
          { label: 'Parcelas comprometidas', value: parcelasComprometidas, color: 'text-navy-800' },
          { label: 'Parcelas desincorporadas', value: parcelasDesincorporadas, color: 'text-amber-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-navy-900">Movimientos Patrimoniales</h3>
              <p className="text-sm text-gray-500">Altas y bajas de activos — {periodoDescripcion}</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as PeriodoMovimiento)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {periodos.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
              >
                {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              {periodo === 'mensual' && (
                <>
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                    aria-label="Mes"
                  >
                    {MESES_CALENDARIO.map((nombre, index) => (
                      <option key={nombre} value={index}>
                        {nombre}
                        {index === 1 && febreroEnBisiesto(year, index) ? ' (29 días)' : ''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={semanaMes}
                    onChange={(e) => setSemanaMes(Number(e.target.value))}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
                    aria-label="Semana del mes"
                  >
                    {semanasDelMes.map((semana) => (
                      <option key={semana.index} value={semana.index}>
                        {semana.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="periodo" axisLine={false} tickLine={false} interval={0} />
              <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value) => `${value}%`}
                labelFormatter={(_label, payload) => {
                  const detalle = payload?.[0]?.payload?.detalle;
                  return detalle ? `${_label} · ${detalle}` : String(_label);
                }}
              />
              <Bar dataKey="altas" fill="#102a43" radius={[4, 4, 0, 0]} name="Altas">
                <LabelList dataKey="altas" position="top" formatter={(value) => `${value ?? 0}%`} className="text-[10px] fill-navy-700" />
              </Bar>
              <Bar dataKey="bajas" fill="#bcccdc" radius={[4, 4, 0, 0]} name="Bajas">
                <LabelList dataKey="bajas" position="top" formatter={(value) => `${value ?? 0}%`} className="text-[10px] fill-gray-500" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-navy-50 px-3 py-2">
              <p className="text-gray-500">Altas del periodo</p>
              <p className="text-lg font-bold text-navy-900">{movimientoPromedios.altas}%</p>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-gray-500">Bajas del periodo</p>
              <p className="text-lg font-bold text-gray-700">{movimientoPromedios.bajas}%</p>
            </div>
          </div>
        </div>

        {/* Donut: Inmuebles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/almacen/inmuebles')}>
          <h3 className="text-lg font-semibold text-navy-900">Inmuebles por Estado</h3>
          <p className="text-sm text-gray-500 mb-4">Distribución de {totalParcelas} parcelas</p>
          <div className="flex justify-center">
            <div className="relative w-[180px] h-[180px]">
              <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                  <p className="text-2xl font-bold leading-none text-navy-900">{porcentajeDisponible}%</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Disponible</p>
                </div>
              </div>
              <div className="relative z-10 h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {donutData.map((_entry, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      wrapperStyle={{ zIndex: 50 }}
                      contentStyle={{ zIndex: 50 }}
                      formatter={(value, name) => {
                        const num = Number(value ?? 0);
                        const item = donutDataConPorcentaje.find((row) => row.name === String(name));
                        const pct = item?.porcentaje ?? 0;
                        return [`${pct}% (${num} parcelas)`, String(name ?? '')];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {donutDataConPorcentaje.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i] }} />
                  <span>{d.name}</span>
                </div>
                <span className="font-semibold text-navy-900 tabular-nums">
                  {d.porcentaje}%
                  <span className="ml-1 text-xs font-normal text-gray-400">({d.value})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Asset distribution */}
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

        {/* Quick Actions */}
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
