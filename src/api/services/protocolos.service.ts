import { apiRequest } from '../client';
import type {
  ApiCompromisoTerreno,
  ApiDesincorporacionTerreno,
  ApiItemResponse,
  ApiListResponse,
  ApiProtocolo,
} from '../types';

export type MotivoProtocolo =
  | 'Venta'
  | 'Ejecucion_de_obras'
  | 'Afectado_por_bienhechurias_de_FMO';

export type ProtocolosQuery = {
  page?: number;
  limit?: number;
  motivo?: MotivoProtocolo;
};

export type ProtocoloPayload = {
  motivo: MotivoProtocolo;
  /** Cédula `V-12345678` o código `BEN-0001` del beneficiario registrado en el API. */
  id_beneficiado?: string | null;
  fecha_protocolo: string;
};

function mapProtocolosList(res: ApiListResponse<ApiProtocolo>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchProtocolos(query: ProtocolosQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiProtocolo>>('/protocolos', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      motivo: query.motivo,
    },
  });

  return mapProtocolosList(res);
}

export async function fetchProtocoloById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiProtocolo>>(`/protocolos/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchProtocolosByMotivo(motivo: MotivoProtocolo) {
  const res = await apiRequest<ApiItemResponse<ApiProtocolo[]> | ApiListResponse<ApiProtocolo>>(
    `/protocolos/motivo/${encodeURIComponent(motivo)}`
  );

  return res.data ?? [];
}

export async function fetchProtocoloDesincorporaciones(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiDesincorporacionTerreno[]> | ApiListResponse<ApiDesincorporacionTerreno>>(
    `/protocolos/${id}/desincorporaciones`
  );

  return res.data ?? [];
}

export async function fetchProtocoloCompromisos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiCompromisoTerreno[]> | ApiListResponse<ApiCompromisoTerreno>>(
    `/protocolos/${id}/compromisos`
  );

  return res.data ?? [];
}

export async function createProtocolo(body: ProtocoloPayload) {
  const res = await apiRequest<ApiItemResponse<ApiProtocolo>>('/protocolos', {
    method: 'POST',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateProtocolo(id: number, body: ProtocoloPayload) {
  const res = await apiRequest<ApiItemResponse<ApiProtocolo>>(`/protocolos/${id}`, {
    method: 'PUT',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteProtocolo(id: number) {
  await apiRequest(`/protocolos/${id}`, { method: 'DELETE' });
}
