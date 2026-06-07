import { toIsoDate } from '../api/mappers/enums';

const FECHA_INGRESO_META_RE = /\[fecha_ingreso:(\d{4}-\d{2}-\d{2})\]/i;
const FECHA_ADQUISICION_META_RE = /\[fecha_adquisicion:(\d{4}-\d{2}-\d{2})\]/i;
const NUMERO_DOCUMENTO_META_RE = /\[numero_documento:([^\]]+)\]/i;

export function extractFechaIngresoMeta(observaciones?: string | null): string {
  const match = observaciones?.match(FECHA_INGRESO_META_RE);
  return match ? toIsoDate(match[1]) : '';
}

export function extractFechaAdquisicionMeta(observaciones?: string | null): string {
  const match = observaciones?.match(FECHA_ADQUISICION_META_RE);
  return match ? toIsoDate(match[1]) : '';
}

export function extractNumeroDocumentoMeta(observaciones?: string | null): string {
  const match = observaciones?.match(NUMERO_DOCUMENTO_META_RE);
  return match?.[1]?.trim() ?? '';
}

export function stripParcelaObservacionesMeta(observaciones?: string | null): string {
  return (observaciones ?? '')
    .replace(FECHA_INGRESO_META_RE, '')
    .replace(FECHA_ADQUISICION_META_RE, '')
    .replace(NUMERO_DOCUMENTO_META_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildParcelaObservacionesMeta(
  observaciones: string,
  options: {
    fechaAdquisicion?: string;
    fechaIngreso?: string;
    numeroDocumento?: string;
  },
): string | null {
  const base = stripParcelaObservacionesMeta(observaciones);
  const tags: string[] = [];
  const numeroDocumento = options.numeroDocumento?.trim();
  const fechaAdquisicion = toIsoDate(options.fechaAdquisicion);
  const fechaIngreso = toIsoDate(options.fechaIngreso);

  if (numeroDocumento) tags.push(`[numero_documento:${numeroDocumento}]`);
  if (fechaAdquisicion) tags.push(`[fecha_adquisicion:${fechaAdquisicion}]`);
  if (fechaIngreso) tags.push(`[fecha_ingreso:${fechaIngreso}]`);

  const text = [base, ...tags].filter(Boolean).join(' ').trim();
  return text || null;
}
