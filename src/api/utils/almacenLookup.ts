import type { ApiAlmacen } from '../types';

export function buildAlmacenNombreMap(almacenes: ApiAlmacen[]): Map<number, string> {
  return new Map(almacenes.map((almacen) => [almacen.id_almacen, almacen.nombre]));
}

export function resolveAlmacenNombre(
  idAlmacen: number | undefined | null,
  nombreFromApi: string | undefined | null,
  almacenesById: Map<number, string>,
): string {
  const trimmed = nombreFromApi?.trim();
  if (trimmed && trimmed !== '—') return trimmed;
  if (idAlmacen != null && almacenesById.has(idAlmacen)) {
    return almacenesById.get(idAlmacen) ?? '—';
  }
  return '—';
}
