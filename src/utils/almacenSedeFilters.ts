import type { ApiAlmacen } from '../api/types';
import { findAlmacenByNombre, normalizeCatalogValue } from './registroBienMappers';

function almacenSedeId(almacen: ApiAlmacen): number | null {
  return almacen.id_sede ?? almacen.sede?.id_sede ?? null;
}

function almacenSedeNombre(almacen: ApiAlmacen): string {
  return almacen.sede?.nombre?.trim() ?? '';
}

export function resolveAlmacenSedeId(
  almacenes: ApiAlmacen[],
  almacenNombre: string,
  sedeNombre?: string,
): number | null {
  const match = findAlmacenByNombre(almacenNombre, almacenes);
  const fromAlmacen = match ? almacenSedeId(match) : null;
  if (fromAlmacen != null) return fromAlmacen;

  if (!sedeNombre || sedeNombre === '—') return null;

  const sedeNorm = normalizeCatalogValue(sedeNombre);
  const bySede = almacenes.find((almacen) => {
    const nombre = normalizeCatalogValue(almacenSedeNombre(almacen));
    return nombre === sedeNorm || nombre.includes(sedeNorm) || sedeNorm.includes(nombre);
  });

  return bySede ? almacenSedeId(bySede) : null;
}

export function almacenPerteneceASede(
  almacen: ApiAlmacen,
  sedeId: number | null,
  sedeNombre?: string,
): boolean {
  if (sedeId != null) return almacenSedeId(almacen) === sedeId;

  if (!sedeNombre || sedeNombre === '—') return false;

  const ref = normalizeCatalogValue(sedeNombre);
  const nombre = normalizeCatalogValue(almacenSedeNombre(almacen));
  return nombre === ref || nombre.includes(ref) || ref.includes(nombre);
}

export function nombresAlmacenesPorSede(almacenes: ApiAlmacen[], sedeNombre: string): string[] {
  const sedeId = resolveAlmacenSedeId(almacenes, '', sedeNombre);
  return almacenes
    .filter((almacen) => almacenPerteneceASede(almacen, sedeId, sedeNombre))
    .map((almacen) => almacen.nombre.trim())
    .filter((nombre) => nombre.length > 0);
}

export function filterAlmacenesMismaSede(
  almacenes: ApiAlmacen[],
  almacenActual: string,
  sedeActual?: string,
): ApiAlmacen[] {
  const sedeId = resolveAlmacenSedeId(almacenes, almacenActual, sedeActual);
  return almacenes.filter((almacen) => almacenPerteneceASede(almacen, sedeId, sedeActual));
}

export function resolveSedeEtiqueta(
  almacenes: ApiAlmacen[],
  almacenNombre: string,
  sedeNombre?: string,
): string {
  const match = findAlmacenByNombre(almacenNombre, almacenes);
  const fromAlmacen = match ? almacenSedeNombre(match) : '';
  if (fromAlmacen) return fromAlmacen;
  if (sedeNombre && sedeNombre !== '—') return sedeNombre;
  return '—';
}
