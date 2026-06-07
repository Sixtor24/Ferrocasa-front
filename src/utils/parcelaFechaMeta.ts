import { toIsoDate } from '../api/mappers/enums';

const FECHA_ADQUISICION_META_RE = /\[fecha_adquisicion:(\d{4}-\d{2}-\d{2})\]\s*$/i;
const NUMERO_DOCUMENTO_META_RE = /\[numero_documento:([^\]]+)\]\s*$/i;

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
    .replace(FECHA_ADQUISICION_META_RE, '')
    .replace(NUMERO_DOCUMENTO_META_RE, '')
    .trim();
}

export function buildParcelaObservacionesMeta(
  observaciones: string,
  options: { fechaAdquisicion?: string; numeroDocumento?: string },
): string | null {
  const base = stripParcelaObservacionesMeta(observaciones);
  const tags: string[] = [];
  const fecha = toIsoDate(options.fechaAdquisicion);
  const numeroDocumento = options.numeroDocumento?.trim();

  if (numeroDocumento) tags.push(`[numero_documento:${numeroDocumento}]`);
  if (fecha) tags.push(`[fecha_adquisicion:${fecha}]`);

  const text = [base, ...tags].filter(Boolean).join(' ').trim();
  return text || null;
}
