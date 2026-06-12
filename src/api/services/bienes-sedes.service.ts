import { fetchBienByCodigo, fetchBienes } from './bienes.service';
import { clampLimit, fetchAllPages } from '../pagination';
import type { ApiSede } from '../types';

export type BienesSedeQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export const SEDES_BIENES_ADMINISTRATIVOS = [
  'edificio administrativo',
  'edificio administrativo ferrocasa',
  'sede administrativa',
  'administrativa',
  'area externa',
  'areas externas',
  'áreas externas',
  'oficina administrativa',
];

export const SEDES_CEMENTERIO = ['cementerio'];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function sedeText(sede: ApiSede) {
  return [sede.nombre, sede.tipo, sede.ubicacion].filter(Boolean).join(' ');
}

export function matchesSede(sede: ApiSede | string, aliases: readonly string[]) {
  const normalizedName = normalize(typeof sede === 'string' ? sede : sedeText(sede));
  return aliases.some((alias) => normalizedName.includes(normalize(alias)));
}

/**
 * Una sola página del API (limit ≤ 100). Filtra por sede en el cliente sobre esa página.
 */
export async function fetchBienesBySedeAliases(
  aliases: readonly string[],
  query: BienesSedeQuery = {},
) {
  const page = query.page ?? 1;
  const limit = clampLimit(query.limit, 10);
  const result = await fetchBienes({ page, limit, search: query.search });
  const data = result.data.filter((bien) => matchesSede(bien.sede, aliases));

  return {
    data,
    meta: result.meta,
  };
}

export async function fetchBienByCodigoInSedes(codigo: number | string, aliases: readonly string[]) {
  const bien = await fetchBienByCodigo(codigo);
  if (!matchesSede(bien.sede, aliases)) {
    throw new Error('El bien no pertenece a las sedes de este módulo');
  }
  return bien;
}

export function fetchBienesAdministrativos(query: BienesSedeQuery = {}) {
  return fetchBienesBySedeAliases(SEDES_BIENES_ADMINISTRATIVOS, query);
}

export function fetchBienAdministrativoByCodigo(codigo: number | string) {
  return fetchBienByCodigoInSedes(codigo, SEDES_BIENES_ADMINISTRATIVOS);
}

export function fetchBienesCementerio(query: BienesSedeQuery = {}) {
  return fetchBienesBySedeAliases(SEDES_CEMENTERIO, query);
}

export function fetchBienCementerioByCodigo(codigo: number | string) {
  return fetchBienByCodigoInSedes(codigo, SEDES_CEMENTERIO);
}

/** Todos los bienes del módulo (paginación completa + filtro de sede en cliente). */
export async function fetchAllBienesAdministrativos(
  query: Omit<BienesSedeQuery, 'page' | 'limit'> = {},
) {
  return fetchAllPages((page, limit) => fetchBienesAdministrativos({ ...query, page, limit }));
}

export async function fetchAllBienesCementerio(
  query: Omit<BienesSedeQuery, 'page' | 'limit'> = {},
) {
  return fetchAllPages((page, limit) => fetchBienesCementerio({ ...query, page, limit }));
}
