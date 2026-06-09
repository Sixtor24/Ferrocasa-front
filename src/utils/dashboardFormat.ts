import type {
  DashboardActividadItem,
  DashboardAlerta,
  DashboardChartSeries,
  DashboardGraficosApi,
} from '../types/dashboard';
import {
  accionAuditoriaLabel,
  formatFechaAuditoria,
  labelTablaAuditoria,
} from './auditoriaFormat';
import { DIAS_SEMANA, MESES_CORTOS } from './calendar';

const ACCIONES_AUDITORIA = new Set(['INSERT', 'UPDATE', 'DELETE']);

function normalizeDateKey(label: string): string | null {
  const trimmed = label.trim();
  if (ACCIONES_AUDITORIA.has(trimmed.toUpperCase())) return null;

  const isoMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function mapAuditoriaPorFecha(series?: DashboardChartSeries): Map<string, number> {
  const map = new Map<string, number>();
  if (!series?.labels?.length) return map;

  series.labels.forEach((label, index) => {
    const key = normalizeDateKey(label);
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + (series.values[index] ?? 0));
  });
  return map;
}

function toDateKey(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getLunesDomingoSemana(year: number): Date[] {
  const today = new Date();
  const anchor = year === today.getFullYear()
    ? today
    : new Date(year, today.getMonth(), today.getDate());

  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function buildPuntosPorFechas(
  fechas: Array<{ periodo: string; key: string }>,
  porFecha: Map<string, number>,
): MovimientoChartPoint[] {
  return fechas.map(({ periodo, key }) => {
    const raw = porFecha.get(key) ?? 0;
    return {
      periodo,
      altas: raw,
      bajas: 0,
      detalle: raw > 0 ? `${raw} cambio(s) en auditoría` : undefined,
    };
  });
}

export type MovimientoChartPoint = {
  periodo: string;
  altas: number;
  bajas: number;
  detalle?: string;
};

export function seriesToChartPoints(series?: DashboardChartSeries) {
  if (!series?.labels?.length) return [];
  return series.labels.map((label, index) => ({
    name: label,
    value: series.values[index] ?? 0,
  }));
}

function formatMesLabel(label: string): string {
  const match = label.match(/(\d{4})-(\d{2})/);
  if (!match) return label;
  const monthIndex = Number(match[2]) - 1;
  return MESES_CORTOS[monthIndex] ?? label;
}

function formatLocalDateKey(date: Date): string {
  return toDateKey(date.getFullYear(), date.getMonth(), date.getDate());
}

function toMovimientoPoints(
  labels: string[],
  values: number[],
  detalleFn?: (index: number, raw: number) => string | undefined,
  formatLabel: (label: string) => string = (label) => label,
): MovimientoChartPoint[] {
  if (!labels.length) return [];
  return labels.map((label, index) => {
    const raw = values[index] ?? 0;
    return {
      periodo: formatLabel(label),
      altas: raw,
      bajas: 0,
      detalle: detalleFn?.(index, raw),
    };
  });
}

/** Reparto de parcelas que siempre suma al total indicado. */
export function repartirParcelasEstado(input: {
  total: number;
  disponibles: number;
  comprometidas: number;
  desincorporadas: number;
}) {
  const total = Math.max(0, input.total);
  const disponibles = Math.min(Math.max(0, input.disponibles), total);
  const restantes = total - disponibles;
  const comprometidas = Math.min(Math.max(0, input.comprometidas), restantes);
  const desincorporadas = Math.min(Math.max(0, input.desincorporadas), restantes - comprometidas);
  return { disponibles, comprometidas, desincorporadas };
}

export function buildMovimientosFromGraficos(input: {
  periodo: 'semanal' | 'mensual' | 'anual';
  year: number;
  mes: number;
  semanaMes: number;
  semanasDelMes: Array<{ dias: Array<{ dia: number; etiqueta: string }> }>;
  graficos?: DashboardGraficosApi | null;
}): MovimientoChartPoint[] {
  const { periodo, semanaMes, semanasDelMes, graficos } = input;
  const auditoria = graficos?.auditoria_ultimos_30_dias;
  const protocolos = graficos?.protocolos_por_mes;

  if (periodo === 'anual') {
    if (!protocolos?.labels?.length) return [];
    const labels = protocolos.labels.map(formatMesLabel);
    return toMovimientoPoints(
      labels,
      protocolos.values,
      (_index, raw) => (raw > 0 ? `${raw} protocolo(s)` : undefined),
      (label) => label,
    );
  }

  const porFecha = mapAuditoriaPorFecha(auditoria);

  if (periodo === 'semanal') {
    const diasSemana = getLunesDomingoSemana(input.year);
    const fechas = DIAS_SEMANA.map((nombre, index) => ({
      periodo: nombre,
      key: formatLocalDateKey(diasSemana[index]),
    }));
    return buildPuntosPorFechas(fechas, porFecha);
  }

  const semana = semanasDelMes[semanaMes] ?? semanasDelMes[0];
  if (!semana) return [];

  const fechas = semana.dias.map((dia) => ({
    periodo: dia.etiqueta,
    key: toDateKey(input.year, input.mes, dia.dia),
  }));
  return buildPuntosPorFechas(fechas, porFecha);
}

export function findSerieValor(series: DashboardChartSeries | undefined, ...terminos: string[]): number {
  if (!series?.labels?.length) return 0;
  const normalizados = terminos.map((t) => t.toLowerCase());
  const index = series.labels.findIndex((label) =>
    normalizados.some((term) => label.toLowerCase().includes(term)),
  );
  return index >= 0 ? (series.values[index] ?? 0) : 0;
}

export function findAlertaCantidad(alertas: DashboardAlerta[] | undefined, ...codigos: string[]): number {
  if (!alertas?.length) return 0;
  const normalizados = codigos.map((c) => c.toUpperCase());
  const alerta = alertas.find((item) =>
    normalizados.some((codigo) => item.codigo.toUpperCase().includes(codigo)),
  );
  return alerta?.cantidad ?? 0;
}

export function formatValoracionTotal(valor: number): string {
  if (!Number.isFinite(valor)) return '—';
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valor);
}

export function formatActividadMensaje(item: DashboardActividadItem): string {
  const usuario = item.usuario?.nombre_usuario ?? 'Usuario del sistema';
  const tabla = labelTablaAuditoria(item.nombre_tabla);
  const accion = accionAuditoriaLabel(item.accion);
  return `${accion} en ${tabla} #${item.id_registro} — ${usuario}`;
}

export function formatActividadHora(iso: string): string {
  const formatted = formatFechaAuditoria(iso);
  const parts = formatted.split(', ');
  return parts[1] ?? formatted;
}
