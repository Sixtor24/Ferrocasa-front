import { apiRequest } from '../client';
import type {
  ApiDesincorporacionTerreno,
  ApiItemResponse,
  ApiListResponse,
} from '../types';

export type DesincorporacionesQuery = {
  page?: number;
  limit?: number;
};

export type DesincorporacionesRangoFechasQuery = DesincorporacionesQuery & {
  fecha_inicio: string;
  fecha_fin: string;
};

export type DesincorporacionPayload = {
  id_protocolo: number;
  cantidad_m2: number;
  fecha_desincorporacion: string;
};

function mapDesincorporacionesList(res: ApiListResponse<ApiDesincorporacionTerreno>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchDesincorporaciones(query: DesincorporacionesQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiDesincorporacionTerreno>>('/desincorporaciones', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    },
  });

  return mapDesincorporacionesList(res);
}

export async function fetchDesincorporacionById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiDesincorporacionTerreno>>(`/desincorporaciones/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchDesincorporacionesByProtocolo(protocoloId: number) {
  const res = await apiRequest<ApiItemResponse<ApiDesincorporacionTerreno[]> | ApiListResponse<ApiDesincorporacionTerreno>>(
    `/desincorporaciones/protocolo/${protocoloId}`
  );

  return res.data ?? [];
}

export async function fetchDesincorporacionesByParcela(parcelaId: number | string) {
  const res = await apiRequest<ApiItemResponse<ApiDesincorporacionTerreno[]> | ApiListResponse<ApiDesincorporacionTerreno>>(
    `/desincorporaciones/parcela/${encodeURIComponent(String(parcelaId))}`
  );

  return res.data ?? [];
}

export async function fetchDesincorporacionesByRangoFechas(query: DesincorporacionesRangoFechasQuery) {
  const res = await apiRequest<ApiListResponse<ApiDesincorporacionTerreno>>('/desincorporaciones/rango-fechas', {
    params: {
      fecha_inicio: query.fecha_inicio,
      fecha_fin: query.fecha_fin,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    },
  });

  return mapDesincorporacionesList(res);
}

export async function createDesincorporacion(body: DesincorporacionPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDesincorporacionTerreno>>('/desincorporaciones', {
    method: 'POST',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateDesincorporacion(id: number, body: DesincorporacionPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDesincorporacionTerreno>>(`/desincorporaciones/${id}`, {
    method: 'PUT',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteDesincorporacion(id: number) {
  await apiRequest(`/desincorporaciones/${id}`, { method: 'DELETE' });
}
