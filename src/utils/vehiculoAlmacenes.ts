import {
  matchesSede,
  SEDES_BIENES_ADMINISTRATIVOS,
  SEDES_CEMENTERIO,
} from '../api/services/bienes-sedes.service';
import { ALMACENES_BIENES_ADMINISTRATIVOS, ALMACENES_CEMENTERIO } from '../data/bienesCatalogos';
import type { ApiAlmacen, ApiSede } from '../api/types';
import { normalizeCatalogValue } from './registroBienMappers';

const SEDES_VEHICULOS_ALIASES = [...SEDES_BIENES_ADMINISTRATIVOS, ...SEDES_CEMENTERIO] as const;
const CATALOG_ALMACENES_VEHICULOS = [...ALMACENES_BIENES_ADMINISTRATIVOS, ...ALMACENES_CEMENTERIO] as const;

export function filterAlmacenesVehiculos(almacenes: ApiAlmacen[], sedes: ApiSede[] = []): ApiAlmacen[] {
  const sedeIds = new Set(
    sedes
      .filter((sede) => matchesSede(sede, SEDES_VEHICULOS_ALIASES))
      .map((sede) => sede.id_sede),
  );

  const bySede = almacenes.filter((almacen) => {
    if (almacen.sede && matchesSede(almacen.sede, SEDES_VEHICULOS_ALIASES)) return true;
    if (almacen.id_sede != null && sedeIds.has(almacen.id_sede)) return true;
    return false;
  });

  if (bySede.length > 0) return bySede;

  const catalog = new Set(CATALOG_ALMACENES_VEHICULOS.map(normalizeCatalogValue));
  return almacenes.filter((almacen) => catalog.has(normalizeCatalogValue(almacen.nombre)));
}

export function nombresAlmacenesVehiculos(almacenes: ApiAlmacen[], sedes: ApiSede[] = []): string[] {
  const nombres = filterAlmacenesVehiculos(almacenes, sedes)
    .map((almacen) => almacen.nombre.trim())
    .filter((nombre) => nombre.length > 0);

  if (nombres.length > 0) {
    return [...new Set(nombres)].sort((a, b) => a.localeCompare(b, 'es'));
  }

  return [...CATALOG_ALMACENES_VEHICULOS];
}
