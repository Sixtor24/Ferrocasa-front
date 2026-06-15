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
import { isEntityAlreadyExistsError } from '../../utils/apiErrorMessage';
import { readDocumentoId } from '../../utils/vehiculoApiFields';

/** POST /documentos para registro de vehículos (CreateDocumento en OpenAPI). */
export type DocumentoVehiculoPayload = {
  id_doc: string;
  nombre_proveedor?: string;
  forma_adquisicion: FormaAdquisicionDocumento;
  fecha_adquisicion?: string | null;
  moneda: MonedaDocumento;
};

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

function documentoIdPath(id: number | string): string {
  return encodeURIComponent(String(id));
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

export async function fetchDocumentoById(id: number | string) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>(`/documentos/${documentoIdPath(id)}`);
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

export async function fetchDocumentoBienes(id: number | string) {
  const res = await apiRequest<ApiItemResponse<ApiBien[]> | ApiListResponse<ApiBien>>(
    `/documentos/${documentoIdPath(id)}/bienes`,
  );
  return (res.data ?? []).map((bien) => mapApiBienToBienMueble(bien));
}

export async function fetchDocumentoVehiculos(id: number | string) {
  const res = await apiRequest<ApiItemResponse<ApiVehiculo[]> | ApiListResponse<ApiVehiculo>>(
    `/documentos/${documentoIdPath(id)}/vehiculos`,
  );
  return (res.data ?? []).map((vehiculo) => mapApiVehiculoToVehiculo(vehiculo));
}

export async function createDocumento(body: DocumentoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>('/documentos', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function createDocumentoVehiculo(body: DocumentoVehiculoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>('/documentos', {
    method: 'POST',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  const idDoc = readDocumentoId(res.data);
  return { ...res.data, id_doc: idDoc };
}

/** Crea el documento o reutiliza uno existente con el mismo id_doc (nro de documento). */
export async function ensureDocumentoVehiculo(body: DocumentoVehiculoPayload) {
  const idDoc = body.id_doc.trim();
  try {
    const doc = await createDocumentoVehiculo({ ...body, id_doc: idDoc });
    return { doc, created: true as const };
  } catch (err) {
    if (!isEntityAlreadyExistsError(err)) throw err;
    try {
      const doc = await fetchDocumentoById(idDoc);
      return { doc: { ...doc, id_doc: readDocumentoId(doc) }, created: false as const };
    } catch {
      const list = await fetchDocumentos({ search: idDoc, limit: 100 });
      const doc = list.data.find(
        (row) =>
          readDocumentoId(row) === idDoc
          || row.numero_documento?.trim() === idDoc,
      );
      if (!doc) throw new Error(`Documento no encontrado: ${idDoc}`);
      return { doc: { ...doc, id_doc: readDocumentoId(doc) }, created: false as const };
    }
  }
}

export async function updateDocumento(id: number | string, body: DocumentoPayload) {
  const res = await apiRequest<ApiItemResponse<ApiDocumento>>(`/documentos/${documentoIdPath(id)}`, {
    method: 'PUT',
    body,
  });
  if (!res.data) throw new Error('Respuesta vacía del API');

  return res.data;
}

export async function deleteDocumento(id: number | string) {
  await apiRequest(`/documentos/${documentoIdPath(id)}`, { method: 'DELETE' });
}
