import { toIsoDate } from '../api/mappers/enums';

const FECHA_CALENDARIO_TZ = 'America/Caracas';

/** Valor solo con día civil (YYYY-MM-DD), sin hora ni zona horaria. */
function isDateOnlyValue(value: string): boolean {
  const trimmed = value.trim();
  const head = trimmed.split('T')[0].split(' ')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(head)) return false;
  return !trimmed.includes('T') && !/\d{1,2}:\d{2}/.test(trimmed);
}
export function formatMontoInput(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return '';
  return String(valor).replace('.', ',');
}

export function sanitizeMontoDraft(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const [entero, ...decimales] = cleaned.split(',');
  return decimales.length === 0 ? entero : `${entero},${decimales.join('')}`;
}

export function parseMontoInput(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '').replace(/\./g, '');
  if (cleaned === '' || cleaned === ',') return 0;
  const normalized = cleaned.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Formatea número como moneda Bs o USD
 */
export function formatMoneda(valor: number | null, moneda: string = 'Bs'): string {
  if (valor === null || valor === undefined) return '—';
  const [entero, decimales] = valor.toFixed(2).split('.');
  const formatted = `${entero},${decimales}`;
  return `${moneda} ${formatted}`;
}

/**
 * Formatea fecha ISO a formato legible
 */
export function formatFecha(fecha: string): string {
  if (!fecha || fecha === '—') return '—';
  if (isDateOnlyValue(fecha)) {
    return isoDateToDisplay(fecha.trim().split('T')[0].split(' ')[0]);
  }
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-VE', {
    timeZone: FECHA_CALENDARIO_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Fecha civil en Venezuela → YYYY-MM-DD.
 * Usar al filtrar para que coincida con lo que muestra formatFecha.
 */
export function fechaCalendarioIso(fecha?: string | null): string {
  if (!fecha || fecha === '—') return '';
  const trimmed = String(fecha).trim();
  if (isDateOnlyValue(trimmed)) {
    return trimmed.split('T')[0].split(' ')[0];
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return toIsoDate(fecha);
  return d.toLocaleDateString('en-CA', { timeZone: FECHA_CALENDARIO_TZ });
}

/** YYYY-MM-DD → DD/MM/YYYY (sin depender del locale del navegador). */
export function isoDateToDisplay(iso: string): string {
  if (!iso?.trim()) return '';
  const head = iso.trim().split('T')[0].split(' ')[0];
  const match = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Formatea área en m²
 */
export function formatArea(area: number | null): string {
  if (area === null || area === undefined) return '—';
  return `${area.toLocaleString('es-VE')} m²`;
}

/**
 * Truncar texto con ellipsis
 */
export function truncar(texto: string, max: number = 40): string {
  if (texto.length <= max) return texto;
  return texto.substring(0, max) + '…';
}
