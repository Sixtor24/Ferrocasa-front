import { CATEGORIAS_REPORTE, type CategoriaReporte } from '../data/reportesCatalogos';
import type { ReporteRecurso } from '../types/reportesApi';

/** Elige el endpoint gerencial según las categorías visibles en el reporte. */
export function resolveReporteRecurso(categoriasSeleccionadas: CategoriaReporte[]): ReporteRecurso {
  const activas = categoriasSeleccionadas.length > 0
    ? categoriasSeleccionadas
    : [...CATEGORIAS_REPORTE];

  if (activas.length === 1) {
    switch (activas[0]) {
      case 'Terrenos':
        return 'parcelas-por-zona';
      case 'Vehículos y Maquinarias':
        return 'vehiculos-por-estado';
      case 'Bienes Administrativos':
      case 'Cementerio':
        return 'bienes-por-almacen';
      default:
        break;
    }
  }

  const soloBienes = activas.every(
    (item) => item === 'Bienes Administrativos' || item === 'Cementerio',
  );
  if (soloBienes) return 'bienes-por-almacen';

  const incluyeTerrenos = activas.includes('Terrenos');
  const incluyeVehiculos = activas.includes('Vehículos y Maquinarias');
  if (incluyeTerrenos && !incluyeVehiculos && activas.length <= 2) {
    return 'parcelas-por-responsable';
  }

  return 'inventario-valorado';
}

export function anioDesdeFecha(fecha: string): number | undefined {
  const year = Number(fecha.slice(0, 4));
  return Number.isFinite(year) && year > 1900 ? year : undefined;
}
