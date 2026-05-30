import { apiRequest } from '../client';
import type {
  ApiCompromisoTerreno,
  ApiItemResponse,
  ApiListResponse,
} from '../types';

export type CompromisosQuery = {
  page?: number;
  limit?: number;
};

export type CompromisoPayload = {
  id_protocolo: number;
  cantidad_m2: number;
  fecha_compromiso: string;
};

function mapCompromisosList(res: ApiListResponse<ApiCompromisoTerreno>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchCompromisos(query: CompromisosQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiCompromisoTerreno>>('/compromisos', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    },
  });

  return mapCompromisosList(res);
}

export async function fetchCompromisoById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno>>(`/compromisos/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchCompromisosByProtocolo(protocoloId: number) {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno[]> | ApiListResponse<ApiCompromisoTerreno>>(
    `/compromisos/protocolo/${protocoloId}`
  );

  return res.data ?? [];
}

export async function fetchCompromisosByParcela(parcelaId: number) {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno[]> | ApiListResponse<ApiCompromisoTerreno>>(
    `/compromisos/parcela/${parcelaId}`
  );

  return res.data ?? [];
}

export async function fetchCompromisosActivos() {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno[]> | ApiListResponse<ApiCompromisoTerreno>>(
    '/compromisos/activos'
  );

  return res.data ?? [];
}

export async function createCompromiso(body: CompromisoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno>>('/compromisos', {
    method: 'POST',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateCompromiso(id: number, body: CompromisoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno>>(`/compromisos/${id}`, {
    method: 'PUT',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteCompromiso(id: number) {
  await apiRequest(`/compromisos/${id}`, { method: 'DELETE' });
}
