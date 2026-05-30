import { apiRequest } from '../client';
import type {
  ApiBien,
  ApiBienesEstadisticas,
  ApiItemResponse,
  ApiListResponse,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import type { BienMueble } from '../../types/bien';
import { allowMockFallback, shouldFallbackToMockList, useMockDataOnly } from '../mockConfig';
import { shouldUseMockForListEndpoint } from '../mockListProbe';
import {
  getMockBienById,
  getMockBienes,
  mockBienesEstadisticas,
} from '../mockResponses';

export type BienesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchBienes(query: BienesQuery = {}) {
  if (useMockDataOnly()) return getMockBienes(query);

  try {
    const res = await apiRequest<ApiListResponse<ApiBien>>('/bienes', {
      params: {
        page: query.page ?? 1,
        limit: query.limit ?? 100,
        search: query.search,
      },
    });
    const rows = res.data ?? [];
    if (shouldFallbackToMockList(rows.length)) return getMockBienes(query);
    return {
      data: rows.map(mapApiBienToBienMueble),
      meta: res.meta ?? { page: 1, limit: 100, total: rows.length, totalPages: 1 },
    };
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return getMockBienes(query);
  }
}

export async function fetchBienByCodigo(codigo: number): Promise<BienMueble> {
  if (useMockDataOnly()) return getMockBienById(codigo);

  try {
    const res = await apiRequest<ApiItemResponse<ApiBien>>(`/bienes/${codigo}`);
    if (!res.data) throw new Error('Respuesta vacía del API');
    return mapApiBienToBienMueble(res.data);
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return getMockBienById(codigo);
  }
}

export async function fetchBienesEstadisticas(): Promise<ApiBienesEstadisticas> {
  if (useMockDataOnly()) return mockBienesEstadisticas;

  try {
    if (await shouldUseMockForListEndpoint('/bienes')) return mockBienesEstadisticas;
    const res = await apiRequest<ApiItemResponse<ApiBienesEstadisticas>>('/bienes/estadisticas');
    return res.data ?? mockBienesEstadisticas;
  } catch (err) {
    if (!allowMockFallback()) throw err;
    return mockBienesEstadisticas;
  }
}

export async function createBien(body: Record<string, unknown>) {
  const res = await apiRequest<ApiItemResponse<ApiBien>>('/bienes', {
    method: 'POST',
    body,
  });
  return mapApiBienToBienMueble(res.data);
}

export async function deleteBien(codigo: number) {
  await apiRequest(`/bienes/${codigo}`, { method: 'DELETE' });
}
