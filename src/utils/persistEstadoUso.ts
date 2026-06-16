import type { EstadoUso } from '../types/bien';

/** Al salir de Obsoleto, limpiar fecha de egreso para reingresar al inventario activo. */
export function estadoUsoReactivationOverrides(
  estadoAnterior: EstadoUso,
  estadoNuevo: EstadoUso,
): { fecha_egreso: null } | Record<string, never> {
  if (estadoAnterior === 'Obsoleto' && estadoNuevo !== 'Obsoleto') {
    return { fecha_egreso: null };
  }
  return {};
}
