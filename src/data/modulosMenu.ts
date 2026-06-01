/** Etiquetas del menú lateral (Layout) — usar en auditoría y trazabilidad. */
export const MODULOS_MENU = [
  'Dashboard',
  'Bienes Admin.',
  'Cementerio',
  'Terrenos',
  'Vehículos',
  'Reportes',
  'Auditoría',
] as const;

export type ModuloMenu = (typeof MODULOS_MENU)[number];

/** Acciones fuera de un módulo de negocio (login, usuarios globales). */
export const MODULO_SISTEMA = 'Sistema' as const;

export const MODULOS_AUDITORIA_FILTRO = [...MODULOS_MENU, MODULO_SISTEMA] as const;

export const MODULO_MENU_COLORS: Record<string, string> = {
  Dashboard: 'bg-slate-100 text-slate-800',
  'Bienes Admin.': 'bg-navy-100 text-navy-800',
  Cementerio: 'bg-blue-100 text-blue-800',
  Terrenos: 'bg-emerald-100 text-emerald-800',
  Vehículos: 'bg-amber-100 text-amber-800',
  Reportes: 'bg-purple-100 text-purple-800',
  Auditoría: 'bg-gray-100 text-gray-800',
  Sistema: 'bg-zinc-100 text-zinc-700',
};
