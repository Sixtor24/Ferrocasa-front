import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchBienesEstadisticas } from '../api/services/bienes.service';
import { fetchVehiculosEstadisticas } from '../api/services/vehiculos.service';
import { fetchParcelasEstadisticas } from '../api/services/parcelas.service';
import { useApiQuery } from '../hooks/useApiQuery';
import {
  dashboardStats,
  movimientosAlmacen,
  ultimaAuditoria,
} from '../data/dashboard';
import {
  Package, Building2, Landmark, Truck, Map, FileText, Shield,
  RefreshCw, Clock, ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const periodos = ['Esta semana', 'Este mes', 'Último trimestre'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(0);

  const statsQuery = useApiQuery(
    async () => {
      const [bienesResult, vehiculosResult, parcelasResult] = await Promise.allSettled([
        fetchBienesEstadisticas(),
        fetchVehiculosEstadisticas(),
        fetchParcelasEstadisticas(),
      ]);
      return {
        bienes: bienesResult.status === 'fulfilled' ? bienesResult.value : null,
        vehiculos: vehiculosResult.status === 'fulfilled' ? vehiculosResult.value : null,
        parcelas: parcelasResult.status === 'fulfilled' ? parcelasResult.value : null,
      };
    },
    [],
  );

  const liveStats = statsQuery.data;
  const totalBienes = liveStats?.bienes?.total ?? 0;
  const totalVehiculos = liveStats?.vehiculos?.total ?? 0;
  const totalParcelas = liveStats?.parcelas?.total ?? 0;
  const totalCementerio = totalParcelas;
  const parcelasDisponibles = liveStats?.parcelas?.disponibles ?? 0;
  const parcelasComprometidas = liveStats?.parcelas?.comprometidas ?? 0;
  const parcelasDesincorporadas = liveStats?.parcelas?.desincorporadas ?? 0;
  const bienesEnUso = liveStats?.bienes?.porEstadoUso.find((item) => item.estado_uso === 'En_Uso')?._count ?? 0;
  const bienesRegulares = liveStats?.bienes?.porCondicionFisica.find((item) => item.condicion_fisica === 'Regular')?._count ?? 0;
  const bienesDanados = liveStats?.bienes?.porCondicionFisica
    .filter((item) => ['Dañado', 'Averiado', 'Inservible'].includes(item.condicion_fisica))
    .reduce((sum, item) => sum + item._count, 0) ?? 0;
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

  const factorPeriodo = periodo === 0 ? 1 : periodo === 1 ? 2.5 : 6;
  const chartData = movimientosAlmacen.map((d) => ({
    ...d,
    entradas: Math.round(d.entradas * factorPeriodo),
    salidas: Math.round(d.salidas * factorPeriodo),
  }));

  const donutData = [
    { name: 'Áreas disponibles', value: parcelasDisponibles },
    { name: 'Áreas comprometidas', value: parcelasComprometidas },
    { name: 'Áreas desincorporadas', value: parcelasDesincorporadas },
  ];
  const distribucionActivosLive = [
    { name: 'Bienes Administrativos', value: totalBienes, color: '#102a43' },
    { name: 'Parcelas de Cementerio', value: totalCementerio, color: '#334e68' },
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
        <StatCard icon={<Landmark size={22} className="text-blue-600" />} label="Parcelas de Cementerio"
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
              <p className="text-sm text-gray-500">Altas y bajas de activos — {periodos[periodo]}</p>
            </div>
            <select value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500">
              {periodos.map((p, i) => <option key={p} value={i}>{p}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="entradas" fill="#102a43" radius={[4, 4, 0, 0]} name="Altas" />
              <Bar dataKey="salidas" fill="#bcccdc" radius={[4, 4, 0, 0]} name="Bajas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut: Inmuebles */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/almacen/inmuebles')}>
          <h3 className="text-lg font-semibold text-navy-900">Inmuebles por Estado</h3>
          <p className="text-sm text-gray-500 mb-4">Distribución de {totalParcelas} parcelas</p>
          <div className="flex justify-center">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                    {donutData.map((_entry, index) => <Cell key={index} fill={DONUT_COLORS[index]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-navy-900">
                    {totalParcelas > 0 ? Math.round((parcelasDisponibles / totalParcelas) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 uppercase">Disponible</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {donutData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />{d.name}</div>
                <span className="font-semibold text-navy-900">{d.value}</span>
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
