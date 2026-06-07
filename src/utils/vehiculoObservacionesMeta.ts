import {
  extractNumeroDocumentoMeta,
  stripParcelaObservacionesMeta,
} from './parcelaFechaMeta';

const UNIDAD_META_RE = /\[unidad:([^\]]+)\]/i;

export function extractUnidadAdministrativaMeta(observaciones?: string | null): string {
  const match = observaciones?.match(UNIDAD_META_RE);
  return match?.[1]?.trim() ?? '';
}

export function stripVehiculoObservacionesMeta(observaciones?: string | null): string {
  return stripParcelaObservacionesMeta(observaciones)
    .replace(UNIDAD_META_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildVehiculoObservacionesMeta(
  observaciones: string,
  options: { unidadAdministrativa?: string; numeroDocumento?: string },
): string | null {
  const base = stripVehiculoObservacionesMeta(observaciones);
  const tags: string[] = [];
  const unidad = options.unidadAdministrativa?.trim();
  const numeroDocumento = options.numeroDocumento?.trim();

  if (unidad) tags.push(`[unidad:${unidad}]`);
  if (numeroDocumento) tags.push(`[numero_documento:${numeroDocumento}]`);

  const text = [base, ...tags].filter(Boolean).join(' ').trim();
  return text || null;
}

export { extractNumeroDocumentoMeta };
