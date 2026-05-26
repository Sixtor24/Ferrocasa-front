import { apiRequest } from '../client';
import type { ApiItemResponse, ApiListResponse, ApiPropiedad } from '../types';

export type PropiedadesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchPropiedades(query: PropiedadesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiPropiedad>>('/propiedades', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 100,
      search: query.search,
    },
  });
  return res;
}

export async function fetchPropiedadById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiPropiedad>>(`/propiedades/${id}`);
  return res.data;
}

export async function createPropiedad(body: {
  numero_propiedad: number;
  nombre: string;
  ubicacion?: string;
}) {
  const res = await apiRequest<ApiItemResponse<ApiPropiedad>>('/propiedades', {
    method: 'POST',
    body,
  });
  return res.data;
}
