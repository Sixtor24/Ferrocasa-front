import { apiRequest } from '../client';
import type {
  ApiDocumentoPropiedad,
  ApiItemResponse,
  ApiListResponse,
  ApiParcela,
} from '../types';
import {
  mapApiParcelaToInmueble,
  mapApiParcelaToTerreno,
} from '../mappers/parcela.mapper';

export type FormaAdquisicionPropiedad = 'Compra' | 'Donacion' | 'Confiscacion';

export type DocumentosPropiedadQuery = {
  page?: number;
  limit?: number;
  numero_propiedad?: number;
  forma_adquisicion?: FormaAdquisicionPropiedad;
};

export type DocumentoPropiedadPayload = {
  numero_documento?: string;
  numero_propiedad: number;
  forma_adquisicion: FormaAdquisicionPropiedad;
  area_total_m2: number;
  fecha_adquisicion?: string;
  valor_adquisicion?: number | null;
  moneda?: 'Bs' | 'USD' | 'EUR' | string;
};

function mapDocumentosPropiedadList(res: ApiListResponse<ApiDocumentoPropiedad>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

function mapDocumentoPropiedadParcelas(rows: ApiParcela[]) {
  return {
    data: rows,
    terrenos: rows.map(mapApiParcelaToTerreno),
    inmuebles: rows.map(mapApiParcelaToInmueble),
  };
}

export async function fetchDocumentosPropiedad(query: DocumentosPropiedadQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiDocumentoPropiedad>>('/documentos-propiedad', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      numero_propiedad: query.numero_propiedad,
      forma_adquisicion: query.forma_adquisicion,
    },
  });

  return mapDocumentosPropiedadList(res);
}

export async function fetchDocumentoPropiedadById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiDocumentoPropiedad>>(`/documentos-propiedad/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchDocumentosByPropiedad(propiedadId: number) {
  const res = await apiRequest<ApiItemResponse<ApiDocumentoPropiedad[]> | ApiListResponse<ApiDocumentoPropiedad>>(
    `/documentos-propiedad/propiedad/${propiedadId}`
  );

  return res.data ?? [];
}

export async function fetchDocumentoPropiedadParcelas(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiParcela[]> | ApiListResponse<ApiParcela>>(
    `/documentos-propiedad/${id}/parcelas`
  );

  return mapDocumentoPropiedadParcelas(res.data ?? []);
}

export async function createDocumentoPropiedad(body: DocumentoPropiedadPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumentoPropiedad>>('/documentos-propiedad', {
    method: 'POST',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateDocumentoPropiedad(id: number, body: DocumentoPropiedadPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumentoPropiedad>>(`/documentos-propiedad/${id}`, {
    method: 'PUT',
    body,
  });

  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteDocumentoPropiedad(id: number) {
  await apiRequest(`/documentos-propiedad/${id}`, { method: 'DELETE' });
}
