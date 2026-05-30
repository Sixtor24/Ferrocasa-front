import { apiRequest } from '../client';
import type { ApiItemResponse, ApiListResponse, ApiParcela, ApiPropiedad } from '../types';
import {
  mapApiParcelaToInmueble,
  mapApiParcelaToTerreno,
} from '../mappers/parcela.mapper';

export type PropiedadesQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

export type PropiedadPayload = {
  numero_propiedad: number;
  nombre: string;
  ubicacion: string;
};

export type UpdatePropiedadPayload = Omit<PropiedadPayload, 'numero_propiedad'>;

function mapPropiedadesList(res: ApiListResponse<ApiPropiedad>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapPropiedadParcelas(rows: ApiParcela[]) {
  return {
    data: rows,
    terrenos: rows.map(mapApiParcelaToTerreno),
    inmuebles: rows.map(mapApiParcelaToInmueble),
  };
}

export async function fetchPropiedades(query: PropiedadesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiPropiedad>>('/propiedades', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
    },
  });

  return mapPropiedadesList(res);
}

export async function fetchPropiedadById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiPropiedad>>(`/propiedades/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function searchPropiedades(query: Required<Pick<PropiedadesQuery, 'search'>> & Pick<PropiedadesQuery, 'page' | 'limit'>) {
  const res = await apiRequest<ApiListResponse<ApiPropiedad>>('/propiedades/buscar', {
    params: {
      search: query.search,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    },
  });

  return mapPropiedadesList(res);
}

export async function fetchPropiedadParcelas(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>(
    `/propiedades/${id}/parcelas`
  );

  return mapPropiedadParcelas(res.data ?? []);
}

export async function createPropiedad(body: PropiedadPayload) {
  const res = await apiRequest<ApiItemResponse<ApiPropiedad>>('/propiedades', {
    method: 'POST',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updatePropiedad(id: number, body: UpdatePropiedadPayload) {
  const res = await apiRequest<ApiItemResponse<ApiPropiedad>>(`/propiedades/${id}`, {
    method: 'PUT',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deletePropiedad(id: number) {
  await apiRequest(`/propiedades/${id}`, { method: 'DELETE' });
}
