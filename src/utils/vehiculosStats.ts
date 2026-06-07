import { mapEstadoUsoVehiculo } from '../api/mappers/enums';
import type { ApiVehiculosEstadisticas } from '../api/types';
import { toNumber } from '../api/mappers/enums';

export function parseVehiculosEstadisticas(stats?: ApiVehiculosEstadisticas | null) {
  let enUso = 0;
  let enObsolescencia = 0;
  let obsoletos = 0;

  for (const row of stats?.porEstadoUso ?? []) {
    const estado = mapEstadoUsoVehiculo(row.estado_uso);
    const count = row._count ?? 0;
    if (estado === 'En uso') enUso += count;
    else if (estado === 'En obsolescencia') enObsolescencia += count;
    else if (estado === 'Obsoleto') obsoletos += count;
  }

  return {
    total: stats?.total ?? 0,
    disponibles: stats?.disponibles ?? 0,
    asignados: stats?.asignados ?? 0,
    enMantenimiento: stats?.enMantenimiento ?? 0,
    valorTotal: toNumber(stats?.valorTotal) ?? 0,
    enUso,
    enObsolescencia,
    obsoletos,
  };
}
