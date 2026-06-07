import type { PaginationMeta } from './types';

/** Tope de paginación impuesto por el API (seguridad). */
export const API_MAX_LIMIT = 100;

/** Tamaño por defecto en catálogos (una sola petición). */
export const API_DEFAULT_LIMIT = 100;

/** Filas por página en tablas de módulo (Almacén, Vehículos, etc.). */
export const MODULE_PAGE_SIZE = 10;

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function clampLimit(limit?: number, fallback = API_DEFAULT_LIMIT): number {
  const value = limit ?? fallback;
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.min(Math.floor(value), API_MAX_LIMIT);
}

export function listParams(page?: number, limit?: number, fallback = API_DEFAULT_LIMIT) {
  return {
    page: page ?? 1,
    limit: clampLimit(limit, fallback),
  };
}

/**
 * Recorre todas las páginas (solo exportaciones bajo demanda; no usar al montar módulos).
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResult<T>>,
  pageSize = API_MAX_LIMIT,
): Promise<T[]> {
  const limit = clampLimit(pageSize);
  const first = await fetchPage(1, limit);
  const all = [...first.data];
  const totalPages = first.meta.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage(page, limit);
    all.push(...next.data);
  }

  return all;
}

export function metaForAll<T>(rows: T[]): PaginationMeta {
  return {
    page: 1,
    limit: rows.length,
    total: rows.length,
    totalPages: 1,
  };
}
