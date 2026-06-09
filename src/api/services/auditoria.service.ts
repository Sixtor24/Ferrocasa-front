import { apiRequest } from '../client';
import { listParams, MODULE_PAGE_SIZE, type PaginatedResult } from '../pagination';
import type { ApiItemResponse, ApiListResponse } from '../types';
import type {
  AuditoriaAccion,
  AuditoriaRegistroApi,
  AuditoriaResumenApi,
} from '../../types/auditoria';

export type AuditoriaQuery = {
  page?: number;
  limit?: number;
  nombre_tabla?: string;
  id_registro?: number;
  id_usuario?: number;
  accion?: AuditoriaAccion;
  fecha_desde?: string;
  fecha_hasta?: string;
};

export type AuditoriaFechasQuery = AuditoriaQuery & {
  fecha_desde: string;
  fecha_hasta: string;
};

function mapAuditoriaList(res: ApiListResponse<AuditoriaRegistroApi>): PaginatedResult<AuditoriaRegistroApi> {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? {
      page: 1,
      limit: rows.length,
      total: rows.length,
      totalPages: 1,
    },
  };
}

export async function fetchAuditoria(query: AuditoriaQuery = {}) {
  const paging = listParams(query.page, query.limit, MODULE_PAGE_SIZE);
  const res = await apiRequest<ApiListResponse<AuditoriaRegistroApi>>('/auditoria', {
    params: {
      ...paging,
      nombre_tabla: query.nombre_tabla,
      id_registro: query.id_registro,
      id_usuario: query.id_usuario,
      accion: query.accion,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
    },
  });
  return mapAuditoriaList(res);
}

export async function fetchAuditoriaPorFechas(query: AuditoriaFechasQuery) {
  const paging = listParams(query.page, query.limit, MODULE_PAGE_SIZE);
  const res = await apiRequest<ApiListResponse<AuditoriaRegistroApi>>('/auditoria/fechas', {
    params: {
      ...paging,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
      nombre_tabla: query.nombre_tabla,
      accion: query.accion,
    },
  });
  return mapAuditoriaList(res);
}

export async function fetchAuditoriaResumen() {
  const res = await apiRequest<ApiItemResponse<AuditoriaResumenApi>>('/auditoria/resumen');
  return res.data;
}

export async function fetchAuditoriaCambiosRecientes(query: {
  limit?: number;
  nombre_tabla?: string;
  accion?: AuditoriaAccion;
} = {}) {
  const res = await apiRequest<ApiItemResponse<AuditoriaRegistroApi[]>>('/auditoria/cambios-recientes', {
    params: {
      limit: query.limit ?? 20,
      nombre_tabla: query.nombre_tabla,
      accion: query.accion,
    },
  });
  return res.data ?? [];
}

export async function fetchAuditoriaPorTablaRegistro(
  nombreTabla: string,
  idRegistro: number,
  query: { page?: number; limit?: number } = {},
) {
  const paging = listParams(query.page, query.limit, MODULE_PAGE_SIZE);
  const res = await apiRequest<ApiListResponse<AuditoriaRegistroApi>>(
    `/auditoria/tabla/${encodeURIComponent(nombreTabla)}/${idRegistro}`,
    { params: paging },
  );
  return mapAuditoriaList(res);
}

export async function fetchAuditoriaPorUsuario(
  idUsuario: number,
  query: { page?: number; limit?: number } = {},
) {
  const paging = listParams(query.page, query.limit, MODULE_PAGE_SIZE);
  const res = await apiRequest<ApiListResponse<AuditoriaRegistroApi>>(
    `/auditoria/usuario/${idUsuario}`,
    { params: paging },
  );
  return mapAuditoriaList(res);
}

export async function fetchAuditoriaById(id: number) {
  const res = await apiRequest<ApiItemResponse<AuditoriaRegistroApi>>(`/auditoria/${id}`);
  return res.data;
}
