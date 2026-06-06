import { apiRequest } from '../client';
import type {
  ApiBien,
  ApiDocumento,
  ApiDocumentosTotalesPorMes,
  ApiItemResponse,
  ApiListResponse,
  ApiVehiculo,
} from '../types';
import { mapApiBienToBienMueble } from '../mappers/bien.mapper';
import { mapApiVehiculoToVehiculo } from '../mappers/vehiculo.mapper';

export type FormaAdquisicionDocumento = 'Compra' | 'Donacion' | 'Confiscacion';
export type MonedaDocumento = 'VES' | 'USD' | 'EUR';

export type DocumentosQuery = {
  page?: number;
  limit?: number;
  search?: string;
  forma_adquisicion?: FormaAdquisicionDocumento;
  moneda?: MonedaDocumento;
};

export type DocumentosRangoFechasQuery = {
  fecha_inicio: string;
  fecha_fin: string;
};

export type DocumentoPayload = {
  numero_documento?: string;
  nombre_proveedor: string;
  forma_adquisicion: FormaAdquisicionDocumento;
  fecha_adquisicion: string;
  moneda: MonedaDocumento;
  id_sede?: number;
};

function mapDocumentosList(res: ApiListResponse<ApiDocumento>) {
  const rows = res.data ?? [];
  return {
    data: rows,
    meta: res.meta ?? { page: 1, limit: rows.length, total: rows.length, totalPages: 1 },
  };
}

export async function fetchDocumentos(query: DocumentosQuery = {}) {
  const res = await apiRequest<ApiListResponse<ApiDocumento>>('/documentos', {
    params: {
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      forma_adquisicion: query.forma_adquisicion,
      moneda: query.moneda,
    },
  });

  return mapDocumentosList(res);
}

export async function fetchDocumentoById(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>(`/documentos/${id}`);
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchDocumentosByRangoFechas(query: DocumentosRangoFechasQuery) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento[]> | ApiListResponse<ApiDocumento>>(
    '/documentos/rango-fechas',
    {
      params: {
        fecha_inicio: query.fecha_inicio,
        fecha_fin: query.fecha_fin,
      },
    }
  );

  return res.data ?? [];
}

export async function fetchDocumentosTotalesPorMes(anio?: number) {
  const res = await apiRequest<ApiItemResponse<ApiDocumentosTotalesPorMes>>('/documentos/total-por-mes', {
    params: { anio },
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function fetchDocumentosByProveedor(nombre: string) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento[]> | ApiListResponse<ApiDocumento>>(
    `/documentos/proveedor/${encodeURIComponent(nombre)}`
  );

  return res.data ?? [];
}

export async function fetchDocumentoBienes(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(`/documentos/${id}/bienes`);
  return (res.data ?? []).map(mapApiBienToBienMueble);
}

export async function fetchDocumentoVehiculos(id: number) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/documentos/${id}/vehiculos`
  );
  return (res.data ?? []).map(mapApiVehiculoToVehiculo);
}

export async function createDocumento(body: DocumentoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>('/documentos', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function updateDocumento(id: number, body: DocumentoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>(`/documentos/${id}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteDocumento(id: number) {
  await apiRequest(`/documentos/${id}`, { method: 'DELETE' });
}
