/** Categorías del reporte (módulos operativos, alineados al menú). */
export const CATEGORIAS_REPORTE = [
  'Bienes Administrativos',
  'Cementerio',
  'Terrenos',
  'Vehículos y Maquinarias',
] as const;

export type CategoriaReporte = (typeof CATEGORIAS_REPORTE)[number];

export const TIPOS_MOVIMIENTO_REPORTE = [
  'Todos los movimientos',
  'Entrada',
  'Transferencia',
  'Salida',
] as const;

export type TipoMovimientoReporte = (typeof TIPOS_MOVIMIENTO_REPORTE)[number];

export type TipoMovimientoActivo = Exclude<TipoMovimientoReporte, 'Todos los movimientos'>;
