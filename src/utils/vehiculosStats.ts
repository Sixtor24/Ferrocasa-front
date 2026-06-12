import { mapEstadoUsoVehiculo, toNumber } from '../api/mappers/enums';
import type { ApiVehiculosEstadisticas } from '../api/types';
import type { Vehiculo } from '../types/vehiculo';

export function aggregateVehiculosMetricsFromList(vehiculos: Vehiculo[]) {
  let enUso = 0;
  let enObsolescencia = 0;
  let obsoletos = 0;
  let valorTotal = 0;

  for (const vehiculo of vehiculos) {
    if (vehiculo.estadoUso === 'En uso') enUso += 1;
    else if (vehiculo.estadoUso === 'En obsolescencia') enObsolescencia += 1;
    else if (vehiculo.estadoUso === 'Obsoleto') obsoletos += 1;
    valorTotal += vehiculo.valorAdquisicion ?? 0;
  }

  return {
    total: vehiculos.length,
    disponibles: 0,
    asignados: 0,
    enMantenimiento: 0,
    valorTotal,
    enUso,
    enObsolescencia,
    obsoletos,
  };
}

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
