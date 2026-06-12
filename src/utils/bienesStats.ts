import { mapEstadoUsoBien } from '../api/mappers/enums';
import type { ApiBienesEstadisticas } from '../api/types';
import type { BienMueble } from '../types/bien';

export function aggregateBienesMetricsFromList(bienes: BienMueble[]) {
  let enUso = 0;
  let enObsolescencia = 0;
  let obsoletos = 0;

  for (const bien of bienes) {
    if (bien.estadoUso === 'En uso') enUso += 1;
    else if (bien.estadoUso === 'En obsolescencia') enObsolescencia += 1;
    else if (bien.estadoUso === 'Obsoleto') obsoletos += 1;
  }

  return {
    total: bienes.length,
    enUso,
    enObsolescencia,
    obsoletos,
  };
}

export function parseBienesEstadisticas(stats?: ApiBienesEstadisticas | null) {
  let enUso = 0;
  let enObsolescencia = 0;
  let obsoletos = 0;

  for (const row of stats?.porEstadoUso ?? []) {
    const estado = mapEstadoUsoBien(row.estado_uso);
    const count = row._count ?? 0;
    if (estado === 'En uso') enUso += count;
    else if (estado === 'En obsolescencia') enObsolescencia += count;
    else if (estado === 'Obsoleto') obsoletos += count;
  }

  return {
    total: stats?.total ?? 0,
    enUso,
    enObsolescencia,
    obsoletos,
  };
}
