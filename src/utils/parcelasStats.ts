import type { ApiParcelasEstadisticas } from '../api/types';
import type { Terreno } from '../types/terreno';

/** Conteos de parcelas por estado (no son m²). Ver `GET /parcelas/estadisticas`. */
export function parseParcelasEstadisticas(stats?: ApiParcelasEstadisticas | null) {
  return {
    totalParcelas: stats?.total ?? 0,
    parcelasDisponibles: stats?.disponibles ?? 0,
    parcelasComprometidas: stats?.comprometidas ?? 0,
    parcelasDesincorporadas: stats?.desincorporadas ?? 0,
  };
}

/** Suma áreas en m² a partir del listado de parcelas (misma lógica que la tabla). */
export function aggregateTerrenoMetricas(terrenos: Terreno[]) {
  return terrenos.reduce(
    (acc, terreno) => ({
      totalParcelas: acc.totalParcelas + 1,
      areaDisponible: acc.areaDisponible + terreno.areaDisponible,
      areaComprometida: acc.areaComprometida + terreno.areaComprometida,
      areaDesincorporada: acc.areaDesincorporada + terreno.areaDesincorporada,
      areaDocumento: acc.areaDocumento + terreno.areaDocumento,
    }),
    {
      totalParcelas: 0,
      areaDisponible: 0,
      areaComprometida: 0,
      areaDesincorporada: 0,
      areaDocumento: 0,
    },
  );
}
