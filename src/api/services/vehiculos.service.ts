import { apiRequest } from '../client';
import type {
  ApiItemResponse,
  ApiListResponse,
  ApiVehiculo,
  ApiVehiculosEstadisticas,
} from '../types';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';
import type { Vehiculo } from '../../types/vehiculo';

export type VehiculosQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchVehiculos(query: VehiculosQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiVehiculo>>('/vehiculos', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 100,
      search: query.search,
    },
  });
  return {
    data: res.data.map(mapApiVehiculoToVehiculo),
    meta: res.meta,
  };
}

export async function fetchVehiculoById(id: number): Promise<Vehiculo> {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${id}`);
  return mapApiVehiculoToVehiculo(res.data);
}

export async function fetchVehiculosEstadisticas(): Promise<ApiVehiculosEstadisticas> {
  const res = await apiRequest<ApiItemResponse<ApiVehiculosEstadisticas>>('/vehiculos/estadisticas');
  return res.data;
}
