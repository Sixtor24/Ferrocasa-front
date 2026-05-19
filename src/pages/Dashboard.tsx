import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  dashboardStats,
  movimientosAlmacen,
  estatusInmuebles,
  ultimaAuditoria,
} from '../data/dashboard';
import {
  Package,
  AlertTriangle,
  Building2,
  RefreshCw,
  Clock,
  ChevronRight,
  LogIn,
  LogOut,
  Tag,
  Smile,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const DONUT_COLORS = ['#102a43', '#bcccdc'];

const periodos = ['Esta semana', 'Este mes', 'Último trimestre'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(0);

  const now = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const accionesRapidas = [
    { nombre: 'Registrar Entrada', icon: LogIn, ruta: '/almacen' },
    { nombre: 'Registrar Salida', icon: LogOut, ruta: '/almacen' },
    { nombre: 'Venta Inmueble', icon: Tag, ruta: '/almacen/inmuebles' },
    { nombre: 'Reportes Mensuales', icon: Smile, ruta: '/reportes' },
  ];

  const factorPeriodo = periodo === 0 ? 1 : periodo === 1 ? 2.5 : 6;
  const chartData = movimientosAlmacen.map((d) => ({
    ...d,
    entradas: Math.round(d.entradas * factorPeriodo),
    salidas: Math.round(d.salidas * factorPeriodo),
  }));

  const donutData = [
    { name: 'Vendido', value: estatusInmuebles.vendido },
    { name: 'Disponible', value: estatusInmuebles.disponible },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-navy-900 rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-full h-full bg-linear-to-l from-white/20 to-transparent" />
        </div>
        <h2 className="text-lg font-semibold">
          Bienvenido, {user?.nombre}
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <span className="bg-white/20 border border-white/30 text-sm px-3 py-1 rounded-full">
            Rol: {user?.rol}
          </span>
          <span className="flex items-center gap-1 text-sm text-white/70">
            <Clock size={14} />
            {now}
          </span>
        </div>
      </div>

      {/* Audit ticker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RefreshCw size={18} className="text-navy-600 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
          <span className="text-sm font-medium text-navy-900 shrink-0">Auditoría:</span>
          <span className="text-sm text-gray-600 truncate">
            {ultimaAuditoria.mensaje} - <strong>{ultimaAuditoria.hora}</strong>
          </span>
        </div>
        <button
          onClick={() => navigate('/auditoria')}
          className="flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-navy-800 shrink-0"
        >
          Ver registro <ChevronRight size={16} />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={24} className="text-navy-600" />}
          label="Total Bienes"
          value={dashboardStats.totalBienes.valor.toLocaleString()}
          badge={<span className="text-green-500 text-xs font-medium">{dashboardStats.totalBienes.cambio}</span>}
          onClick={() => navigate('/almacen')}
        />
        <StatCard
          icon={<AlertTriangle size={24} className="text-amber-500" />}
          label="Stock Bajo"
          value={dashboardStats.stockBajo.valor.toString()}
          badge={<span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">URGENTE</span>}
          borderColor="border-amber-300"
          onClick={() => navigate('/almacen')}
        />
        <StatCard
          icon={<Building2 size={24} className="text-navy-600" />}
          label="Parcelas Disponibles"
          value={dashboardStats.parcelasDisponibles.valor.toString()}
          badge={<span className="text-navy-600 text-xs font-medium">Actualizado</span>}
          onClick={() => navigate('/almacen/proyectos')}
        />
        <StatCard
          icon={<RefreshCw size={24} className="text-amber-500" />}
          label="Movimientos Hoy"
          value={dashboardStats.movimientosHoy.valor.toString()}
          badge={<span className="text-gray-500 text-xs">HOY</span>}
          onClick={() => navigate('/auditoria')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-navy-900">Movimientos del Almacén</h3>
              <p className="text-sm text-gray-500">Actividad registrada — {periodos[periodo]}</p>
            </div>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              {periodos.map((p, i) => (
                <option key={p} value={i}>{p}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="entradas" fill="#102a43" radius={[4, 4, 0, 0]} name="Entradas" />
              <Bar dataKey="salidas" fill="#bcccdc" radius={[4, 4, 0, 0]} name="Salidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div
          className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/almacen/inmuebles')}
        >
          <h3 className="text-lg font-semibold text-navy-900">Estatus de Inmuebles</h3>
          <p className="text-sm text-gray-500 mb-4">Consolidado actual de la cartera</p>
          <div className="flex justify-center">
            <div className="relative">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((_entry, index) => (
                      <Cell key={index} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-navy-900">{estatusInmuebles.porcentajeOcupado}%</p>
                  <p className="text-xs text-gray-500 uppercase">Ocupado</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-navy-900" />
                Vendido
              </div>
              <span className="font-semibold text-navy-900">{estatusInmuebles.vendido.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-navy-200" />
                Disponible
              </div>
              <span className="font-semibold text-navy-900">{estatusInmuebles.disponible}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {accionesRapidas.map((accion) => (
          <button
            key={accion.nombre}
            onClick={() => navigate(accion.ruta)}
            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-navy-300 transition-all"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
              <accion.icon size={24} className="text-navy-700" />
            </div>
            <span className="text-sm font-medium text-navy-900">{accion.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  badge,
  borderColor = 'border-gray-200',
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
  borderColor?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-xl border ${borderColor} p-5 cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        {badge}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-navy-900">{value}</p>
    </div>
  );
}
