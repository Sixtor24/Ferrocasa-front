/**
 * Un bien/vehículo se considera retirado del inventario cuando tiene `fechaEgreso`.
 * El retiro siempre establece esa fecha, por lo que es el criterio fiable para
 * distinguir el inventario activo del que fue dado de baja.
 */

export const INVENTARIO_VIEW_OPTIONS = ['Activos', 'Retirados', 'Todos'] as const;
export type InventarioView = (typeof INVENTARIO_VIEW_OPTIONS)[number];

export function isInventarioActivo(item: { fechaEgreso?: string | null }): boolean {
  return !item.fechaEgreso || !item.fechaEgreso.trim();
}

/** Resuelve la vista efectiva: los roles sin permiso solo ven inventario activo. */
export function resolveInventarioView(
  value: string | undefined,
  canViewRetirados: boolean,
): InventarioView {
  if (!canViewRetirados) return 'Activos';
  if (value === 'Retirados' || value === 'Todos') return value;
  return 'Activos';
}

export function matchesInventarioView(
  item: { fechaEgreso?: string | null },
  view: InventarioView,
): boolean {
  if (view === 'Todos') return true;
  if (view === 'Retirados') return !isInventarioActivo(item);
  return isInventarioActivo(item);
}
