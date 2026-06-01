import { fetchBienByCodigo } from './bienes.service';
import { fetchAlmacenesCatalog } from './almacenes.service';
import { fetchSedeBienes, fetchSedes } from './sedes.service';
import type { BienMueble } from '../../types/bien';
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

function matchesSede(sede: ApiSede | string, aliases: readonly string[]) {
  const normalizedName = normalize(typeof sede === 'string' ? sede : sedeText(sede));
  return aliases.some((alias) => normalizedName.includes(normalize(alias)));
}

function matchesSearch(bien: BienMueble, search: string) {
  const q = normalize(search);
  return [
    bien.codigoInterno,
    bien.descripcion,
    bien.marca,
    bien.modelo,
    bien.serial,
    bien.sede,
    bien.ubicacion,
    bien.unidadAdministrativa,
  ].some((value) => normalize(value || '').includes(q));
}

function dedupeBienes(rows: BienMueble[]) {
  return Array.from(new Map(rows.map((bien) => [bien.id, bien])).values());
}

export async function fetchAllBienesBySedeAliases(aliases: readonly string[]) {
  const [sedes, almacenesById] = await Promise.all([
    fetchSedes({ page: 1, limit: 500 }),
    fetchAlmacenesCatalog(),
  ]);
  const matchingSedes = sedes.data.filter((sede) => matchesSede(sede, aliases));

  if (matchingSedes.length === 0) return [];

  const results = await Promise.all(
    matchingSedes.map((sede) => fetchSedeBienes(sede.id_sede, almacenesById)),
  );
  return dedupeBienes(results.flat());
}

export async function fetchBienesBySedeAliases(
  aliases: readonly string[],
  query: BienesSedeQuery = {}
) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const rows = await fetchAllBienesBySedeAliases(aliases);
  const filtered = query.search
    ? rows.filter((bien) => matchesSearch(bien, query.search as string))
    : rows;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    all: filtered,
    meta: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    },
  };
}

export async function fetchBienByCodigoInSedes(codigo: number, aliases: readonly string[]) {
  const bien = await fetchBienByCodigo(codigo);
  if (matchesSede(bien.sede, aliases)) return bien;

  const scopedBienes = await fetchAllBienesBySedeAliases(aliases);
  const scopedBien = scopedBienes.find((item) => item.id === codigo);
  if (scopedBien) return scopedBien;

  throw new Error('El bien no pertenece a las sedes de este módulo');
}

export function fetchBienesAdministrativos(query: BienesSedeQuery = {}) {
  return fetchBienesBySedeAliases(SEDES_BIENES_ADMINISTRATIVOS, query);
}

export function fetchBienAdministrativoByCodigo(codigo: number) {
  return fetchBienByCodigoInSedes(codigo, SEDES_BIENES_ADMINISTRATIVOS);
}

export function fetchBienesCementerio(query: BienesSedeQuery = {}) {
  return fetchBienesBySedeAliases(SEDES_CEMENTERIO, query);
}

export function fetchBienCementerioByCodigo(codigo: number) {
  return fetchBienByCodigoInSedes(codigo, SEDES_CEMENTERIO);
}
