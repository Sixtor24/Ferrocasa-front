import type { Terreno } from '../types/terreno';

type CantidadM2Item = { cantidad_m2?: string | number | null };

export function sumCantidadM2(items: CantidadM2Item[]): number {
  return items.reduce((sum, item) => {
    const raw = item.cantidad_m2;
    const value = typeof raw === 'number' ? raw : raw != null ? Number(raw) : NaN;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

/** Sin m² libres para nuevos compromisos (toda la superficie está comprometida o desincorporada). */
export function parcelaSinAreaDisponible(terreno: Pick<Terreno, 'areaDisponible'>): boolean {
  return terreno.areaDisponible <= 0;
}

/** Sin m² retirables: no queda disponible ni comprometida. */
export function parcelaSinAreaRetirable(
  terreno: Pick<Terreno, 'areaDisponible' | 'areaComprometida'>,
): boolean {
  return terreno.areaDisponible + terreno.areaComprometida <= 0;
}

/** Toda la superficie del documento fue desincorporada. */
export function parcelaTotalmenteDesincorporada(
  terreno: Pick<Terreno, 'areaTotalM2' | 'areaDesincorporada' | 'areaDisponible' | 'areaComprometida'>,
): boolean {
  if (terreno.areaTotalM2 <= 0) {
    return parcelaSinAreaRetirable(terreno) && terreno.areaDesincorporada > 0;
  }
  return terreno.areaDesincorporada >= terreno.areaTotalM2
    || (parcelaSinAreaRetirable(terreno) && terreno.areaDesincorporada > 0);
}

/** Solo consulta histórica: no mover, no editar, no nuevas protocolizaciones. */
export function parcelaSoloConsulta(terreno: Pick<Terreno, 'areaDisponible'>): boolean {
  return parcelaSinAreaDisponible(terreno);
}
