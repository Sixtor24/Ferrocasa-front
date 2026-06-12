import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchDashboardActividadReciente,
  fetchDashboardAlertas,
  fetchDashboardGraficos,
  fetchDashboardStats,
} from "../api/services/dashboard.service";
import { fetchParcelasEstadisticas } from "../api/services/parcelas.service";
import { useApiQuery } from "../hooks/useApiQuery";
import SearchableSelect from "../components/forms/SearchableSelect";
import { dashboardStats } from "../data/dashboard";
import {
  buildMovimientosFromGraficos,
  findAlertaCantidad,
  formatActividadHora,
  formatActividadMensaje,
  repartirParcelasEstado,
} from "../utils/dashboardFormat";
import {
  Package,
  Building2,
  Landmark,
  Truck,
  Map,
  FileText,
  Shield,
  Clock,
  ChevronRight,
  Boxes,
  LandPlot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  LabelList,
} from "recharts";
import {
  MESES_CALENDARIO,
  febreroEnBisiesto,
  getSemanasDelMes,
} from "../utils/calendar";

const periodos = [
  { key: "semanal", label: "Semanal" },
  { key: "mensual", label: "Mensual" },
  { key: "anual", label: "Anual" },
] as const;

type PeriodoMovimiento = (typeof periodos)[number]["key"];

type AccionRapida = { nombre: string; icon: LucideIcon; ruta: string };

const ACCIONES_RAPIDAS: AccionRapida[] = [
  { nombre: "Bienes Admin.", icon: Package, ruta: "/almacen" },
  { nombre: "Bienes en Cementerio", icon: Landmark, ruta: "/cementerio" },
  { nombre: "Terrenos", icon: Map, ruta: "/terrenos" },
  { nombre: "Vehículos y Maquinarias", icon: Truck, ruta: "/vehiculos" },
  { nombre: "Reportes", icon: FileText, ruta: "/reportes" },
  { nombre: "Auditoría", icon: Shield, ruta: "/auditoria" },
];

const DONUT_COLORS = ["#16a34a", "#243b53", "#d97706", "#dc2626", "#7c3aed"];

const fechaLargaFormatter = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function getSaludo(hora: number): string {
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { canAccessModule } = useRolePermissions();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [periodo, setPeriodo] = useState<PeriodoMovimiento>("semanal");
  const [year, setYear] = useState(currentYear);
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [semanaMes, setSemanaMes] = useState(0);
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | undefined>(
    undefined,
  );
  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const semanasDelMes = useMemo(() => getSemanasDelMes(year, mes), [year, mes]);

  const { saludo, fechaHoy } = useMemo(() => {
    const ahora = new Date();
    return {
      saludo: getSaludo(ahora.getHours()),
      fechaHoy: capitalizar(fechaLargaFormatter.format(ahora)),
    };
  }, []);

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
  const actividadQuery = useApiQuery(
    () => fetchDashboardActividadReciente(1),
    [],
  );
  const alertasQuery = useApiQuery(() => fetchDashboardAlertas(), []);
  const graficosQuery = useApiQuery(() => fetchDashboardGraficos(year), [year]);

  const stats = statsQuery.data;
  const inventario = stats?.inventario;
  const indicadores = stats?.indicadores;
  const alertas = alertasQuery.data?.data ?? [];
  const ultimaActividad = actividadQuery.data?.data[0];
  const graficos = graficosQuery.data;

  const totalBienes = inventario?.bienes_edificio_administrativo ?? 0;
  const totalCementerio = inventario?.bienes_cementerio ?? 0;
  const totalParcelas =
    parcelasStatsQuery.data?.total ?? inventario?.parcelas ?? 0;
  const totalVehiculos = inventario?.vehiculos_maquinarias ?? 0;

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
      comprometidas: findAlertaCantidad(
        alertas,
        "PARCELAS_COMPROMETIDAS",
        "COMPROMETID",
      ),
      desincorporadas: findAlertaCantidad(
        alertas,
        "PARCELAS_DESINCORPORADAS",
        "DESINCORPORAD",
      ),
    });
  }, [
    parcelasStatsQuery.data,
    totalParcelas,
    indicadores?.parcelas_disponibles,
    alertas,
  ]);

  const parcelasDisponibles = parcelasEstado.disponibles;
  const parcelasComprometidas = parcelasEstado.comprometidas;
  const parcelasDesincorporadas = parcelasEstado.desincorporadas;

  const bienesEnUso = indicadores?.bienes_almacenados ?? 0;
  const bienesEnObsolescencia = 0;
  const bienesObsoletos = findAlertaCantidad(
    alertas,
    "BIENES_DADOS_DE_BAJA",
    "BIENES_DADOS_BAJA",
    "DADOS_BAJA",
    "OBSOLETO",
  );

  const loadingKpis = statsQuery.loading;
  const loadingEstados = statsQuery.loading || alertasQuery.loading;

  const accionesRapidas = useMemo(
    () =>
      ACCIONES_RAPIDAS.filter((item) => {
        const module = pathToModule(item.ruta);
        return module ? canAccessModule(module) : true;
      }),
    [canAccessModule],
  );

  const chartData = useMemo(
    () =>
      buildMovimientosFromGraficos({
        periodo,
        year,
        mes,
        semanaMes,
        semanasDelMes,
        graficos,
      }),
    [periodo, year, mes, semanaMes, semanasDelMes, graficos],
  );

  const movimientoTotales = useMemo(
    () => ({
      cambios: chartData.reduce((sum, item) => sum + item.altas, 0),
      diasActivos: chartData.filter((item) => item.altas > 0).length,
    }),
    [chartData],
  );

  const periodoLabel =
    periodos.find((item) => item.key === periodo)?.label ?? "Semanal";
  const periodoDescripcion = useMemo(() => {
    if (periodo === "semanal") {
      return `${periodoLabel} ${year} · Lunes a domingo (7 días)`;
    }
    if (periodo === "mensual") {
      const semana = semanasDelMes[semanaMes] ?? semanasDelMes[0];
      const bisiesto = febreroEnBisiesto(year, mes) ? " · año bisiesto" : "";
      const rango = semana ? ` · ${semana.label}` : "";
      const bloque = semana ? ` · ${semana.dias.length} días (de 7 en 7)` : "";
      return `${MESES_CALENDARIO[mes]} ${year}${rango}${bloque}${bisiesto}`;
    }
    return `${periodoLabel} ${year}`;
  }, [periodo, periodoLabel, year, mes, semanasDelMes, semanaMes]);

  const donutData = useMemo(
    () => [
      { name: "Áreas disponibles", value: parcelasDisponibles },
      { name: "Áreas comprometidas", value: parcelasComprometidas },
      { name: "Áreas desincorporadas", value: parcelasDesincorporadas },
    ],
    [parcelasDisponibles, parcelasComprometidas, parcelasDesincorporadas],
  );

  const donutDataConPorcentaje = useMemo(() => {
    const total =
      totalParcelas > 0
        ? totalParcelas
        : donutData.reduce((sum, item) => sum + item.value, 0);
    return donutData.map((item) => ({
      ...item,
      porcentaje: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [donutData, totalParcelas]);

  const porcentajeDisponible =
    totalParcelas > 0
      ? Math.round((parcelasDisponibles / totalParcelas) * 100)
      : 0;

  const distribucionActivos = useMemo(() => {
    const items = [
      {
        name: dashboardStats.totalBienesMuebles.label,
        value: totalBienes,
        color: "#102a43",
      },
      {
        name: dashboardStats.inventarioCementerio.label,
        value: totalCementerio,
        color: "#334e68",
      },
      {
        name: dashboardStats.totalInmuebles.label,
        value: totalParcelas,
        color: "#627d98",
      },
      {
        name: dashboardStats.totalVehiculos.label,
        value: totalVehiculos,
        color: "#9fb3c8",
      },
    ];
    const total = items.reduce((sum, item) => sum + item.value, 0);
    return items.map((item) => ({
      ...item,
      porcentaje: total > 0 ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [totalBienes, totalCementerio, totalParcelas, totalVehiculos]);

  const actividadResumen = useMemo(() => {
    if (actividadQuery.loading) return null;
    if (ultimaActividad) {
      return {
        texto: formatActividadMensaje(ultimaActividad),
        hora: formatActividadHora(ultimaActividad.fecha_cambio),
      };
    }
    const alertaCritica =
      alertas.find((item) => item.tipo === "danger") ?? alertas[0];
    if (alertaCritica) {
      return {
        texto: `${alertaCritica.titulo}: ${alertaCritica.mensaje}`,
        hora:
          alertaCritica.cantidad > 0 ? String(alertaCritica.cantidad) : null,
      };
    }
    return { texto: "Sin cambios recientes registrados", hora: null };
  }, [actividadQuery.loading, ultimaActividad, alertas]);

  const chartLoading = graficosQuery.loading;
  const donutVacio = totalParcelas === 0;

  return (
    <div className="p-4 md:p-6 space-y-6 min-w-0 overflow-x-hidden">
      <header className="relative overflow-hidden rounded-2xl bg-navy-900 px-6 py-7 text-white sm:px-8">
        <Building2
          className="pointer-events-none absolute -right-6 -top-6 h-44 w-44 text-white/5"
          aria-hidden
          strokeWidth={1}
        />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-navy-200">{saludo},</p>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {user?.nombre ?? "Bienvenido"}
              </h1>
            </div>
            {user?.rol && (
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-navy-100 ring-1 ring-inset ring-white/20">
                {user.rol}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-200">
            <span>{fechaHoy}</span>
            <span aria-hidden className="hidden text-navy-500 sm:inline">
              ·
            </span>
            <span>Sistema integral de gestión patrimonial — Ferrocasa</span>
          </div>
        </div>
      </header>

      <section
        aria-label="Resumen del inventario"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={Package}
          accent="navy"
          label={dashboardStats.totalBienesMuebles.label}
          value={totalBienes.toLocaleString()}
          loading={loadingKpis}
          onClick={() => navigate("/almacen")}
        />
        <StatCard
          icon={Landmark}
          accent="sky"
          label={dashboardStats.inventarioCementerio.label}
          value={totalCementerio.toLocaleString()}
          loading={loadingKpis}
          onClick={() => navigate("/cementerio")}
        />
        <StatCard
          icon={Building2}
          accent="emerald"
          label={dashboardStats.totalInmuebles.label}
          value={totalParcelas.toLocaleString()}
          loading={loadingKpis}
          onClick={() => navigate("/terrenos")}
        />
        <StatCard
          icon={Truck}
          accent="amber"
          label={dashboardStats.totalVehiculos.label}
          value={totalVehiculos.toLocaleString()}
          loading={loadingKpis}
          onClick={() => navigate("/vehiculos")}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EstadoPanel
          icon={Boxes}
          titulo="Estado de bienes"
          loading={loadingEstados}
          items={[
            { label: "En uso", value: bienesEnUso, dot: "bg-green-500" },
            {
              label: "En obsolescencia",
              value: bienesEnObsolescencia,
              dot: "bg-amber-500",
            },
            {
              label: "Dados de baja",
              value: bienesObsoletos,
              dot: "bg-red-500",
            },
          ]}
        />
        <EstadoPanel
          icon={LandPlot}
          titulo="Estado de parcelas"
          loading={loadingEstados}
          items={[
            {
              label: "Libres",
              value: parcelasDisponibles,
              dot: "bg-green-500",
            },
            {
              label: "Parcialmente ocupadas",
              value: parcelasComprometidas,
              dot: "bg-navy-500",
            },
            {
              label: "Ocupadas",
              value: parcelasDesincorporadas,
              dot: "bg-amber-500",
            },
          ]}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 min-w-0">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">
                Movimientos Patrimoniales
              </h2>
              <p className="text-sm text-gray-500">
                Altas y bajas de activos — {periodoDescripcion}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SearchableSelect
                value={periodo}
                onChange={(value) => setPeriodo(value as PeriodoMovimiento)}
                options={periodos.map((p) => ({
                  value: p.key,
                  label: p.label,
                }))}
                className="w-36"
              />
              <SearchableSelect
                value={String(year)}
                onChange={(value) => setYear(Number(value))}
                options={yearOptions.map(String)}
                className="w-28"
              />
              {periodo === "mensual" && (
                <>
                  <SearchableSelect
                    value={String(mes)}
                    onChange={(value) => setMes(Number(value))}
                    options={MESES_CALENDARIO.map((nombre, index) => ({
                      value: String(index),
                      label: `${nombre}${index === 1 && febreroEnBisiesto(year, index) ? " (29 días)" : ""}`,
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
              <div
                className="absolute inset-0 flex flex-col justify-end gap-2 px-2 pb-6"
                aria-hidden
              >
                {[60, 40, 80, 55, 70, 30, 45].map((h, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div
                      className="w-full animate-pulse rounded-md bg-gray-100"
                      style={{ height: `${h}px` }}
                    />
                  </div>
                ))}
              </div>
            ) : chartData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Sin movimientos en este periodo
                </p>
                <p className="text-xs text-gray-400">
                  Prueba con otro rango de fechas
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={chartData}
                  margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="periodo"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={32}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(16, 42, 67, 0.06)" }}
                    wrapperStyle={{
                      zIndex: 20,
                      maxWidth: 240,
                      outline: "none",
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 24px rgba(16,42,67,0.08)",
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [
                      `${value ?? 0}`,
                      String(name ?? ""),
                    ]}
                    labelFormatter={(_label, payload) => {
                      const detalle = payload?.[0]?.payload?.detalle;
                      return detalle
                        ? `${_label} · ${detalle}`
                        : String(_label);
                    }}
                  />
                  <Bar
                    dataKey="altas"
                    fill="#102a43"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                    name={periodo === "anual" ? "Protocolos" : "Cambios"}
                  >
                    <LabelList
                      dataKey="altas"
                      position="top"
                      className="text-[10px] fill-navy-700"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-navy-50 px-3 py-2.5">
              <p className="text-gray-500">
                {periodo === "anual"
                  ? "Protocolos del año"
                  : "Cambios del periodo"}
              </p>
              <p className="text-lg font-bold text-navy-900 tabular-nums">
                {movimientoTotales.cambios}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-gray-500">Días con actividad</p>
              <p className="text-lg font-bold text-gray-700 tabular-nums">
                {movimientoTotales.diasActivos}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 min-w-0 overflow-hidden transition-shadow hover:shadow-md">
          <button
            type="button"
            onClick={() => navigate("/terrenos")}
            className="group w-full text-left rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          >
            <h2 className="text-lg font-semibold text-navy-900 group-hover:text-navy-700">
              Inmuebles por Estado
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Distribución de {totalParcelas} parcelas
            </p>
          </button>
          <div
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="mx-auto w-full max-w-[200px]">
              <div className="relative mx-auto h-[180px] w-[180px]">
                {donutVacio ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 text-center px-4">
                    Sin datos de estado
                  </div>
                ) : (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
                      aria-hidden
                    >
                      <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
                        <p className="text-2xl font-bold leading-none text-navy-900 tabular-nums">
                          {porcentajeDisponible}%
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 text-center leading-tight px-1">
                          Disponible
                        </p>
                      </div>
                    </div>
                    {activeDonutIndex !== undefined &&
                      donutDataConPorcentaje[activeDonutIndex] && (
                        <div
                          className="pointer-events-none absolute left-1/2 top-1 z-30 w-[calc(100%-8px)] max-w-[168px] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-xs shadow-md"
                          role="tooltip"
                        >
                          <p className="font-semibold text-navy-900 truncate">
                            {donutDataConPorcentaje[activeDonutIndex].name}
                          </p>
                          <p className="text-gray-600 mt-0.5">
                            {
                              donutDataConPorcentaje[activeDonutIndex]
                                .porcentaje
                            }
                            % ({donutDataConPorcentaje[activeDonutIndex].value}{" "}
                            parcelas)
                          </p>
                        </div>
                      )}
                    <div className="relative z-10 h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart
                          margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                        >
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
                            onMouseEnter={(_, index) =>
                              setActiveDonutIndex(index)
                            }
                            onMouseLeave={() => setActiveDonutIndex(undefined)}
                          >
                            {donutData.map((_entry, index) => (
                              <Cell
                                key={index}
                                fill={DONUT_COLORS[index]}
                                opacity={
                                  activeDonutIndex === undefined ||
                                  activeDonutIndex === index
                                    ? 1
                                    : 0.5
                                }
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
            <ul className="mt-4 space-y-1.5">
              {donutDataConPorcentaje.map((d, i) => (
                <li
                  key={d.name}
                  className={`flex items-center justify-between text-sm rounded-lg px-2 py-1.5 transition-colors ${
                    activeDonutIndex === i ? "bg-gray-50" : ""
                  }`}
                  onMouseEnter={() => setActiveDonutIndex(i)}
                  onMouseLeave={() => setActiveDonutIndex(undefined)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[i] }}
                    />
                    <span className="truncate text-gray-700">{d.name}</span>
                  </div>
                  <span className="font-semibold text-navy-900 tabular-nums shrink-0 ml-2">
                    {d.porcentaje}%
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      ({d.value})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => navigate("/terrenos")}
            className="mt-4 inline-flex items-center gap-1 rounded-lg text-sm font-medium text-navy-600 transition-colors hover:text-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
          >
            Ver terrenos <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/*   */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-full">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">
            Distribución de Activos
          </h2>
          <div className="space-y-3.5">
            {distribucionActivos.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-700 font-medium">{item.name}</span>
                  <span className="text-navy-900 font-bold tabular-nums">
                    {item.value.toLocaleString()}{" "}
                    <span className="text-gray-400 font-normal">
                      ({item.porcentaje}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${item.porcentaje}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}

const ACCENT_STYLES = {
  navy: "bg-navy-50 text-navy-700",
  sky: "bg-sky-50 text-sky-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
} as const;

function StatCard({
  icon: Icon,
  accent,
  label,
  value,
  loading,
  onClick,
}: {
  icon: LucideIcon;
  accent: keyof typeof ACCENT_STYLES;
  label: string;
  value: string;
  loading?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500"
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT_STYLES[accent]}`}
        >
          <Icon size={22} aria-hidden />
        </div>
        <ChevronRight
          size={18}
          className="text-gray-300 transition-colors group-hover:text-navy-400"
          aria-hidden
        />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      {loading ? (
        <div
          className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-100"
          aria-hidden
        />
      ) : (
        <p className="text-2xl font-bold text-navy-900 tabular-nums">{value}</p>
      )}
    </button>
  );
}

function EstadoPanel({
  icon: Icon,
  titulo,
  items,
  loading,
}: {
  icon: LucideIcon;
  titulo: string;
  items: Array<{ label: string; value: number; dot: string }>;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
          <Icon size={17} aria-hidden />
        </div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-700">
          {titulo}
        </h2>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`}
                aria-hidden
              />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="mt-1 text-xl font-bold text-navy-900 tabular-nums">
              {loading ? (
                <span className="inline-block h-6 w-10 animate-pulse rounded bg-gray-100 align-middle" />
              ) : (
                item.value.toLocaleString()
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
