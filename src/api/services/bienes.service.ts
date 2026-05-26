import { apiRequest } from '../client';
import type {
  ApiBien,
  ApiBienesEstadisticas,
  ApiItemResponse,
  ApiListResponse,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import type { BienMueble } from '../../types/bien';

export type BienesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchBienes(query: BienesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiBien>>('/bienes', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 100,
      search: query.search,
    },
  });
  return {
    data: res.data.map(mapApiBienToBienMueble),
    meta: res.meta,
  };
}

export async function fetchBienByCodigo(codigo: number): Promise<BienMueble> {
  const res = await apiRequest<ApiItemResponse<ApiBien>>(`/bienes/${codigo}`);
  return mapApiBienToBienMueble(res.data);
}

export async function fetchBienesEstadisticas(): Promise<ApiBienesEstadisticas> {
  const res = await apiRequest<ApiItemResponse<ApiBienesEstadisticas>>('/bienes/estadisticas');
  return res.data;
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
