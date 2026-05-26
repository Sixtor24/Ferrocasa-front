import { apiRequest } from '../client';
import type {
  ApiItemResponse,
  ApiListResponse,
  ApiVehiculo,
  ApiVehiculosEstadisticas,
} from '../types';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';
import type { Vehiculo } from '../../types/vehiculo';
import { allowMockFallback, shouldFallbackToMockList, useMockDataOnly } from '../mockConfig';
import {
  getMockVehiculoById,
  getMockVehiculos,
  mockVehiculosEstadisticas,
} from '../mockResponses';

export type VehiculosQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchVehiculos(query: VehiculosQuery = {}) {
  if (useMockDataOnly()) return getMockVehiculos(query);

  try {
    const res = await apiRequest<ApiListResponse<ApiVehiculo>>('/vehiculos', {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 100,
        search: query.search,
      },
    });
    const rows = res.data ?? [];
    if (shouldFallbackToMockList(rows.length)) return getMockVehiculos(query);
    return {
      data: rows.map(mapApiVehiculoToVehiculo),
      meta: res.meta ?? { page: 1, limit: 100, total: rows.length, totalPages: 1 },
    };
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return getMockVehiculos(query);
  }
}

export async function fetchVehiculoById(id: number): Promise<Vehiculo> {
  if (useMockDataOnly()) return getMockVehiculoById(id);

  try {
    const res = await apiRequest<ApiItemResponse<ApiVehiculo>>(`/vehiculos/${id}`);
    if (!res.data) throw new Error('Respuesta vacía del API');
    return mapApiVehiculoToVehiculo(res.data);
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return getMockVehiculoById(id);
  }
}

export async function fetchVehiculosEstadisticas(): Promise<ApiVehiculosEstadisticas> {
  if (useMockDataOnly()) return mockVehiculosEstadisticas;

  try {
    const res = await apiRequest<ApiItemResponse<ApiVehiculosEstadisticas>>('/vehiculos/estadisticas');
    return res.data ?? mockVehiculosEstadisticas;
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return mockVehiculosEstadisticas;
  }
}
