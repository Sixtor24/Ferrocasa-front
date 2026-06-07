import { matchesSede, SEDES_CEMENTERIO } from '../api/services/bienes-sedes.service';
import { ALMACENES_CEMENTERIO } from '../data/bienesCatalogos';
import type { ApiAlmacen, ApiSede } from '../api/types';
import { normalizeCatalogValue } from './registroBienMappers';

function sortAlmacenesCementerio(nombres: string[]): string[] {
  const order = new Map(ALMACENES_CEMENTERIO.map((nombre, index) => [normalizeCatalogValue(nombre), index]));
  return [...nombres].sort((a, b) => {
    const indexA = order.get(normalizeCatalogValue(a)) ?? 1000;
    const indexB = order.get(normalizeCatalogValue(b)) ?? 1000;
    return indexA - indexB || a.localeCompare(b, 'es');
  });
}

export function filterAlmacenesCementerio(almacenes: ApiAlmacen[], sedes: ApiSede[] = []): ApiAlmacen[] {
  const cementerioSedeIds = new Set(
    sedes.filter((sede) => matchesSede(sede, SEDES_CEMENTERIO)).map((sede) => sede.id_sede),
  );

  const bySede = almacenes.filter((almacen) => {
    if (almacen.sede && matchesSede(almacen.sede, SEDES_CEMENTERIO)) return true;
    if (almacen.id_sede != null && cementerioSedeIds.has(almacen.id_sede)) return true;
    return false;
  });

  if (bySede.length > 0) return bySede;

  const catalog = new Set(ALMACENES_CEMENTERIO.map(normalizeCatalogValue));
  return almacenes.filter((almacen) => catalog.has(normalizeCatalogValue(almacen.nombre)));
}

export function nombresAlmacenesCementerio(almacenes: ApiAlmacen[], sedes: ApiSede[] = []): string[] {
  const nombres = filterAlmacenesCementerio(almacenes, sedes)
    .map((almacen) => almacen.nombre.trim())
    .filter((nombre) => nombre.length > 0);

  if (nombres.length > 0) return sortAlmacenesCementerio(nombres);
  return [...ALMACENES_CEMENTERIO];
}
